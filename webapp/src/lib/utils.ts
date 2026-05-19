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
