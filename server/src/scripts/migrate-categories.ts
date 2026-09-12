// Migração one-time: cria categorias a partir dos valores distintos de Product.category
// e vincula Product.categoryId.
// Executar: cd server && npx tsx src/scripts/migrate-categories.ts
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"
import { Product } from "../models/product.js"
import { Category, normalizeCategorySlug } from "../models/category.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../../.env") })

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/browsermind"

async function migrate() {
  await mongoose.connect(MONGODB_URI)
  console.log("✅ Conectado:", MONGODB_URI)

  const products = await Product.find({})
  const rawCategories = [...new Set(products.map(p => p.category).filter(Boolean))] as string[]

  let created = 0
  let linked = 0

  for (const categoryRaw of rawCategories) {
    // Remove markdown (asteriscos) e espaços extras do nome exibido
    const name = categoryRaw.replace(/\*+/g, "").trim()
    if (!name) continue

    const slug = normalizeCategorySlug(name)
    let category = await Category.findOne({ slug })
    if (!category) {
      category = await Category.create({ name })
      created++
    }

    const result = await Product.updateMany(
      { category: categoryRaw, categoryId: null },
      { $set: { categoryId: category._id } }
    )
    linked += result.modifiedCount
  }

  console.log(`✅ Categorias criadas: ${created}`)
  console.log(`✅ Produtos vinculados: ${linked}`)

  await mongoose.disconnect()
}

migrate().catch((error) => {
  console.error("❌ Erro na migração:", error)
  process.exit(1)
})
