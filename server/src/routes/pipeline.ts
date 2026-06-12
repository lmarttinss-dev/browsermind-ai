import { Router } from "express"
import { Product, PIPELINE_STAGES } from "../models/product.js"

export const router = Router()
export default router

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
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true })
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

// Remover produto
router.delete("/:id", async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ error: "Produto não encontrado" })
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover produto" })
  }
})

// Salvar resultado da calculadora de viabilidade no produto
router.patch("/:id/calculator", async (req, res) => {
  try {
    const { unitCost, roi, contributionMargin, profitPerUnit, multiplier, salePrice, quantity } = req.body

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
        },
      },
      { new: true }
    )

    res.json({ success: true, product: updated })
  } catch (error) {
    res.status(500).json({ error: "Erro ao salvar resultado da calculadora" })
  }
})
