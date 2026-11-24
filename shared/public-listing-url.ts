/** Only public individual listings; excludes account, seller dashboard and login pages. */
export function isPublicMercadoLivreListingUrl(value: string | null | undefined): boolean {
  if (!value) return false
  try {
    const url = new URL(value)
    if (url.protocol !== "https:" || url.username || url.password || url.port) return false
    if (!["mercadolivre.com.br", "www.mercadolivre.com.br", "produto.mercadolivre.com.br"].includes(url.hostname)) return false
    return /^\/(?:[^/]+\/)?(?:p|up)\/MLBU?\d+\/?$/i.test(url.pathname)
      || /^\/MLB-?\d+(?:-[^/]*)?\/?$/i.test(url.pathname)
  } catch { return false }
}
