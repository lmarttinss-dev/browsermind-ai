import type { CompetitorListing } from "./competitor-listings.js"

/** Self-contained: serialized into Chromium by Playwright/tsx. */
export function extractIndividualListing(): CompetitorListing {
  const pageUrl = new URL(location.href)
  if (pageUrl.protocol !== "https:" || !/(^|\.)mercadolivre\.com\.br$/i.test(pageUrl.hostname)) throw new Error("Abra a URL de um anúncio do Mercado Livre no Browser.")
  const title = document.querySelector("h1.ui-pdp-title")?.textContent?.trim()
  if (!title) throw new Error("Esta página não é um anúncio individual. Abra o produto e aguarde o carregamento.")
  const hash = new URLSearchParams(pageUrl.hash.slice(1))
  const adClickId = pageUrl.searchParams.get("ad_click_id")?.trim() || hash.get("ad_click_id")?.trim() || null
  const advertising = !!adClickId
  const catalogId = pageUrl.pathname.match(/\/(?:p|up)\/(MLBU?\d+)/i)?.[1] || null
  const offer = pageUrl.searchParams.get("pdp_filters")?.match(/item_id:(MLB-?\d+)/i)?.[1]
    || pageUrl.searchParams.get("wid") || hash.get("wid")
    || (!catalogId ? pageUrl.pathname.match(/\bMLB-?\d+\b/i)?.[0] : null)
  const itemId = offer?.match(/^MLB-?\d+$/i) ? offer.replace("-", "").toUpperCase() : null
  const parts: string[] = []
  const roots: (Document | ShadowRoot)[] = [document]
  while (roots.length) {
    const root = roots.pop()!
    root.querySelectorAll('[class*=avantpro], [class*=Avantpro], [class*=AvantPro], [data-avantpro]').forEach(element => {
      if (element.closest('.poly-card, .ui-search-layout__item, .ui-pdp-recommendations, .andes-carousel-snapped')) return
      if (element.querySelector('.poly-card, .ui-search-layout__item, .ui-pdp-recommendations, .andes-carousel-snapped')) return
      const value = ((element as HTMLElement).innerText || element.textContent || "").trim()
      if (value && !parts.some(part => part.includes(value))) parts.push(value)
    })
    root.querySelectorAll('*').forEach(element => { if (element.shadowRoot && !element.closest('.poly-card, .ui-search-layout__item, .ui-pdp-recommendations, .andes-carousel-snapped')) roots.push(element.shadowRoot) })
  }
  const metrics = parts.join("\n").slice(0, 24000)
  let seller: string | null = null
  // Prioritize the current offer's "Vendido por" area over generic seller links.
  for (const selector of ['.ui-pdp-seller__label-sold', '.ui-pdp-seller__label-text-with-icon', '.ui-pdp-seller__label-text', '[data-testid="seller-name"]']) {
    for (const element of document.querySelectorAll(selector)) {
      if (element.closest('.poly-card, .ui-search-layout__item, .ui-pdp-recommendations, .andes-carousel-snapped')) continue
      if ((selector === '.ui-pdp-seller__label-text-with-icon' || selector === '.ui-pdp-seller__label-text') && !/vendido\s+por/i.test(element.textContent || '') && !element.querySelector('a')) continue
      const candidate = (element.querySelector('a')?.textContent || element.textContent || '').replace(/^\s*vendido\s+por\s*/i, '').replace(/\s+/g, ' ').trim()
      if (candidate && !/^(ver |informações|dados do vendedor|vendido por$)/i.test(candidate)) { seller = candidate; break }
    }
    if (seller) break
  }
  if (!seller) seller = metrics.match(/(?:^|\n)(?:Nome do vendedor|Atual ganhador|Vendedor)\s*[:\n]\s*([^\n]+)/i)?.[1]?.trim() || null
  if (!seller) {
    for (const element of document.querySelectorAll('.ui-pdp-seller__header__title, .ui-pdp-seller__link-trigger')) {
      if (element.closest('.poly-card, .ui-search-layout__item, .ui-pdp-recommendations, .andes-carousel-snapped')) continue
      const candidate = (element.textContent || '').replace(/^\s*vendido\s+por\s*/i, '').replace(/\s+/g, ' ').trim()
      if (candidate && !/^(ver |informações|dados do vendedor|vendido por$)/i.test(candidate)) { seller = candidate; break }
    }
  }
  const picture = document.querySelector<HTMLImageElement>('.ui-pdp-gallery__figure img, img.ui-pdp-image')
  let imageUrl: string | null = null
  for (const source of [picture?.getAttribute('data-src'), picture?.currentSrc, picture?.getAttribute('src')]) {
    if (!source) continue
    try { const parsed = new URL(source, document.baseURI); if (/^https?:$/.test(parsed.protocol)) { imageUrl = parsed.href; break } } catch { /* No valid cover. */ }
  }
  const priceElement = document.querySelector('.ui-pdp-price__second-line .andes-money-amount, .ui-pdp-price .andes-money-amount:not(.andes-money-amount--previous)')
  const meta = priceElement?.querySelector('[itemprop=price]')?.getAttribute('content')
  const fraction = priceElement?.querySelector('.andes-money-amount__fraction')?.textContent?.replace(/\D/g, '')
  const cents = priceElement?.querySelector('.andes-money-amount__cents')?.textContent?.replace(/\D/g, '') || '00'
  const price = meta ? Number(meta) : fraction ? Number(fraction + '.' + cents) : null
  const shippingElement = document.querySelector('.ui-pdp-shipping, .ui-pdp-media__body, .ui-pdp-shipping-summary')
  const shippingText = (shippingElement?.textContent || '').trim()
  let logistics: "Full" | "Flex" | "Outros" = "Outros"
  const logisticsRoots: (Document | ShadowRoot)[] = [document]
  while (logisticsRoots.length) {
    const root = logisticsRoots.pop()!
    for (const badge of root.querySelectorAll('[aria-label]')) {
      if (badge.closest('.poly-card, .ui-search-layout__item, .ui-pdp-recommendations, .andes-carousel-snapped')) continue
      const label = badge.getAttribute('aria-label')?.trim()
      if (label === 'Está no Full') logistics = 'Full'
      else if (label === 'Está no Flex' && logistics !== 'Full') logistics = 'Flex'
    }
    root.querySelectorAll('*').forEach(element => { if (element.shadowRoot && !element.closest('.poly-card, .ui-search-layout__item, .ui-pdp-recommendations, .andes-carousel-snapped')) logisticsRoots.push(element.shadowRoot) })
  }
  return { positions: [1], itemId, catalogId, title, imageUrl, seller, url: pageUrl.href, advertising, adClickId, metrics,
    observed: { price: price !== null && Number.isFinite(price) && price > 0 ? price : null, logistics,
      freeShipping: /frete gr[áa]tis/i.test(shippingText) ? true : null, delivery: shippingText || null, sponsored: advertising } }
}

export function parseAvantproFields(metrics: string) {
  const labels = ["Vendidos", "Estoque", "Vendas estimadas", "Ritmo atual (vendas/mês)", "Visitas", "Vendas por dia", "Vendas mensais", "Conversão", "Anúncio criado em", "Catálogo criado em"]
  const lines = metrics.split(/\n/).map(line => line.replace(/[ \t\u00a0]+/g, ' ').trim()).filter(Boolean)
  return labels.map(label => {
    const index = lines.findIndex(line => line.toLocaleLowerCase('pt-BR') === label.toLocaleLowerCase('pt-BR'))
    const inline = lines.find(line => line.toLowerCase().endsWith(' ' + label.toLowerCase()) && /^[\d.,+]+\s/.test(line))
    const value = index >= 0 && lines[index + 1] && !labels.includes(lines[index + 1]) ? lines[index + 1] : inline?.slice(0, inline.toLowerCase().lastIndexOf(label.toLowerCase())).trim() || null
    return { label, value, scope: 'unknown' as const, period: null }
  })
}
