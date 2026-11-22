import { Router } from "express"
import mongoose from "mongoose"
import { Category, normalizeCategorySlug } from "../models/category.js"
import { Product, PIPELINE_STAGES, COMPETITION_LEVELS } from "../models/product.js"

export const router = Router()
export default router

router.param("id", (_req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) {
    res.status(400).json({ error: "Categoria inválida." })
    return
  }
  next()
})

function validate(body: unknown, creating: boolean): Record<string, string> {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Dados da categoria inválidos.")
  const input = body as Record<string, unknown>
  const data: Record<string, string> = {}
  for (const [key, limit] of [["name", 200], ["description", 2000], ["color", 7], ["mlCategoryUrl", 2000]] as const) {
    if (input[key] === undefined) continue
    if (typeof input[key] !== "string" || input[key].length > limit) throw new Error("Campo inválido: " + key)
    data[key] = input[key].trim()
  }
  if ((creating || data.name !== undefined) && (!data.name || !normalizeCategorySlug(data.name))) throw new Error("Informe um nome com letras ou números (até 200 caracteres).")
  if (data.color !== undefined && !/^#[0-9a-f]{6}$/i.test(data.color)) throw new Error("Informe uma cor hexadecimal válida.")
  if (data.mlCategoryUrl) {
    let url: URL
    try { url = new URL(data.mlCategoryUrl) } catch { throw new Error("Informe uma URL completa (https://).") }
    if (!["http:", "https:"].includes(url.protocol)) throw new Error("Use uma URL HTTP ou HTTPS.")
  }
  if (data.name !== undefined) data.slug = normalizeCategorySlug(data.name)
  return data
}

function failure(res: import("express").Response, error: unknown) {
  if ((error as { code?: number }).code === 11000) return res.status(409).json({ error: "Já existe uma categoria com esse nome ou um nome equivalente." })
  if ((error as Error).name === "ValidationError" || (error as Error).name === "CastError") return res.status(400).json({ error: "Dados da categoria inválidos." })
  console.error("Category CRUD:", error)
  return res.status(500).json({ error: "Não foi possível concluir a operação. Tente novamente." })
}

// Lista categorias com contagem de produtos vinculados
router.get("/", async (_req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 })

    const counts = await Product.aggregate([
      { $match: { categoryId: { $ne: null } } },
      { $group: { _id: "$categoryId", productCount: { $sum: 1 } } },
    ])
    const countMap = new Map(counts.map(c => [String(c._id), c.productCount]))

    const result = categories.map(c => ({
      ...c.toObject(),
      productCount: countMap.get(String(c._id)) || 0,
    }))

    res.json({ success: true, categories: result })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar categorias" })
  }
})

// Cria categoria
router.post("/", async (req, res) => {
  let data: Record<string, string>
  try { data = validate(req.body, true) }
  catch (error) { return res.status(400).json({ error: (error as Error).message }) }
  try {
    const category = await Category.create(data)
    res.status(201).json({ success: true, category })
  } catch (error) { failure(res, error) }
})

// Detalhe da categoria + produtos vinculados + métricas agregadas
router.get("/:id", async (req, res) => {
  try {
    const category = await Category.findById(req.params.id)
    if (!category) return res.status(404).json({ error: "Categoria não encontrada" })

    const products = await Product.find(
      { categoryId: category._id },
      { analysisReport: 0, supplierReport: 0, marketReport: 0 }
    ).sort({ stage: 1, order: 1 })

    // Métricas agregadas calculadas sobre os produtos vinculados
    const byStage: Record<string, number> = {}
    for (const stage of PIPELINE_STAGES) byStage[stage] = 0

    const competition: Record<string, number> = {}
    for (const level of COMPETITION_LEVELS) competition[level] = 0

    let avgScore = 0
    let totalMonthlySales = 0
    let potentialRevenue = 0
    let suppliersWithQuotes = 0

    for (const p of products) {
      byStage[p.stage] = (byStage[p.stage] || 0) + 1
      competition[p.competitionLevel] = (competition[p.competitionLevel] || 0) + 1
      avgScore += p.score
      totalMonthlySales += p.monthlySales
      potentialRevenue += p.price
      if (p.suppliers?.some(s => s.quotes && s.quotes.length > 0)) suppliersWithQuotes++
    }

    const metrics = {
      totalProducts: products.length,
      byStage,
      avgScore: products.length ? avgScore / products.length : 0,
      totalMonthlySales,
      potentialRevenue,
      competition,
      suppliersWithQuotes,
    }

    res.json({ success: true, category, products, metrics })
  } catch (error) {
    failure(res, error)
  }
})

// Atualiza categoria e o nome exibido nos produtos vinculados
router.patch("/:id", async (req, res) => {
  try {
    let update: Record<string, string>
    try { update = validate(req.body, false) }
    catch (error) { return res.status(400).json({ error: (error as Error).message }) }

    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!category) return res.status(404).json({ error: "Categoria não encontrada" })

    if (update.name !== undefined) {
      await Product.updateMany({ categoryId: category._id }, { $set: { category: category.name } })
    }
    res.json({ success: true, category })
  } catch (error) {
    failure(res, error)
  }
})

// Remove categoria (desvincula produtos)
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ error: "Categoria não encontrada" })

    await Product.updateMany({ categoryId: category._id }, { $set: { categoryId: null, category: "" } })

    res.json({ success: true })
  } catch (error) {
    failure(res, error)
  }
})
