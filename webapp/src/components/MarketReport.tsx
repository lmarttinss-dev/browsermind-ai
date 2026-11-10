import { Link } from "react-router-dom"
import { currency, type MarketAnalysis } from "@/lib/market-analysis"

export function MarketReport({ analysis }: { analysis: MarketAnalysis }) {
  const sections = analysis.ai?.sections
  const actions = sections?.actions || analysis.actions
  const logistics = [
    ["Full", analysis.logistics.Full], ["Flex", analysis.logistics.Flex],
    ["Outros", (analysis.logistics.Outros || 0) + (analysis.logistics.Normal || 0)],
    ...(analysis.logistics.unknown ? [["Sem dados", analysis.logistics.unknown]] : []),
  ] as [string, number][]
  const metrics = [
    ["Concorrentes com ADS", `${analysis.sponsored}/${analysis.total}`, `${analysis.adsUnknown ? "Pelo menos " : ""}${analysis.adsPercentage ?? Math.round(analysis.sponsored / analysis.total * 100)}% patrocinam`], ["Preço mediano", currency(analysis.pricing.median)],
    ["No Full", `${analysis.logistics.Full}/${analysis.total}`], analysis.sales30d === null ? ["No Flex", `${analysis.logistics.Flex}/${analysis.total}`] : [`Vendas em 30 dias (${analysis.salesCoverage}/${analysis.total})`, String(analysis.sales30d)],
  ]
  return <section aria-label="Resultado da análise" className="space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-400"><span>Panorama dos anúncios selecionados</span><span>{analysis.total} anúncios · {new Date(analysis.analyzedAt).toLocaleString("pt-BR")}</span></div>
    <article className="rounded-xl border border-gray-700 bg-gray-800/40 p-5 border-l-4 border-l-indigo-500">
      <span className="inline-block text-xs rounded-full bg-indigo-500/15 text-indigo-300 px-2.5 py-1 mb-3">{sections?.decision.status || analysis.verdict}</span>
      <h2 className="text-lg font-semibold">{sections?.decision.title || analysis.verdict}</h2>
      <p className="text-sm leading-relaxed text-gray-300 mt-2">{sections?.decision.summary || "Relatório anterior. Gere uma nova análise para obter o diagnóstico no formato simplificado."}</p>
    </article>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">{metrics.map(([label, value, description]) => <article key={label} className="rounded-xl border border-gray-700 p-4"><h3 className="text-xs text-gray-400">{label}</h3><p className="text-2xl font-semibold mt-2">{value}</p>{description && <p className="text-xs text-orange-400 mt-2">{description}</p>}</article>)}</div>
    <div className="grid lg:grid-cols-3 gap-4">
      <article className="lg:col-span-2 rounded-xl border border-gray-700 p-5"><h3 className="font-semibold mb-5">Plano de ação passo a passo</h3><ol className="space-y-5">{actions.map((action, index) => <li key={action.period} className="flex gap-3"><span className="w-7 h-7 rounded-full bg-indigo-600 shrink-0 text-center text-sm leading-7">{index + 1}</span><div><h4 className="text-sm font-medium">{action.title} <span className="ml-2 text-xs font-normal text-indigo-300">{action.period}</span></h4><p className="text-sm text-gray-400 leading-relaxed mt-1">{action.description}</p></div></li>)}</ol></article>
      <div className="space-y-4"><article className="rounded-xl border border-gray-700 p-5"><h3 className="font-semibold mb-4">Logística dos concorrentes</h3><div className="flex h-2 rounded-full overflow-hidden bg-gray-700 mb-4">{logistics.map(([label, count], index) => <div key={label} title={`${label}: ${count}`} className={["bg-indigo-500", "bg-blue-400", "bg-gray-500", "bg-gray-700"][index]} style={{ width: `${count / analysis.total * 100}%` }} />)}</div><dl className="space-y-2 text-sm">{logistics.map(([label, count]) => <div key={label} className="flex justify-between"><dt className="text-gray-400">{label}</dt><dd>{count} <span className="text-gray-500 ml-3">{Math.round(count / analysis.total * 100)}%</span></dd></div>)}</dl>{sections && <p className="mt-4 text-sm text-gray-400 leading-relaxed">{sections.logistics}</p>}</article>
      <article className="rounded-xl border border-gray-700 p-5"><h3 className="font-semibold mb-3">Precificação</h3><p className="text-sm font-medium">{currency(analysis.pricing.min)} a {currency(analysis.pricing.max)}</p><p className="text-sm text-gray-400 leading-relaxed mt-3">{sections?.pricing || "Compare a faixa observada com seus custos e taxas."}</p><Link className="inline-block text-xs text-indigo-300 mt-3" to="/calculator">Calcular viabilidade ↗</Link></article></div>
    </div>
    <article className="rounded-xl border border-gray-700 p-5"><h3 className="font-semibold mb-3">Matriz de prontidão da sua conta</h3><div className="grid sm:grid-cols-2 gap-x-8">{analysis.readiness.map(row => <div key={row.key} className="flex justify-between items-center gap-3 border-b border-gray-700/60 py-3 text-sm"><span className="text-gray-300">{row.label}</span><span className={`text-xs whitespace-nowrap ${row.status === "Pronto" ? "text-emerald-400" : row.status === "Sem dados" ? "text-gray-500" : "text-amber-300"}`}>{row.status}</span></div>)}</div></article>
    <p className="text-xs text-gray-500">Amostra selecionada · Estimativas do AvantPro · Margem depende dos seus custos e taxas.</p>
    <details className="text-xs text-gray-400 border-t border-gray-700 pt-3"><summary className="cursor-pointer">Ver fontes e cobertura dos dados</summary><div className="mt-3 space-y-3"><p>{analysis.ai ? `Modelo: ${analysis.ai.model}` : "Análise anterior por regras"} · Ads identificados: {analysis.sponsored}/{analysis.total}{analysis.adsUnknown ? ` · Ads não informado: ${analysis.adsUnknown}` : ""} · Preços: {analysis.pricing.count}/{analysis.total} · Vendas com período de 30 dias: {analysis.salesCoverage}/{analysis.total}{analysis.sales30d !== null ? ` (${analysis.sales30d})` : ""}</p><ul className="space-y-1">{analysis.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul><ul className="space-y-2">{analysis.selected.map(row => <li key={row.id}>{row.url ? <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-indigo-300">{row.title} ↗</a> : row.title} · {row.itemId || row.catalogId || "Sem ID"} · {row.capturedAt ? new Date(row.capturedAt).toLocaleString("pt-BR") : "Sem data"}</li>)}</ul>{!sections && analysis.ai && <details><summary className="cursor-pointer">Ver relatório anterior</summary><pre className="whitespace-pre-wrap leading-relaxed mt-2">{analysis.ai.text}</pre></details>}</div></details>
  </section>
}
