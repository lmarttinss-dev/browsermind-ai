export type CompetitorListing = {
  positions: number[]
  itemId: string | null
  catalogId: string | null
  title: string
  seller: string | null
  url: string | null
  advertising: boolean
  metrics: string
}

/** Runs in the page: keep self-contained so Playwright can serialize it. */
export function extractCompetitorListings(): CompetitorListing[] {
  const roots = document.querySelectorAll(".ui-search-layout__item")
  const cards = Array.from(roots.length ? roots : document.querySelectorAll(".poly-card, .ui-search-result"))
  const listings = new Map<string, CompetitorListing>()

  cards.forEach((card, index) => {
    const titleElement = card.querySelector(".poly-component__title, .ui-search-item__title")
    const candidates = [
      titleElement?.closest("a[href]"),
      titleElement?.querySelector("a[href]"),
      ...Array.from(card.querySelectorAll("a[href]")),
    ]
    const candidate = candidates.flatMap(anchor => {
      if (!anchor) return []
      try {
        const url = new URL(anchor.getAttribute("href") || "", document.baseURI)
        if (!/^https?:$/.test(url.protocol) || !/(^|\.)mercadolivre\.com\.br$/i.test(url.hostname)) return []
        if (!/\/(?:p|up)\/MLB|\/MLB-?\d+|\/mclics\/clicks\//i.test(url.pathname)) return []
        return [{ anchor, url }]
      } catch { return [] }
    })[0]
    const anchor = candidate?.anchor
    const url = candidate?.url || null
    const hash = new URLSearchParams(url?.hash.slice(1) || "")
    const rawItemId = url ? (
      url.searchParams.get("pdp_filters")?.match(/(?:^|\|)item_id:(MLB-?\d+)/i)?.[1]
      || url.searchParams.get("wid")?.match(/\bMLB-?\d+\b/i)?.[0]
      || hash.get("wid")?.match(/\bMLB-?\d+\b/i)?.[0]
      || (!/\/(?:p|up)\//i.test(url.pathname) ? url.pathname.match(/\bMLB-?\d+\b/i)?.[0] : null)
    ) : null
    const id = rawItemId ? rawItemId.replace("-", "").toUpperCase() : null
    const catalogId = url?.pathname.match(/\/(?:p|up)\/(MLBU?\d+)/i)?.[1] || null
    const advertising = !!url && (/^click\d*\./i.test(url.hostname) || hash.get("is_advertising") === "true")
    const metricsElement = card.querySelector(".avantpro-product-container, .avantpro-product-info-container, [data-avantpro]")
    const metrics = ((metricsElement as HTMLElement | null)?.innerText || metricsElement?.textContent || "").trim()
    const lines = metrics.split(/\n/).map(line => line.trim()).filter(Boolean)
    const sellerIndex = lines.findIndex(line => /^(?:Nome do vendedor|Atual ganhador|Vendedor)$/i.test(line))
    const seller = sellerIndex >= 0 ? lines[sellerIndex + 1] || null : null
    const title = (titleElement?.textContent || anchor?.textContent || anchor?.querySelector("img")?.getAttribute("alt") || "").trim()
    if (!title && !url && !metrics) return

    // Sponsored tracking URLs are long and fragile in generated Markdown.
    // Build the standard item permalink only from a real listing ID found in the DOM.
    const reportUrl = url && /^click\d*\./i.test(url.hostname)
      ? (id ? "https://produto.mercadolivre.com.br/MLB-" + id.slice(3) + "-_JM" : null)
      : null
    // Direct catalog URLs still need their offer selectors.
    if (url && !/^click\d*\./i.test(url.hostname)) {
      const filters = url.searchParams.get("pdp_filters")
      const wid = url.searchParams.get("wid")
      const hashWid = hash.get("wid")
      url.search = ""
      if (filters) url.searchParams.set("pdp_filters", filters)
      if (wid) url.searchParams.set("wid", wid)
      url.hash = hashWid ? "wid=" + encodeURIComponent(hashWid) : ""
    }

    const listing: CompetitorListing = {
      positions: [index + 1], itemId: id, catalogId, title,
      seller, url: url && /^click\d*\./i.test(url.hostname) ? reportUrl : url?.href || null, advertising, metrics,
    }
    // Catalog IDs alone must never merge different sellers' offers.
    const key = id || (listing.url ? listing.url + "|" + (seller || "") : "card:" + index)
    const previous = listings.get(key)
    if (!previous) {
      listings.set(key, listing)
    } else {
      const preferred = previous.advertising && !advertising ? listing : previous
      listings.set(key, {
        ...preferred,
        positions: [...previous.positions, index + 1],
        seller: preferred.seller || previous.seller || seller,
        metrics: preferred.metrics || previous.metrics || metrics,
      })
    }
  })
  return Array.from(listings.values())
}

/** Put identities and URLs first, before bulk text can hit the model's context limit. */
export function formatCompetitorListings(listings: CompetitorListing[]): string {
  if (!listings.length) return ""
  const identities = listings.map(({ metrics: _metrics, ...listing }) => listing)
  let remaining = 40000
  const metrics = listings.flatMap(listing => {
    if (!listing.metrics || remaining <= 0) return []
    const text = listing.metrics.slice(0, Math.min(1600, remaining))
    remaining -= text.length
    return [{ itemId: listing.itemId, positions: listing.positions, seller: listing.seller, metrics: text }]
  })
  return [
    "\nAnúncios concorrentes extraídos por card do DOM (ofertas deduplicadas por ID):",
    "Copie o URL completo deste registro, sem abreviar com reticências ou ...; os links patrocinados já foram convertidos em permalinks diretos pela aplicação. Preserve pdp_filters/wid. Não invente links nem atribua métricas agregadas do catálogo ao vendedor.",
    "Identificação e links dos anúncios (a posição é a do card na listagem):",
    JSON.stringify(identities),
    "Métricas do AvantPro associadas ao mesmo card (quando disponíveis):",
    JSON.stringify(metrics),
  ].join("\n")
}


/** Restore authoritative destinations if the model abbreviates or changes a link. */
export function restoreCompetitorReportLinks(report: string, listings: CompetitorListing[]): string {
  if (!listings.length) return report
  const byId = new Map(listings.filter(row => row.itemId && row.url).map(row => [row.itemId!, row.url!]))
  return report.replace(/\[([^\]\n]+)\]\((?:<([^>\n]+)>|([^\s)]+))\)/g, (original, label: string, angleUrl: string, plainUrl: string) => {
    const href = angleUrl || plainUrl
    let decoded = href.replace(/\\&/g, "&")
    try { decoded = decodeURIComponent(decoded) } catch { /* Keep partially encoded model output. */ }
    const offerId = decoded.match(/(?:wid=|item_id:)(MLB-?\d+)/i)?.[1]
      || (!/\/(?:p|up)\//i.test(decoded) ? decoded.match(/\bMLB-?\d+\b/i)?.[0] : null)
      || label.match(/\bMLB-?\d+\b/i)?.[0]
    const id = offerId?.replace("-", "").toUpperCase()
    const url = id ? byId.get(id) : undefined
    if (url) return "[" + label + "](" + url.replace(/\(/g, "%28").replace(/\)/g, "%29") + ")"
    if (/^https?:\/\/click\d*\.mercadolivre\.com\.br(?:\/|$)/i.test(href)) return label + " (Link não disponível)"
    return original
  })
}
