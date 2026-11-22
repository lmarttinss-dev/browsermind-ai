import { Router } from "express"
import type { Response } from "express"
import mongoose from "mongoose"
import { SupplierRecord } from "../models/supplier.js"
import { Product } from "../models/product.js"

import { migrateSupplierLinks } from "../supplier-links.js"
export const router = Router()
router.use(async (_req, res, next) => { try { await migrateSupplierLinks(); next() } catch { res.status(500).json({ error: "Erro ao preparar vínculos." }) } })
router.post("/:id/analysis", async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ error: "Fornecedor inválido." })
    const supplier = await SupplierRecord.findById(req.params.id)
    if (!supplier) return res.status(404).json({ error: "Fornecedor não encontrado." })
    const { report } = req.body || {}
    if (typeof report !== "string" || !report.trim() || report.length > 200000) return res.status(400).json({ error: "Relatório inválido." })
    const { parseIndividualSupplierReport } = await import("../parse-suppliers.js")
    const parsed = parseIndividualSupplierReport(report, supplier.url)
    await SupplierRecord.updateOne({ _id: supplier._id }, { $set: { individuallyAnalyzed: true, report, supplierType: parsed.supplierType || "", rating: parsed.rating, tradeAssurance: parsed.tradeAssurance, yearsInBusiness: parsed.yearsInBusiness, responseRate: parsed.responseRate, capabilities: parsed.capabilities, certifications: parsed.certifications } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: "Erro ao salvar análise individual." }) }
})
router.post("/from-list-analysis", async (req, res) => {
  try {
    const { productId, report } = req.body || {}
    if (productId && (!mongoose.isObjectIdOrHexString(productId) || !await Product.exists({ _id: productId }))) return res.status(400).json({ error: "Produto inválido." })
    if (typeof report !== "string" || !report.trim() || report.length > 200000) return res.status(400).json({ error: "Relatório inválido." })
    const { parseSuppliersFromReport } = await import("../parse-suppliers.js")
    const parsed = parseSuppliersFromReport(report)
    if (!parsed.length) return res.status(400).json({ error: "Nenhum fornecedor identificado no relatório." })
    for (const item of parsed) {
      let supplier = await SupplierRecord.findOne(item.url ? { url: item.url } : { name: item.name, purchaseOrigin: "import" })
      if (!supplier) supplier = await SupplierRecord.create({ name: item.name, url: item.url, purchaseOrigin: "import", unitPrice: item.unitPrice, moq: item.moq, links: [] })
      if (!supplier.individuallyAnalyzed) await SupplierRecord.updateOne({ _id: supplier._id }, { $set: { unitPrice: item.unitPrice, moq: item.moq, supplierType: item.supplierType || "", rating: item.rating, tradeAssurance: item.tradeAssurance, yearsInBusiness: item.yearsInBusiness, responseRate: item.responseRate, capabilities: item.capabilities, certifications: item.certifications } })
      if (productId) await SupplierRecord.updateOne({ _id: supplier._id, "links.productId": { $ne: productId } }, { $push: { links: { productId, unitPrice: item.unitPrice, moq: item.moq } } })
    }
    res.json({ success: true, count: parsed.length })
  } catch { res.status(500).json({ error: "Erro ao salvar lista de fornecedores." }) }
})
router.post("/from-analysis", async (req, res) => {
  try {
    const { productId, report, url } = req.body || {}
    if (!mongoose.isObjectIdOrHexString(productId) || !await Product.exists({ _id: productId })) return res.status(400).json({ error: "Produto inválido." })
    if (typeof report !== "string" || !report.trim() || report.length > 200000 || typeof url !== "string") return res.status(400).json({ error: "Análise inválida." })
    let parsedUrl: URL
    try { parsedUrl = new URL(url) } catch { return res.status(400).json({ error: "URL inválida." }) }
    if (!["http:", "https:"].includes(parsedUrl.protocol)) return res.status(400).json({ error: "URL inválida." })
    const { parseIndividualSupplierReport } = await import("../parse-suppliers.js")
    const parsed = parseIndividualSupplierReport(report, url)
    let supplier = await SupplierRecord.findOne({ url })
    if (!supplier) supplier = await SupplierRecord.create({ name: parsed.name || parsedUrl.hostname, url, purchaseOrigin: "import", report, links: [] })
    else await SupplierRecord.updateOne({ _id: supplier._id }, { $set: { report } })
    await SupplierRecord.updateOne({ _id: supplier._id, "links.productId": { $ne: productId } }, { $push: { links: { productId, unitPrice: parsed.unitPrice, moq: parsed.moq } } })
    res.json({ success: true, supplierId: supplier._id })
  } catch { res.status(500).json({ error: "Erro ao salvar fornecedor analisado." }) }
})
router.post("/:id/products/:productId", async (req, res) => {
  try {
    const { id, productId } = req.params
    if (!mongoose.isObjectIdOrHexString(id) || !mongoose.isObjectIdOrHexString(productId)) return res.status(400).json({ error: "Identificador inválido." })
    if (!await Product.exists({ _id: productId })) return res.status(404).json({ error: "Produto não encontrado." })
    const supplier = await SupplierRecord.findOneAndUpdate({ _id: id, "links.productId": { $ne: productId } }, { $push: { links: { productId } } }, { returnDocument: "after" })
    if (!supplier) return res.status(409).json({ error: "Fornecedor inexistente ou já vinculado." })
    res.json({ success: true })
  } catch { res.status(500).json({ error: "Erro ao vincular." }) }
})
router.patch("/:id/products/:productId", async (req, res) => {
  try {
    const { id, productId } = req.params
    if (!mongoose.isObjectIdOrHexString(id) || !mongoose.isObjectIdOrHexString(productId)) return res.status(400).json({ error: "Identificador inválido." })
    const supplier = await SupplierRecord.findById(id)
    const link = supplier?.links?.find(item => String(item.productId) === productId)
    if (!supplier || !link) return res.status(404).json({ error: "Vínculo não encontrado." })
    const input = req.body
    const changes: Record<string, unknown> = {}
    for (const key of ["moq", "deliveryTime", "paymentTerms", "domesticFreight", "originCountry", "incoterm", "transportMode", "notes", "currency", "sample"]) {
      if (input[key] === undefined) continue
      if (typeof input[key] !== "string" || input[key].length > 10000) return res.status(400).json({ error: "Condição comercial inválida." })
      changes[key] = input[key].trim()
    }
    if (input.priceAmount !== undefined) {
      if (input.priceAmount !== null && (typeof input.priceAmount !== "number" || !Number.isFinite(input.priceAmount) || input.priceAmount < 0)) return res.status(400).json({ error: "Preço inválido." })
      changes.priceAmount = input.priceAmount
    }
    if (supplier.purchaseOrigin === "domestic") changes.currency = "BRL"
    if (changes.currency !== undefined && !["", "BRL", "USD", "EUR", "CNY"].includes(String(changes.currency))) return res.status(400).json({ error: "Moeda inválida." })
    if (changes.sample !== undefined && !["unknown", "yes", "no"].includes(String(changes.sample))) return res.status(400).json({ error: "Amostra inválida." })
    const amount = changes.priceAmount !== undefined ? changes.priceAmount : link.priceAmount
    if (amount != null && !(changes.currency ?? link.currency)) return res.status(400).json({ error: "Informe a moeda." })
    await SupplierRecord.updateOne({ _id: id, "links.productId": productId }, { $set: Object.fromEntries(Object.entries(changes).map(([key,value]) => ["links.$." + key,value])) }, { runValidators: true })
    res.json({ success: true })
  } catch { res.status(500).json({ error: "Erro ao salvar condições." }) }
})
router.delete("/:id/products/:productId", async (req, res) => {
  try {
    const { id, productId } = req.params
    if (!mongoose.isObjectIdOrHexString(id) || !mongoose.isObjectIdOrHexString(productId)) return res.status(400).json({ error: "Identificador inválido." })
    await SupplierRecord.updateOne({ _id: id }, { $pull: { links: { productId } } })
    res.json({ success: true })
  } catch { res.status(500).json({ error: "Erro ao desvincular." }) }
})

const fields = ["name", "contact", "email", "phone", "country", "url", "status", "unitPrice", "moq", "deliveryTime", "paymentTerms", "notes", "purchaseOrigin", "currency", "legalName", "taxId", "state", "city", "invoice", "domesticFreight", "originCountry", "contactChannel", "incoterm", "transportMode", "sample"] as const
async function validate(body: unknown, creating: boolean) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Dados inválidos.")
  const input = body as Record<string, unknown>
  const data: Record<string, unknown> = {}
  for (const field of fields) {
    if (input[field] === undefined) continue
    if (typeof input[field] !== "string" || input[field].length > (field === "notes" ? 10000 : 500)) throw new Error("Campo inválido: " + field)
    data[field] = input[field].trim()
  }
  if ((creating || data.name !== undefined) && (!data.name || String(data.name).length > 200)) throw new Error("Informe um nome com até 200 caracteres.")
  if (data.status !== undefined && !["prospect", "negotiating", "approved", "inactive"].includes(String(data.status))) throw new Error("Status inválido.")
  if (creating && !["domestic", "import"].includes(String(data.purchaseOrigin))) throw new Error("Selecione a origem da compra.")
  if (data.purchaseOrigin !== undefined && !["unknown", "domestic", "import"].includes(String(data.purchaseOrigin))) throw new Error("Origem da compra inválida.")
  if (data.currency !== undefined && !["", "BRL", "USD", "EUR", "CNY"].includes(String(data.currency))) throw new Error("Moeda inválida.")
  for (const key of ["invoice", "sample"]) {
    if (data[key] !== undefined && !["unknown", "yes", "no"].includes(String(data[key]))) throw new Error("Opção inválida: " + key)
  }
  if (input.priceAmount !== undefined) {
    if (input.priceAmount !== null && (typeof input.priceAmount !== "number" || !Number.isFinite(input.priceAmount) || input.priceAmount < 0)) throw new Error("Preço unitário inválido.")
    data.priceAmount = input.priceAmount
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) throw new Error("E-mail inválido.")
  if (data.url) {
    let url: URL
    try { url = new URL(String(data.url)) } catch { throw new Error("Informe uma URL completa (https://).") }
    if (!["https:", "http:"].includes(url.protocol)) throw new Error("Use uma URL HTTP ou HTTPS.")
  }
  if (input.productId !== undefined) {
    if (input.productId === null || input.productId === "") data.productId = null
    else {
      if (typeof input.productId !== "string" || !mongoose.isObjectIdOrHexString(input.productId)) throw new Error("Produto inválido.")
      if (!await Product.exists({ _id: input.productId })) throw new Error("Produto não encontrado na esteira.")
      data.productId = input.productId
    }
  }
  return data
}
function failure(res: Response, error: unknown) {
  console.error("Supplier CRUD:", error)
  return res.status(500).json({ error: "Não foi possível concluir a operação. Tente novamente." })
}
router.param("id", (_req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) { res.status(400).json({ error: "Fornecedor inválido." }); return }
  next()
})
router.get("/", async (_req, res) => {
  try {
    const suppliers = await SupplierRecord.find().sort({ name: 1 }).populate("productId", "title stage").populate("links.productId", "title stage imageUrl")
    res.json({ success: true, suppliers })
  } catch (error) { failure(res, error) }
})
router.get("/:id", async (req, res) => {
  try {
    const supplier = await SupplierRecord.findById(req.params.id).populate("productId", "title stage").populate("links.productId", "title stage imageUrl")
    if (!supplier) return res.status(404).json({ error: "Fornecedor não encontrado." })
    res.json({ success: true, supplier })
  } catch (error) { failure(res, error) }
})
for (const method of ["post", "patch"] as const) {
  router[method](method === "post" ? "/" : "/:id", async (req, res) => {
    let data: Record<string, unknown>
    try { data = await validate(req.body, method === "post") }
    catch (error) { return res.status(400).json({ error: (error as Error).message }) }
    try {
      const existing = method === "patch" ? await SupplierRecord.findById((req.params as { id: string }).id) : null
      if (method === "patch" && !existing) return res.status(404).json({ error: "Fornecedor não encontrado." })
      const origin = data.purchaseOrigin ?? existing?.purchaseOrigin
      if (origin === "domestic") data.currency = "BRL"
      const amount = data.priceAmount !== undefined ? data.priceAmount : existing?.priceAmount
      const currency = data.currency ?? existing?.currency
      if (amount != null && !currency) return res.status(400).json({ error: "Informe a moeda do preço unitário." })
      const supplier = method === "post"
        ? await SupplierRecord.create(data)
        : await SupplierRecord.findByIdAndUpdate((req.params as { id: string }).id, { $set: data }, { new: true, runValidators: true })
      if (!supplier) return res.status(404).json({ error: "Fornecedor não encontrado." })
      await supplier.populate([{ path: "productId", select: "title stage" }, { path: "links.productId", select: "title stage imageUrl" }])
      res.status(method === "post" ? 201 : 200).json({ success: true, supplier })
    } catch (error) { failure(res, error) }
  })
}
router.delete("/:id", async (req, res) => {
  try {
    if (!await SupplierRecord.findByIdAndDelete(req.params.id)) return res.status(404).json({ error: "Fornecedor não encontrado." })
    res.json({ success: true })
  } catch (error) { failure(res, error) }
})
export default router
