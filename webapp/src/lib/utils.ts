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

// --- Currency / formatting helpers (padrão brasileiro) ---

/** Extrai valor numérico de string monetária (R$ 1.234,56 → 1234.56) */
export function parseCurrency(value: string): number | null {
  if (!value) return null
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(/\.(?=.*,)/g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

/** Extrai quantidade do MOQ (ignora texto, mantém dígitos) */
export function parseMoq(value: string): number | null {
  if (!value) return null
  const match = value.match(/\d[\d.,]*/)
  if (!match) return null
  const num = parseInt(match[0].replace(/[.,]/g, ""))
  return isNaN(num) ? null : num
}

/** Aplica máscara de entrada: dígitos → R$ 1.234,56 */
export function maskReal(value: string): string {
  const digits = value.replace(/[^0-9]/g, "")
  if (!digits) return ""
  const cents = digits.padStart(3, "0")
  const intPartRaw = cents.slice(0, -2).replace(/^0+/, "") || "0"
  const decPart = cents.slice(-2)
  const intPart = intPartRaw.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `R$ ${intPart},${decPart}`
}

/** Formata número → R$ 1.234,56 via toLocaleString */
export function formatBrl(num: number): string {
  return `R$ ${num.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

/** Calcula custo total do produto: preço unitário × MOQ */
export function calculateProductCost(unitPrice: string, moq: string): string {
  const price = parseCurrency(unitPrice)
  const qty = parseMoq(moq)
  if (price === null || qty === null) return ""
  const total = price * qty
  return maskReal(total.toFixed(2))
}

/** Soma dois valores monetários e retorna formatado */
export function formatTotal(a: string, b: string): string | null {
  const va = parseCurrency(a)
  const vb = parseCurrency(b)
  if (va === null && vb === null) return null
  const total = (va || 0) + (vb || 0)
  return formatBrl(total)
}

/** Custo unitário com frete: (custo produto + frete) / MOQ */
export function calculateUnitCost(totalProduct: string, totalShipping: string, moq: string): string | null {
  const productCost = parseCurrency(totalProduct)
  const shippingCost = parseCurrency(totalShipping)
  const qty = parseMoq(moq)
  if (productCost === null && shippingCost === null) return null
  if (!qty || qty <= 0) return null
  const total = (productCost || 0) + (shippingCost || 0)
  return formatBrl(total / qty)
}
