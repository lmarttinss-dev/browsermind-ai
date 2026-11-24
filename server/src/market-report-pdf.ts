import { parseAvantproFields } from "./individual-listing.js"
import { shell } from "./full-market-report-html.js"
import { chromium } from "playwright"
import { parseReportSections, type ReportSections } from "./market-report-template.js"
import type { SelectionAnalysis } from "./market-analysis-ai.js"

type PdfReport = Pick<SelectionAnalysis, "total" | "sponsored" | "adsUnknown" | "adsPercentage" | "pricing" | "logistics" | "readiness" | "actions" | "verdict" | "analyzedAt" | "sales30d" | "salesCoverage"> & {
  selected?: { title: string; seller?: string | null; itemId?: string | null; catalogId?: string | null; price?: number | null; logistics?: string | null; metrics?: string; capturedAt?: string; url?: string | null; imageUrl?: string | null;
    freeShipping?: boolean | null; delivery?: string | null; adsStatus?: "yes" | "no" | "unknown"; sponsored?: boolean; adClickId?: string | null;
    avantproFields?: { label: string; value: string | null }[] }[]
  ai?: { model?: string; text?: string; sections?: ReportSections }
}
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!)
const listingUrl = (value: unknown) => {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password && /(^|\.)mercadolivre\.com\.br$/i.test(url.hostname) ? url.href : null
  } catch { return null }
}
const imageUrl = (value: unknown) => {
  if (typeof value !== "string") return null
  try {
    const url = new URL(value)
    return url.protocol === "https:" && !url.username && !url.password && /(^|\.)mlstatic\.com$/i.test(url.hostname) ? url.href : null
  } catch { return null }
}
const money = (value: number | null) => value === null ? "Sem dados" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function validatePdfReport(value: unknown): PdfReport {
  const data = value as PdfReport
  const count = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 200
  const text = (s: unknown, length: number) => typeof s === "string" && s.length <= length
  if (!data || !count(data.total) || !data.total || !count(data.sponsored) || data.sponsored > data.total
    || !text(data.analyzedAt, 100) || !Number.isFinite(Date.parse(data.analyzedAt)) || !text(data.verdict, 200)
    || data.adsUnknown !== undefined && (!count(data.adsUnknown) || data.adsUnknown > data.total)
    || data.sales30d !== null && data.sales30d !== undefined && !(typeof data.sales30d === "number" && Number.isFinite(data.sales30d) && data.sales30d >= 0)
    || data.selected !== undefined && (!Array.isArray(data.selected) || data.selected.length > 200 || !data.selected.every(row => row && text(row.title, 1000)
      && [row.seller, row.itemId, row.catalogId, row.logistics, row.capturedAt, row.delivery, row.adClickId].every(value => value == null || text(value, 1000))
      && [row.url, row.imageUrl].every(value => value == null || text(value, 4000))
      && (row.freeShipping == null || typeof row.freeShipping === "boolean")
      && (row.sponsored === undefined || typeof row.sponsored === "boolean")
      && (row.adsStatus === undefined || ["yes", "no", "unknown"].includes(row.adsStatus))
      && (row.avantproFields === undefined || Array.isArray(row.avantproFields) && row.avantproFields.length <= 100 && row.avantproFields.every(field => field && text(field.label, 200) && (field.value === null || text(field.value, 2000))))
      && (row.metrics === undefined || text(row.metrics, 30000))
      && (row.price == null || typeof row.price === "number" && Number.isFinite(row.price) && row.price >= 0)))
    || !data.pricing || ![data.pricing.min, data.pricing.max, data.pricing.median].every(n => n === null || typeof n === "number" && Number.isFinite(n) && n >= 0)
    || !data.logistics || !["Full", "Flex", "Normal", "Outros", "unknown"].every(key => data.logistics[key as keyof typeof data.logistics] === undefined || count(data.logistics[key as keyof typeof data.logistics]))
    || !Array.isArray(data.readiness) || data.readiness.length > 6 || !data.readiness.every(row => row && text(row.label, 100) && text(row.status, 40))
    || !Array.isArray(data.actions) || data.actions.length > 4 || !data.actions.every(row => row && text(row.period, 40) && text(row.title, 200) && text(row.description, 1200))
    || data.ai?.text !== undefined && !text(data.ai.text, 80000)
    || data.ai?.model !== undefined && !text(data.ai.model, 100)) throw new Error("Relatório inválido para exportar em PDF.")
  if (data.ai?.sections) return { ...data, ai: { ...data.ai, sections: parseReportSections(JSON.stringify(data.ai.sections)) } }
  return data
}

export function marketReportHtml(data: PdfReport) {
  const sections = data.ai?.sections
  const total = data.total
  const section = (id: string, number: string, title: string, body: string) => `<section class="report-section" id="${id}"><div class="section-head"><span class="section-number">${number}</span><h2>${title}</h2></div>${body}</section>`
  const metric = (label: string, value: string) => `<div class="metric"><span>${label}</span><strong>${escape(value)}</strong></div>`
  const rows = data.selected || []
  const body = `<header class="cover"><div class="eyebrow">BrowserMind · Comparação de anúncios</div><h1>Anúncios do mesmo produto</h1><p class="subtitle">Comparação exclusiva do grupo selecionado, sem anúncio de referência.</p><p class="meta">${total} anúncios · ${escape(new Date(data.analyzedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }))}</p><div class="executive"><h2>${escape(sections?.decision.title || 'Resumo da seleção')}</h2><p>${escape(sections?.decision.summary || 'Confira os dados individuais e a cobertura antes de interpretar as diferenças.')}</p></div><div class="metrics">${metric('Anúncios selecionados', String(total))}${metric('Preço mediano', money(data.pricing.median))}${metric('Com sinal de Ads', `${data.sponsored}/${total}`)}${metric('No Full', `${data.logistics.Full || 0}/${total}`)}</div></header>`
  + section('comparison','01','Anúncios selecionados', `<div class="table-scroll"><table class="selected-listings-table"><colgroup><col class="listing-photo-col"><col class="listing-info-col"><col class="listing-price-col"><col class="listing-delivery-col"><col class="listing-ads-col"><col class="listing-metrics-col"></colgroup><thead><tr>${['Foto', 'Anúncio / vendedor', 'Preço', 'Entrega', 'Ads', 'Métricas AvantPro'].map(label => `<th scope="col">${label}</th>`).join('')}</tr></thead><tbody>${rows.map(row => {
    const href = listingUrl(row.url)
    const image = imageUrl(row.imageUrl)
    const seller = escape(row.seller || 'Vendedor não informado')
    const title = escape(row.title)
    const fields = (row.avantproFields?.length ? row.avantproFields : parseAvantproFields(row.metrics || '')).filter(field => field.value !== null && field.value !== '')
    const ads = row.adsStatus === 'yes' ? 'Sim (informado)' : row.adsStatus === 'no' ? 'Não (informado)' : row.sponsored || row.adClickId ? 'Sinal identificado' : 'Não informado'
    const captured = row.capturedAt && Number.isFinite(Date.parse(row.capturedAt)) ? new Date(row.capturedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }) : 'Não informada'
    return `<tr><td>${image ? `<img class="listing-photo" src="${escape(image)}" alt="Foto de ${title}" width="64" height="64" referrerpolicy="no-referrer">` : '<span class="listing-no-photo">Sem foto</span>'}</td><td><strong class="listing-title">${href ? `<a href="${escape(href)}" target="_blank" rel="noopener noreferrer">${title}</a>` : title}</strong><div>${href ? `<a class="listing-seller" href="${escape(href)}" target="_blank" rel="noopener noreferrer">${seller}</a>` : seller}</div>${row.itemId ? `<div class="meta">Anúncio: ${escape(row.itemId)}</div>` : ''}${row.catalogId ? `<div class="meta">Catálogo: ${escape(row.catalogId)}</div>` : ''}<div class="meta">Captura: ${escape(captured)}</div></td><td>${money(row.price ?? null)}</td><td><strong>${escape(row.logistics || 'Não informada')}</strong><div>${row.freeShipping === true ? 'Frete grátis' : row.freeShipping === false ? 'Sem frete grátis' : 'Frete não informado'}</div>${row.delivery ? `<div class="meta">${escape(row.delivery)}</div>` : ''}</td><td>${ads}</td><td>${fields.length ? `<dl class="listing-metrics">${fields.map(field => `<div><dt>${escape(field.label)}</dt><dd>${escape(field.value)}</dd></div>`).join('')}</dl>` : row.metrics ? `<p class="listing-metrics-text">${escape(row.metrics)}</p>` : 'Sem métricas informadas'}</td></tr>`
  }).join('')}</tbody></table></div>`)

  + section('pricing','02','Preço e posicionamento', `<p class="lead">Faixa observada: ${money(data.pricing.min)} a ${money(data.pricing.max)}.</p><p>${escape(sections?.pricing || 'Compare os preços apenas entre versões e quantidades equivalentes. Preço não comprova margem ou conversão.')}</p>`)
  + section('logistics','03','Logística dos anúncios', `<div class="table-scroll"><table><thead><tr><th>Modalidade</th><th>Anúncios</th></tr></thead><tbody>${['Full','Flex','Normal','Outros','unknown'].map(key=>`<tr><td>${key === 'unknown' ? 'Não informada' : key}</td><td>${data.logistics[key as keyof typeof data.logistics] || 0}/${total}</td></tr>`).join('')}</tbody></table></div><p>${escape(sections?.logistics || 'Avalie os prazos e condições informados em cada anúncio.')}</p>`)
  + section('actions','04','Próximos passos', `<div class="recommendations">${(sections?.actions || data.actions).map(action=>`<h3>${escape(action.title)}</h3><p>${escape(action.description)}</p>`).join('')}</div>`)
  return shell('Comparação de anúncios do mesmo produto', body, true)
}

export async function createMarketReportPdf(data: PdfReport): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] })
  try {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    const allowedImages = new Set((data.selected || []).flatMap(row => {
      const image = imageUrl(row.imageUrl)
      return image ? [image] : []
    }))
    await page.route("**/*", route => route.request().resourceType() === "image" && allowedImages.has(route.request().url()) ? route.continue() : route.abort())
    await page.setContent(marketReportHtml(data), { waitUntil: "load", timeout: 10000 })
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;text-align:right;padding-right:60px;font:9px Arial;color:#777"><span class="pageNumber"></span>/<span class="totalPages"></span></div>', margin: { bottom: "0" } })
  } finally { await browser.close() }
}
