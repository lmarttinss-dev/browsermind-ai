import type { SelectionAnalysis } from "./market-analysis-ai.js"

export const REPORT_PERIODS = ["Semana 1", "Semana 2", "30 dias", "60 dias"] as const
export const REPORT_ACTION_TITLES = ["Comparar logística", "Avaliar posicionamento de preço", "Investigar diferenças de desempenho", "Validar oportunidades"] as const
export type ReportSections = {
  decision: { status: "Favorável" | "Entrar com plano" | "Dados insuficientes"; title: string; summary: string }
  logistics: string
  pricing: string
  actions: { period: string; title: string; description: string }[]
}
function shortText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max
}
export class ReportFormatError extends Error {
  constructor(readonly issues: string[]) {
    super("O modelo retornou um relatório fora do formato esperado. Tente novamente.")
  }
}
const normalizeLabel = (value: unknown) => typeof value === "string" ? value.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : ""
export function parseReportSections(raw: string): ReportSections {
  let value: any
  const cleaned = raw.trim().replace(/^\uFEFF/, "").replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "")
  try {
    try { value = JSON.parse(cleaned) }
    catch {
      const start = cleaned.indexOf("{"), end = cleaned.lastIndexOf("}")
      if (start < 0 || end <= start) throw new Error("JSON ausente")
      value = JSON.parse(cleaned.slice(start, end + 1))
    }
  } catch { throw new ReportFormatError(["Retorne um único objeto JSON completo e válido, sem introdução ou Markdown."]) }
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ReportFormatError(["O relatório deve ser um objeto JSON."])
  const issues: string[] = []
  const status = (["Favorável", "Entrar com plano", "Dados insuficientes"] as const).find(label => normalizeLabel(label) === normalizeLabel(value.decision?.status))
  if (!status) issues.push("decision.status deve ser Favorável, Entrar com plano ou Dados insuficientes.")
  for (const [key, text, max] of [
    ["decision.title", value.decision?.title, 120], ["decision.summary", value.decision?.summary, 650],
    ["logistics", value.logistics, 350], ["pricing", value.pricing, 450],
  ] as const) {
    if (!shortText(text, max)) issues.push(`${key} deve ser texto não vazio com até ${max} caracteres.`)
  }
  let actions = value.actions
  if (!Array.isArray(actions) || actions.length !== 4) issues.push("actions deve conter exatamente quatro recomendações, na ordem do template.")
  else {
    // Labels belong to the fixed template. Only descriptions come from the model.
    // If periods are provided, preserve their meaning even when returned out of order.
    if (actions.every((action: any) => action?.period !== undefined)) {
      const ordered = REPORT_PERIODS.map(period => actions.filter((action: any) => normalizeLabel(action?.period) === normalizeLabel(period)))
      if (ordered.some(matches => matches.length !== 1)) issues.push("Os períodos devem ser Semana 1, Semana 2, 30 dias e 60 dias, sem repetições.")
      else actions = ordered.map(matches => matches[0])
    }
    actions.forEach((action: any, index: number) => {
      if (action?.period !== undefined && normalizeLabel(action.period) !== normalizeLabel(REPORT_PERIODS[index])) issues.push(`actions[${index}].period deve ser ${REPORT_PERIODS[index]}.`)
      if (!shortText(action?.description, 250)) issues.push(`actions[${index}].description deve ser texto não vazio com até 250 caracteres.`)
    })
  }
  if (issues.length) throw new ReportFormatError(issues)
  return { decision: { status: status!, title: value.decision.title.trim(), summary: value.decision.summary.trim() },
    logistics: value.logistics.trim(), pricing: value.pricing.trim(),
    actions: actions.map((action: any, index: number) => ({ period: REPORT_PERIODS[index], title: REPORT_ACTION_TITLES[index], description: action.description.trim() })) }
}

export function formatMarketReport(analysis: SelectionAnalysis, sections: ReportSections) {
  const money = (value: number | null) => value === null ? "Sem dados" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  return ["# Comparação dos anúncios selecionados", `${analysis.total} anúncios · ${new Date(analysis.analyzedAt).toLocaleDateString('pt-BR')}`,
    "## Decisão", sections.decision.status, sections.decision.title, sections.decision.summary,
    "## Indicadores", `- Concorrentes com ADS: ${analysis.sponsored}/${analysis.total}\n- ${analysis.adsPercentage}% patrocinam\n- Preço mediano: ${money(analysis.pricing.median)}\n- Full: ${analysis.logistics.Full}/${analysis.total}\n- Flex: ${analysis.logistics.Flex}/${analysis.total}`,
    ...(analysis.sales30d === null ? [] : [`- Vendas com período explícito de 30 dias: ${analysis.sales30d} (cobertura ${analysis.salesCoverage}/${analysis.total})`]),
    "## Logística", sections.logistics, "## Precificação", `Faixa observada: ${money(analysis.pricing.min)} a ${money(analysis.pricing.max)}.`, sections.pricing,
    "## Plano de ação", ...sections.actions.map((action, index) => `${index + 1}. **${action.title} — ${action.period}:** ${action.description}`),
    "## Fontes e limites", ...(analysis.adsUnknown ? [`Ads não informado em ${analysis.adsUnknown}/${analysis.total} anúncios; ausência de informação não significa ausência de campanhas.`] : []), "Amostra selecionada; estimativas do AvantPro. Margem depende de custos, taxas e frete.",
    ...analysis.selected.map(row => `- ${row.title} | Vendedor: ${row.seller || "Não identificado"} | ${row.itemId || row.catalogId || 'Sem ID'} | ${row.url || 'Sem link'} | Ads (informado pelo usuário): ${row.adsStatus === 'yes' ? 'Sim' : row.adsStatus === 'no' ? 'Não' : row.adClickId ? 'Sim (clique identificado na URL)' : 'Não informado'} | Captura: ${row.capturedAt}`),
  ].join("\n\n")
}
