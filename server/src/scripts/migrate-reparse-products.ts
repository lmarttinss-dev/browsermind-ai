// Migração one-time: re-parseia os campos (title, price, monthlySales, score) de
// produtos cujo analysisReport foi gerado antes das correções de parsing
// ("Preço de venda" e título do DOM).
// Executar: cd server && npx tsx src/scripts/migrate-reparse-products.ts
import dotenv from "dotenv"
import path from "path"
import { fileURLToPath } from "url"
import mongoose from "mongoose"
import { Product } from "../models/product.js"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, "../../../.env") })

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/browsermind"

function parseBrPrice(raw: string): number {
  const cleaned = raw.replace(/[R$\s]/g, "").trim()
  if (!cleaned) return 0
  if (cleaned.includes(",")) {
    return parseFloat(cleaned.replace(/\./g, "").replace(",", "."))
  }
  const dotCount = (cleaned.match(/\./g) || []).length
  if (dotCount > 1 || (dotCount === 1 && cleaned.split(".").pop()!.length >= 3)) {
    return parseFloat(cleaned.replace(/\./g, ""))
  }
  return parseFloat(cleaned)
}

function parseBrInt(raw: string): number {
  const cleaned = raw.replace(/[R$\s]/g, "").trim()
  if (!cleaned) return 0
  return parseInt(cleaned.replace(/[.,]/g, ""), 10)
}

function parseMetrics(analysisReport: string) {
  const report = analysisReport.replace(/\*\*/g, "")
  const priceMatch = report.match(/preço(?:\s+(?:atual|de\s+venda(?:\s+atual)?))?\s*:\s*R?\$?\s*([\d.,]+)/im)
  const scoreMatch = report.match(/(?:Demanda|Score\s*Final)\s*:\s*(\d+(?:[.,]\d+)?)/im)
  const salesMatch = report.match(/(?:Vendas\s*mensais|Ritmo\s*atual)[^:\n]*:\s*([\d.,]+)/im)
  return {
    price: priceMatch ? parseBrPrice(priceMatch[1]) : 0,
    monthlySales: salesMatch ? parseBrInt(salesMatch[1]) : 0,
    score: scoreMatch ? parseFloat(scoreMatch[1].replace(",", ".")) : 0,
  }
}

function parseTitle(analysisReport: string): string {
  const report = analysisReport.replace(/\*\*/g, "")

  // Campo em lista: "- Nome: X" / "- Produto: X" — ancorado no início da linha
  // e sem atravessar quebras de linha (evita casar com "no produto: ...").
  const listMatch = report.match(/^[ \t]*[-*]?[ \t]*(?:Nome|Produto\/Nicho|Título|Produto)[ \t]*:[ \t]*(.+?)[ \t]*$/im)
  if (listMatch?.[1]?.trim()) return listMatch[1].trim().slice(0, 200)

  // Campo em tabela: "| Nome | X |" (Resumo para Esteira do relatório de catálogo)
  const tableMatch = report.match(/^[ \t]*\|[ \t]*(?:Nome|Produto|Título)[ \t]*\|[ \t]*([^|]+?)[ \t]*\|/im)
  if (tableMatch?.[1]?.trim()) return tableMatch[1].trim().slice(0, 200)

  return ""
}

async function migrate() {
  await mongoose.connect(MONGODB_URI)
  console.log("✅ Conectado:", MONGODB_URI)

  const products = await Product.find({ analysisReport: { $exists: true, $ne: "" } })
  let updated = 0

  for (const product of products) {
    const parsed = parseMetrics(product.analysisReport || "")
    const parsedTitle = parseTitle(product.analysisReport || "")
    const updates: Record<string, string | number> = {}

    // 1) Corrige título que veio do document.title (ex: "(4) ... | MercadoLivre")
    let newTitle = product.title
    if (parsedTitle && /Mercado\s*Livre/i.test(product.title)) {
      newTitle = parsedTitle
    }
    // 2) Remove markdown (asteriscos) residual do título
    const cleanTitle = newTitle.replace(/\*+/g, "").trim()
    if (cleanTitle && cleanTitle !== product.title) {
      newTitle = cleanTitle
    }
    if (newTitle !== product.title) updates.title = newTitle

    // Só sobrescreve quando o parse encontra um valor diferente do atual
    if (parsed.price !== 0 && parsed.price !== product.price) updates.price = parsed.price
    if (parsed.monthlySales !== 0 && parsed.monthlySales !== product.monthlySales) updates.monthlySales = parsed.monthlySales
    if (parsed.score !== 0 && parsed.score !== product.score) updates.score = parsed.score

    if (Object.keys(updates).length > 0) {
      await Product.updateOne({ _id: product._id }, { $set: updates })
      updated++
      console.log(`🔧 ${product.title.slice(0, 60)} →`, updates)
    }
  }

  console.log(`✅ Produtos atualizados: ${updated}`)
  await mongoose.disconnect()
}

migrate().catch((error) => {
  console.error("❌ Erro na migração:", error)
  process.exit(1)
})
