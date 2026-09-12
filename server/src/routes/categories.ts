import { Router } from "express"
import { Category } from "../models/category.js"
import { Product, PIPELINE_STAGES, COMPETITION_LEVELS } from "../models/product.js"

export const router = Router()
export default router

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
  try {
    const { name, description, color, mlCategoryUrl } = req.body

    if (!name || typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "Campo 'name' é obrigatório" })
    }

    const category = await Category.create({
      name: name.trim(),
      description: description || "",
      color: color || "#3b82f6",
      mlCategoryUrl: mlCategoryUrl || "",
    })

    res.status(201).json({ success: true, category })
  } catch (error) {
    res.status(500).json({ error: "Erro ao criar categoria" })
  }
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
    res.status(500).json({ error: "Erro ao buscar categoria" })
  }
})

// Atualiza categoria
router.patch("/:id", async (req, res) => {
  try {
    const { name, description, color, mlCategoryUrl } = req.body

    const update: Record<string, unknown> = {}
    if (name !== undefined) update.name = name
    if (description !== undefined) update.description = description
    if (color !== undefined) update.color = color
    if (mlCategoryUrl !== undefined) update.mlCategoryUrl = mlCategoryUrl

    const category = await Category.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true })
    if (!category) return res.status(404).json({ error: "Categoria não encontrada" })

    res.json({ success: true, category })
  } catch (error) {
    res.status(500).json({ error: "Erro ao atualizar categoria" })
  }
})

// Remove categoria (desvincula produtos)
router.delete("/:id", async (req, res) => {
  try {
    const category = await Category.findByIdAndDelete(req.params.id)
    if (!category) return res.status(404).json({ error: "Categoria não encontrada" })

    await Product.updateMany({ categoryId: category._id }, { $set: { categoryId: null } })

    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: "Erro ao remover categoria" })
  }
})
