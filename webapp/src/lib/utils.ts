export function sanitizeFilename(title: string | null): string {
  const dateFallback = `browsermind-${new Date().toISOString().slice(0, 10)}`

  if (!title) return dateFallback

  // Remove sufixos comuns do Mercado Livre
  const cleaned = title
    .replace(/\s*[|\-–—]\s*(Mercado Livre|MercadoLivre|mercadolivre).*$/i, "")
    .trim()

  if (!cleaned) return dateFallback

  const name = cleaned
    .replace(/[<>:"/\\|?*]+/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100)

  return name || dateFallback
}

export function extractProductSlugFromResponse(response: string): string | null {
  const match = response.match(/\/product-detail\/([^_?\s)]+)/)
  if (!match) return null
  return match[1].replace(/-+$/, "")
}

export function parseReportMetrics(analysisReport: string) {
  const report = analysisReport.replace(/\*\*/g, "")
  const price = parseFloat(
    report.match(/(?:Preço|preço\s*atual)\s*:\s*R?\$?\s*([\d.,]+)/im)?.[1]?.replace(/\./g, "").replace(",", ".") || "0"
  )
  const score = parseFloat(
    report.match(/(?:Score\s*Final|Demanda)\s*:\s*(\d+(?:[.,]\d+)?)/im)?.[1]?.replace(",", ".") || "0"
  )
  const monthlySales = parseInt(
    report.match(/Vendas\s*mensais[^:]*:\s*([\d.,]+)/im)?.[1]?.replace(/\./g, "") || "0"
  )
  const potentialMargin = report.match(/(?:Margem|Potencial\s*de\s*margem)\s*:\s*(.+)/im)?.[1]?.trim() || ""
  return { price, score, monthlySales, potentialMargin }
}
