import { chromium } from "playwright"
import { parseReportSections, type ReportSections } from "./market-report-template.js"
import type { SelectionAnalysis } from "./market-analysis-ai.js"

type PdfReport = Pick<SelectionAnalysis, "total" | "sponsored" | "adsUnknown" | "adsPercentage" | "pricing" | "logistics" | "readiness" | "actions" | "verdict" | "analyzedAt" | "sales30d" | "salesCoverage"> & {
  selected?: { title: string }[]
  ai?: { model?: string; text?: string; sections?: ReportSections }
}
const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]!)
const money = (value: number | null) => value === null ? "Sem dados" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })

export function validatePdfReport(value: unknown): PdfReport {
  const data = value as PdfReport
  const count = (n: unknown) => typeof n === "number" && Number.isInteger(n) && n >= 0 && n <= 200
  const text = (s: unknown, length: number) => typeof s === "string" && s.length <= length
  if (!data || !count(data.total) || !data.total || !count(data.sponsored) || data.sponsored > data.total
    || !text(data.analyzedAt, 100) || !Number.isFinite(Date.parse(data.analyzedAt)) || !text(data.verdict, 200)
    || data.adsUnknown !== undefined && (!count(data.adsUnknown) || data.adsUnknown > data.total)
    || data.sales30d !== null && data.sales30d !== undefined && !(typeof data.sales30d === "number" && Number.isFinite(data.sales30d) && data.sales30d >= 0)
    || data.selected !== undefined && (!Array.isArray(data.selected) || data.selected.length > 200 || !data.selected.every(row => row && text(row.title, 1000)))
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
  const status = sections?.decision.status || data.verdict
  const title = sections?.decision.title || data.verdict
  const summary = sections?.decision.summary || "Diagnóstico salvo anteriormente. Os indicadores e o plano de ação abaixo correspondem à análise selecionada."
  const actions = sections?.actions || data.actions
  const total = data.total
  const full = data.logistics.Full || 0
  const flex = data.logistics.Flex || 0
  const others = (data.logistics.Outros || 0) + (data.logistics.Normal || 0)
  const percentage = Math.round(data.sponsored / total * 100)
  const date = new Date(data.analyzedAt).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
  const footer = `<footer><span>BrowserMind AI · Panorama AvantPro</span><span>Gerado a partir de ${total} anúncios selecionados</span></footer>`
  const metric = (label: string, value: string, note = "") => `<div class="metric"><div>${escape(label)}</div><strong>${escape(value)}</strong>${note ? `<small>${escape(note)}</small>` : ""}</div>`
  const logistics = [["Full", full], ["Flex", flex], ["Outros", others], ...(data.logistics.unknown ? [["Sem dados", data.logistics.unknown]] : [])] as [string, number][]
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Panorama AvantPro</title><style>
    @page {size:A4;margin:0} *{box-sizing:border-box} body{margin:0;color:#18202e;background:#fff;font:13px/1.55 Arial,sans-serif} .page{position:relative;width:210mm;min-height:297mm;padding:17mm 16mm 22mm;break-after:page} .page:last-child{break-after:auto} header{border-top:4px solid #4338ed;padding-top:16px;margin-bottom:24px} h1{font-size:24px;line-height:1.25;margin:0 0 7px} h2{font-size:16px;margin:0 0 12px;line-height:1.4} h3{font-size:13px;margin:0 0 4px} p{margin:0 0 12px} .muted,small{color:#687080;font-size:11px} .section{margin-top:23px;break-inside:avoid} .decision{border-left:4px solid #4338ed;padding:12px 16px;background:#f7f8fc;border-radius:0 8px 8px 0} .badge{display:inline-block;font-size:11px;color:#4338ca;background:#eaeaff;border-radius:12px;padding:3px 10px;margin-bottom:9px} .decision h2{font-size:17px;margin-bottom:8px} .decision p{margin:0} .metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:22px} .metric{border:1px solid #e0e2e8;border-radius:8px;padding:13px 15px;color:#687080;font-size:12px} .metric strong{display:block;color:#111827;font-size:24px;line-height:1.35;margin-top:5px}.metric small{display:block;margin-top:3px;color:#4338ca} table{width:100%;border-collapse:collapse} td{padding:10px 0;border-bottom:1px solid #e8e9ee;font-size:12px} td:last-child{text-align:right;font-weight:bold} .note{margin-top:18px;font-size:10px;color:#727887} footer{position:absolute;bottom:11mm;left:16mm;right:16mm;display:flex;justify-content:space-between;border-top:1px solid #e8e9ee;padding-top:8px;color:#7a8090;font-size:9px} .bar{height:10px;border-radius:5px;display:flex;overflow:hidden;background:#e6e7eb;margin:13px 0}.bar span{height:100%}.distribution td{padding:5px 0;border:0}.distribution td:last-child{font-weight:normal} .step{display:flex;gap:12px;margin:0 0 17px;break-inside:avoid}.number{flex:none;width:25px;height:25px;border-radius:50%;background:#4338ed;color:white;text-align:center;line-height:25px;font-size:12px}.period{color:#4338ca;font-weight:normal;font-size:11px;margin-left:6px}.step p{font-size:12px;color:#555e6d;margin:4px 0 0}.range{display:inline-block;background:#f4f5f8;padding:5px 10px;border-radius:6px;margin-bottom:10px;font-size:12px;font-weight:bold}.legacy{white-space:pre-wrap;overflow-wrap:anywhere;font:12px/1.6 Arial,sans-serif}.legacy-page{break-before:page;padding:17mm 16mm 22mm}
    </style></head><body>
    <section class="page"><header><h1>Análise de mercado</h1><div class="muted">${total} anúncios selecionados · Análise de ${escape(date)}</div>${data.selected?.[0] ? `<p class="muted" style="margin:8px 0 0">Referência: ${escape(data.selected[0].title)}</p>` : ""}</header>
    <div class="decision"><span class="badge">${escape(status)}</span><h2>${escape(title)}</h2><p>${escape(summary)}</p></div>
    <div class="metrics">${metric("Concorrentes com ADS", `${data.sponsored}/${total}`, `${data.adsUnknown ? "Pelo menos " : ""}${percentage}% patrocinam`)}${metric("Preço mediano", money(data.pricing.median))}${metric("Concorrentes no Full", `${full}/${total}`, `${Math.round(full / total * 100)}% usam Full`)}${data.sales30d !== null && data.sales30d !== undefined ? metric("Vendas estimadas (30 dias)", String(data.sales30d), `Cobertura: ${data.salesCoverage}/${total} anúncios`) : metric("Concorrentes no Flex", `${flex}/${total}`, `${Math.round(flex / total * 100)}% usam Flex`)}</div>
    <div class="section"><h2>Matriz de prontidão da sua conta</h2><table>${data.readiness.map(row => `<tr><td>${escape(row.label)}</td><td>${escape(row.status)}</td></tr>`).join("")}</table></div>
    <p class="note">Amostra selecionada pelo usuário. Vendas são estimativas do AvantPro. Margem depende de custos, impostos, comissão e frete.${data.adsUnknown ? ` Ads não informado em ${escape(data.adsUnknown)} ${data.adsUnknown === 1 ? "anúncio" : "anúncios"}.` : ""}</p>${footer}</section>
    <section class="page"><header><h1>Estratégia e plano de ação</h1><div class="muted">${total} anúncios selecionados · ${escape(date)}</div></header>
    <div class="section"><h2>Logística dos concorrentes</h2><div class="bar">${logistics.map(([, count], index) => `<span style="width:${count / total * 100}%;background:${["#4338ed", "#3484ff", "#c2c6d0", "#e6e7eb"][index]}"></span>`).join("")}</div><table class="distribution">${logistics.map(([label, count]) => `<tr><td>${escape(label)}</td><td>${count} (${Math.round(count / total * 100)}%)</td></tr>`).join("")}</table>${sections ? `<p style="margin-top:10px">${escape(sections.logistics)}</p>` : ""}</div>
    <div class="section"><h2>Precificação</h2><div class="range">${escape(money(data.pricing.min))} a ${escape(money(data.pricing.max))}</div><p>${escape(sections?.pricing || "Compare a faixa observada com seus custos, comissão, impostos e frete antes de definir o preço.")}</p></div>
    <div class="section"><h2>Plano de ação passo a passo</h2>${actions.map((action, index) => `<div class="step"><div class="number">${index + 1}</div><div><h3>${escape(action.title)} <span class="period">${escape(action.period)}</span></h3><p>${escape(action.description)}</p></div></div>`).join("")}</div>${footer}</section>
    ${!sections && data.ai?.text ? `<section class="legacy-page"><h1>Relatório anterior</h1><p class="muted">Conteúdo original preservado</p><div class="legacy">${escape(data.ai.text)}</div></section>` : ""}
    </body></html>`
}

export async function createMarketReportPdf(data: PdfReport): Promise<Buffer> {
  const browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] })
  try {
    const context = await browser.newContext({ javaScriptEnabled: false })
    const page = await context.newPage()
    await page.route("**/*", route => route.abort())
    await page.setContent(marketReportHtml(data), { waitUntil: "load", timeout: 10000 })
    return await page.pdf({ format: "A4", printBackground: true, preferCSSPageSize: true, displayHeaderFooter: true,
      headerTemplate: '<span></span>', footerTemplate: '<div style="width:100%;text-align:right;padding-right:60px;font:9px Arial;color:#777"><span class="pageNumber"></span>/<span class="totalPages"></span></div>', margin: { bottom: "0" } })
  } finally { await browser.close() }
}
