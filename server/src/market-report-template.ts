import type { SelectionAnalysis } from "./market-analysis-ai.js"

export const REPORT_PERIODS = ["Semana 1", "Semana 2", "30 dias", "60 dias"] as const
export const REPORT_ACTION_TITLES = ["Ajustar logística", "Definir preço de entrada", "Validar desempenho", "Consolidar reputação"] as const
export type ReportSections = {
  decision: { status: "Favorável" | "Entrar com plano" | "Dados insuficientes"; title: string; summary: string }
  logistics: string
  pricing: string
  actions: { period: string; title: string; description: string }[]
}
function shortText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max
}
export function parseReportSections(raw: string): ReportSections {
  let value: any
  try { value = JSON.parse(raw.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")) }
  catch { throw new Error("O modelo retornou um relatório fora do formato esperado. Tente novamente.") }
  if (!value || !value.decision || !["Favorável", "Entrar com plano", "Dados insuficientes"].includes(value.decision.status)
    || !shortText(value.decision.title, 120) || !shortText(value.decision.summary, 650)
    || !shortText(value.logistics, 350) || !shortText(value.pricing, 450)
    || !Array.isArray(value.actions) || value.actions.length !== 4
    || !value.actions.every((action: any, index: number) => action && action.period === REPORT_PERIODS[index] && shortText(action.title, 90) && shortText(action.description, 250))) {
    throw new Error("O modelo retornou um relatório fora do formato esperado. Tente novamente.")
  }
  return { decision: { status: value.decision.status, title: value.decision.title, summary: value.decision.summary },
    logistics: value.logistics, pricing: value.pricing,
    actions: value.actions.map((action: any, index: number) => ({ period: REPORT_PERIODS[index], title: REPORT_ACTION_TITLES[index], description: action.description })) }
}
export function formatMarketReport(analysis: SelectionAnalysis, sections: ReportSections) {
  const money = (value: number | null) => value === null ? "Sem dados" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  return ["# Panorama AvantPro", `${analysis.total} anúncios · ${new Date(analysis.analyzedAt).toLocaleDateString('pt-BR')}`,
    "## Decisão", sections.decision.status, sections.decision.title, sections.decision.summary,
    "## Indicadores", `- Concorrentes com ADS: ${analysis.sponsored}/${analysis.total}\n- ${analysis.adsPercentage}% patrocinam\n- Preço mediano: ${money(analysis.pricing.median)}\n- Full: ${analysis.logistics.Full}/${analysis.total}\n- Flex: ${analysis.logistics.Flex}/${analysis.total}`,
    ...(analysis.sales30d === null ? [] : [`- Vendas com período explícito de 30 dias: ${analysis.sales30d} (cobertura ${analysis.salesCoverage}/${analysis.total})`]),
    "## Logística", sections.logistics, "## Precificação", `Faixa observada: ${money(analysis.pricing.min)} a ${money(analysis.pricing.max)}.`, sections.pricing,
    "## Plano de ação", ...sections.actions.map((action, index) => `${index + 1}. **${action.title} — ${action.period}:** ${action.description}`),
    "## Prontidão da conta", ...analysis.readiness.map(row => `- ${row.label}: ${row.status}`),
    "## Fontes e limites", ...(analysis.adsUnknown ? [`Ads não informado em ${analysis.adsUnknown}/${analysis.total} anúncios; ausência de informação não significa ausência de campanhas.`] : []), "Amostra selecionada; estimativas do AvantPro. Margem depende de custos, taxas e frete.",
    ...analysis.selected.map(row => `- ${row.title} | Vendedor: ${row.seller || "Não identificado"} | ${row.itemId || row.catalogId || 'Sem ID'} | ${row.url || 'Sem link'} | Ads (informado pelo usuário): ${row.adsStatus === 'yes' ? 'Sim' : row.adsStatus === 'no' ? 'Não' : row.adClickId ? 'Sim (clique identificado na URL)' : 'Não informado'} | Captura: ${row.capturedAt}`),
  ].join("\n\n")
}
