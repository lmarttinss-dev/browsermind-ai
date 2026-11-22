import { validateFullMarketDocument, fullMarketDocumentText } from "../full-market-report.js"
import { savedListingReportHtml, savedMarketReportHtml, fullMarketReportHtml, createFullMarketReportPdf } from "../full-market-report-html.js"
import { SupplierRecord } from "../models/supplier.js"
import { Router } from "express"
import { Category } from "../models/category.js"
import { Product, PIPELINE_STAGES } from "../models/product.js"

export const router = Router()
export default router

// A fixed, server-rendered HTML document is the source for both screen and PDF.
router.post("/market-report/export-pdf", async (req, res) => {
  let document
  try { document = validateFullMarketDocument(req.body?.document) }
  catch { return res.status(400).json({ error: "Documento de análise inválido para exportar." }) }
  try {
    const pdf = await createFullMarketReportPdf(fullMarketReportHtml(document))
    res.type("application/pdf").setHeader("Content-Disposition", 'attachment; filename="analise-de-mercado.pdf"')
    res.send(pdf)
  } catch { res.status(500).json({ error: "Não foi possível gerar o PDF. Tente novamente." }) }
})
router.get("/:id/market-report/html", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("+marketDocument")
    if (!product) return res.status(404).send("Produto não encontrado.")
    if (!product.marketReport && !product.marketDocument) return res.status(404).send("Relatório não encontrado.")
    res.setHeader("Cache-Control", "no-store")
    res.type("html").send(savedMarketReportHtml(product))
  } catch { res.status(500).send("Não foi possível carregar o relatório.") }
})
router.get("/:id/market-report/pdf", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).select("+marketDocument")
    if (!product) return res.status(404).json({ error: "Produto não encontrado." })
    if (!product.marketReport && !product.marketDocument) return res.status(404).json({ error: "Relatório não encontrado." })
    const pdf = await createFullMarketReportPdf(savedMarketReportHtml(product))
    res.type("application/pdf").setHeader("Content-Disposition", 'attachment; filename="analise-de-mercado.pdf"')
    res.send(pdf)
  } catch { res.status(500).json({ error: "Não foi possível exportar o relatório em PDF." }) }
})


router.get("/:id/analysis-report/:format", async (req,res) => {
 if(!["html","pdf"].includes(req.params.format))return res.sendStatus(404)
 try {
  const product=await Product.findById(req.params.id).select("+analysisDocument")
  if(!product)return res.status(404).send("Produto não encontrado.")
  if(!product.analysisReport)return res.status(404).send("Relatório não encontrado.")
  const html=product.analysisDocument ? fullMarketReportHtml(product.analysisDocument) : savedListingReportHtml(product)
  res.setHeader("Cache-Control","no-store")
  if(req.params.format==="html")return res.type("html").send(html)
  const pdf=await createFullMarketReportPdf(html)
  res.type("application/pdf").setHeader("Content-Disposition",'attachment; filename="analise-do-anuncio.pdf"')
  res.send(pdf)
 }catch{res.status(500).send("Não foi possível carregar o relatório do anúncio.")}
})

// Listar todos os produtos agrupados por stage (sem relatório para performance)
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find({}, { analysisReport: 0 }).sort({ stage: 1, order: 1 })
    const grouped = Object.fromEntries(
      PIPELINE_STAGES.map(stage => [stage, products.filter(p => p.stage === stage)])
    )
    res.json({ success: true, products: grouped })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produtos" })
  }
})

// Criar produto na esteira
router.post("/", async (req, res) => {
  try {
    const lastProduct = await Product.findOne({ stage: "triagem" }).sort({ order: -1 })
    const order = lastProduct ? lastProduct.order + 1 : 0

    const product = await Product.create({ ...req.body, stage: "triagem", order })
    res.status(201).json({ success: true, product })
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar produto" })
  }
})

// Buscar produto por ID
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: "Produto não encontrado" })
    res.json({ success: true, product })
  } catch (error) {
    res.status(500).json({ error: "Erro ao buscar produto" })
  }
})

// Atualizar produto
router.patch("/:id", async (req, res) => {
  try {
    const update = { ...req.body }
    if (update.marketDocument != null) update.marketDocument = validateFullMarketDocument(update.marketDocument)
    else if (typeof update.marketReport === "string") update.marketDocument = null
    const product = await Product.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!product) return res.status(404).json({ error: "Produto não encontrado" })
    res.json({ success: true, product })
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar produto" })
  }
})

// Mover produto para outra coluna
router.patch("/:id/move", async (req, res) => {
  try {
    const { stage, order } = req.body

    if (!PIPELINE_STAGES.includes(stage)) {
      return res.status(400).json({ error: "Stage inválido" })
    }

    // Atualizar ordens dos produtos na coluna destino
    await Product.updateMany(
      { stage, order: { $gte: order } },
      { $inc: { order: 1 } }
    )

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { stage, order },
      { new: true }
    )

    if (!product) return res.status(404).json({ error: "Produto não encontrado" })
    res.json({ success: true, product })
  } catch (error) {
    res.status(500).json({ error: "Erro ao mover produto" })
  }
})

// Vincular/desvincular categoria ao produto
router.patch("/:id/category", async (req, res) => {
  try {
    const { categoryId } = req.body

    const category = categoryId ? await Category.findById(categoryId) : null
    if (categoryId && !category) {
      return res.status(404).json({ error: "Categoria não encontrada" })
    }
    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { categoryId: category?._id || null, category: category?.name || "" } },
      { new: true }
    )

    if (!product) return res.status(404).json({ error: "Produto não encontrado" })
    res.json({ success: true, product })
  } catch (error) {
    res.status(500).json({ error: "Erro ao vincular categoria" })
  }
})

// Remover produto
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (product) {
      await SupplierRecord.updateMany({ productId: product._id }, { $set: { productId: null } })
      await SupplierRecord.updateMany({ "links.productId": product._id }, { $pull: { links: { productId: product._id } } })
    }
    if (!product) return res.status(404).json({ error: "Produto não encontrado" })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover produto" })
  }
})

// Salvar resultado da calculadora de viabilidade no produto
router.patch("/:id/calculator", async (req, res) => {
  try {
    const { unitCost, roi, contributionMargin, profitPerUnit, multiplier, salePrice, quantity, calculatorState } = req.body
    const results = [unitCost, roi, contributionMargin, profitPerUnit, multiplier, salePrice, quantity]
    if (!results.every(value => typeof value === "number" && Number.isFinite(value))) {
      return res.status(400).json({ error: "Resultados da calculadora inválidos" })
    }
    const savedState = calculatorState == null ? undefined : { ...calculatorState, savedAt: new Date() }
    if (savedState) {
      const validation = new Product({ title: "Validação", url: "validation", calculatorState: savedState }).validateSync()
      if (validation) return res.status(400).json({ error: "Preencha valores válidos na calculadora" })
    }

    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ error: "Produto não encontrado" })

    // Monta seção de análise financeira
    const financialSection = `
## 📊 Análise de Viabilidade Financeira

| Indicador | Valor |
|-----------|-------|
| Custo unitário (R$) | ${unitCost?.toFixed(2) || "—"} |
| Preço de venda (R$) | ${salePrice?.toFixed(2) || "—"} |
| Quantidade | ${quantity || "—"} |
| ROI | ${roi?.toFixed(1) || "—"}% |
| Margem de Contribuição | ${contributionMargin?.toFixed(1) || "—"}% |
| Lucro por unidade (R$) | ${profitPerUnit?.toFixed(2) || "—"} |
| Multiplicador (investimento → retorno) | ${multiplier?.toFixed(2) || "—"}x |

> ⏱ Calculado em ${new Date().toLocaleString("pt-BR")}
`

    // Atualiza o produto (analysisReport é string, não array)
    const updatedAnalysisReport = product.analysisReport
      ? product.analysisReport + "\n\n" + financialSection
      : financialSection

    const updated = await Product.findByIdAndUpdate(
      req.params.id,
      {
        $set: {
          potentialMargin: roi != null ? `${roi.toFixed(0)}%` : product.potentialMargin,
          ...(salePrice != null && { price: salePrice }),
          analysisReport: updatedAnalysisReport,
          ...(savedState && { calculatorState: savedState }),
        },
      },
      { new: true }
    )

    res.json({ success: true, product: updated })
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar resultado da calculadora" })
  }
})

// Salvar relatório de análise de mercado no produto
router.patch("/:id/market-report", async (req, res) => {
  try {
    const { report, document } = req.body
    let validatedDocument
    try { if (document != null) validatedDocument = validateFullMarketDocument(document) }
    catch { return res.status(400).json({ error: "Documento de análise inválido." }) }

    if (!report || typeof report !== "string") {
      return res.status(400).json({ error: "Relatório é obrigatório" })
    }

    const product = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: { marketReport: validatedDocument ? fullMarketDocumentText(validatedDocument) : report, marketDocument: validatedDocument || null } },
      { new: true }
    )

    if (!product) return res.status(404).json({ error: "Produto não encontrado" })
    res.json({ success: true, product })
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar relatório de mercado" })
  }
})
