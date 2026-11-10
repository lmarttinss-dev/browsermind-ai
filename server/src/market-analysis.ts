import { parseAvantproFields } from "./individual-listing.js"
import type { CompetitorListing } from "./competitor-listings.js"

export type AccountProfile = Record<"account" | "sales" | "full" | "flex" | "reviews" | "medal", "yes" | "no" | "unknown">
export const PROFILE_KEYS = ["account", "sales", "full", "flex", "reviews", "medal"] as const
export const emptyProfile = (): AccountProfile => Object.fromEntries(PROFILE_KEYS.map(key => [key, "unknown"])) as AccountProfile

export function normalizeListing(listing: CompetitorListing, index: number) {
  // Never infer an actual 30-day period from lifetime sales or projected sales velocity.
  const text = listing.metrics.replace(/\r/g, "")
  const offerSales = text.match(/vendas do anúncio\s*\(?\s*(?:últimos\s*)?30\s*dias\)?\s*[:\n]\s*([\d.,]+)(?![\d.,+])/i)
  const catalogScope = !!listing.catalogId && !offerSales
  const sales = offerSales || (!listing.catalogId ? text.match(/(?:vendas\s*\(?\s*(?:últimos\s*)?30\s*dias\)?|vendidos nos últimos 30 dias)\s*[:\n]\s*([\d.,]+)(?![\d.,+])/i) : null)
  const value = sales ? Number(sales[1].replace(/\./g, "").replace(",", ".")) : null
  return {
    id: `listing-${index}`, ...listing,
    avantproFields: parseAvantproFields(listing.metrics),
    capturedAt: new Date().toISOString(),
    price: listing.observed?.price ?? null,
    logistics: listing.observed?.logistics ?? null,
    freeShipping: listing.observed?.freeShipping ?? null,
    delivery: listing.observed?.delivery ?? null,
    adsStatus: "unknown" as "yes" | "no" | "unknown",
    sponsored: listing.observed?.sponsored ?? listing.advertising,
    sales30d: !catalogScope && value !== null && Number.isSafeInteger(value) && value >= 0 ? value : null,
    salesScope: catalogScope ? "catalog" : "listing",
  }
}
export type MarketListing = ReturnType<typeof normalizeListing>
export type MarketSnapshot = { id: string; url: string; title: string; capturedAt: string; listings: MarketListing[]; warnings: string[] }

const money = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export function analyzeSelection(snapshot: MarketSnapshot, ids: string[], profile: AccountProfile) {
  if (!ids.length || ids.length > 200 || new Set(ids).size !== ids.length) throw new Error("Selecione de 1 a 200 anúncios distintos.")
  const selected = ids.map(id => snapshot.listings.find(row => row.id === id))
  if (selected.some(row => !row)) throw new Error("Seleção inválida. Capture os anúncios novamente.")
  const rows = selected as MarketListing[]
  const prices = rows.flatMap(row => row.price === null ? [] : [row.price]).sort((a, b) => a - b)
  const salesRows = rows.filter(row => row.sales30d !== null)
  const sales30d = salesRows.length ? salesRows.reduce((sum, row) => sum + row.sales30d!, 0) : null
  const middle = Math.floor(prices.length / 2)
  const pricing = { count: prices.length, min: prices[0] ?? null, max: prices.at(-1) ?? null,
    median: prices.length ? (prices.length % 2 ? prices[middle] : (prices[middle - 1] + prices[middle]) / 2) : null }
  const logistics = { Full: 0, Flex: 0, Normal: 0, Outros: 0, unknown: 0 }
  rows.forEach(row => logistics[row.logistics || "unknown"]++)
  const hasAds = (row: MarketListing) => row.adsStatus === "yes" || (row.adsStatus !== "no" && (row.sponsored || !!row.adClickId))
  const sponsored = rows.filter(hasAds).length
  const adsCoverage = rows.filter(row => row.adsStatus === "yes" || row.adsStatus === "no" || hasAds(row)).length
  const adsUnknown = rows.length - adsCoverage
  const adsPercentage = Math.round(sponsored / rows.length * 100)
  const labels = { account: "Tipo de conta habilitado", sales: "Histórico de vendas", full: "Mercado Envios Full", flex: "Mercado Envios Flex", reviews: "Avaliações", medal: "Medalha MercadoLíder" }
  const readiness = PROFILE_KEYS.map(key => ({ key, label: labels[key], value: profile[key],
    status: profile[key] === "unknown" ? "Sem dados" : profile[key] === "yes" ? "Pronto" : key === "full" || key === "flex" ? (logistics[key === "full" ? "Full" : "Flex"] ? "Gap" : "Atenção") : key === "sales" || key === "account" ? "Crítico" : "Atenção" }))
  const hasGap = readiness.some(row => row.status === "Gap" || row.status === "Crítico")
  const incomplete = readiness.some(row => row.status === "Sem dados") || salesRows.length < rows.length
  const verdict = hasGap ? "Entrar com plano" : incomplete ? "Dados insuficientes para concluir" : "Validar viabilidade"
  const actions = [
    { period: "Semana 1", title: "Validar a operação logística", description: `${logistics.Full}/${rows.length} anúncios com Full e ${logistics.Flex}/${rows.length} com Flex observados. Compare prazo e custo para seu CEP; ausência de selo não confirma envio normal.` },
    { period: "Semana 2", title: "Simular preço e margem de contribuição", description: pricing.median === null ? "Capture preços para comparar. Informe custo, comissão, impostos e frete na calculadora antes de definir preço." : `Mediana observada: ${money(pricing.median)}. Use a faixa de ${money(pricing.min!)} a ${money(pricing.max!)} como referência, validando custo, comissão, impostos e frete na calculadora.` },
    { period: "30 dias", title: "Testar oferta e mídia com orçamento definido", description: `${sponsored}/${rows.length} anúncios tiveram patrocínio observado. Compare conversão e retorno, sem presumir que patrocínio garante vendas.` },
    { period: "60 dias", title: "Reavaliar prova social e reputação", description: "Acompanhe avaliações, cancelamentos e pontualidade. Recapture a mesma busca para comparar a evolução da amostra." },
  ]
  const warnings = [...snapshot.warnings, "Amostra dos anúncios selecionados, não de todo o mercado. Vendas são estimativas do AvantPro, não transações verificadas.",
    "Margem não calculada: custos, impostos, comissão e frete precisam ser informados na calculadora.",
    ...(salesRows.length < rows.length ? [`Vendas de 30 dias disponíveis para ${salesRows.length}/${rows.length} anúncios. Ritmo projetado, totais históricos e métricas de catálogo foram excluídos da soma.`] : []),
    ...(logistics.unknown ? [`Logística não identificada em ${logistics.unknown}/${rows.length} anúncios.`] : [])]
  const result = { analyzedAt: new Date().toISOString(), snapshotId: snapshot.id, sourceUrl: snapshot.url, capturedAt: snapshot.capturedAt,
    title: snapshot.title, selectedIds: ids, selected: rows, total: rows.length, sales30d, salesCoverage: salesRows.length,
    sellers: new Set(rows.flatMap(row => row.seller ? [row.seller] : [])).size, sponsored, adsCoverage, adsUnknown, adsPercentage, logistics, pricing, profile, readiness, verdict, actions, warnings }
  const report = ["# Panorama dos anúncios selecionados", snapshot.title, `Fonte: ${snapshot.url}`, `Capturado em: ${snapshot.capturedAt}`, `Analisado em: ${result.analyzedAt}`,
    `## Decisão\n${verdict}`, `## Métricas da amostra\n- Anúncios: ${rows.length}\n- Vendedores identificados: ${result.sellers}\n- Vendas estimadas (30 dias): ${sales30d ?? "Sem dados"} (cobertura ${salesRows.length}/${rows.length})\n- Full: ${logistics.Full}/${rows.length}\n- Flex: ${logistics.Flex}/${rows.length}\n- Patrocinados observados: ${sponsored}/${rows.length}\n- Preço mediano: ${pricing.median === null ? "Sem dados" : money(pricing.median)}`,
    "## Matriz de prontidão (informada pelo usuário)", ...readiness.map(row => `- ${row.label}: ${row.status}`),
    "## Plano de ação", ...actions.map((action, i) => `${i + 1}. ${action.title} (${action.period}): ${action.description}`),
    "## Anúncios selecionados", ...rows.map(row => `- Captura: ${row.capturedAt} | Métricas originais: ${JSON.stringify(row.avantproFields)}\n- ${row.title.replace(/[\r\n]/g, " ")} | ${row.itemId ?? "ID não identificado"} | ${row.seller ?? "Vendedor não identificado"} | ${row.url ?? "Link não disponível"}`),
    "## Limites e cobertura", ...warnings.map(warning => `- ${warning}`)].join("\n\n")
  return { ...result, report }
}
