import { Router } from "express"
import { Product, PIPELINE_STAGES } from "../models/product.js"

const router = Router()

// Listar todos os produtos agrupados por stage
router.get("/", async (_req, res) => {
  try {
    const products = await Product.find().sort({ stage: 1, order: 1 })
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

export default router
