import { Link } from "react-router-dom"
import { currency, type MarketAnalysis } from "@/lib/market-analysis"

const detailClass = "border-t border-gray-700 px-4 py-3 sm:px-5"
const summaryClass = "cursor-pointer text-sm font-medium text-gray-300 hover:text-indigo-200"

export function MarketReport({ analysis }: { analysis: MarketAnalysis }) {
  const sections = analysis.ai?.sections
  const actions = sections?.actions || analysis.actions
  const adsPercentage = analysis.adsPercentage ?? Math.round(analysis.sponsored / analysis.total * 100)
  const offersLabel = analysis.total === 1 ? "1 oferta" : `${analysis.total} ofertas`
  const sellersLabel = analysis.sellers === 1 ? "1 vendedor identificado" : `${analysis.sellers} vendedores identificados`

  return (
    <section aria-label="Resultado da análise" className="overflow-hidden rounded-xl border border-gray-700 bg-gray-800/25">
      <div className="space-y-3 px-4 py-5 sm:px-5">
        <p className="text-xs text-gray-400">
          {offersLabel} · {sellersLabel} · {new Date(analysis.analyzedAt).toLocaleString("pt-BR")}
        </p>
        <div>
          <h2 className="text-lg font-semibold">{sections?.decision.title || analysis.verdict}</h2>
          {sections && <p className="mt-1 text-sm leading-relaxed text-gray-300">{sections.decision.summary}</p>}
        </div>

        <dl className="grid grid-cols-2 gap-3 rounded-lg bg-gray-900/60 p-3 sm:grid-cols-4">
          <div>
            <dt className="text-xs text-gray-400">Preço mediano</dt>
            <dd className="mt-1 font-semibold">{currency(analysis.pricing.median)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">Concorrentes com ADS</dt>
            <dd className="mt-1 font-semibold">{analysis.sponsored}/{analysis.total}</dd>
            <dd className="text-xs text-gray-400">{analysis.adsUnknown ? "Pelo menos " : ""}{adsPercentage}% patrocinam</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400">No Full</dt>
            <dd className="mt-1 font-semibold">{analysis.logistics.Full}/{analysis.total}</dd>
          </div>
          <div>
            {analysis.sales30d === null ? <>
              <dt className="text-xs text-gray-400">No Flex</dt>
              <dd className="mt-1 font-semibold">{analysis.logistics.Flex}/{analysis.total}</dd>
            </> : <>
              <dt className="text-xs text-gray-400">Vendas estimadas em 30 dias</dt>
              <dd className="mt-1 font-semibold">{analysis.sales30d.toLocaleString("pt-BR")}</dd>
              <dd className="text-xs text-gray-400">Dados de {analysis.salesCoverage}/{analysis.total} ofertas</dd>
            </>}
          </div>
        </dl>

        <div className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <h3 className="font-medium">Preço</h3>
            <p className="text-gray-300">{analysis.pricing.min === null ? "Sem dados de preço" : `${currency(analysis.pricing.min)} a ${currency(analysis.pricing.max)}`}</p>
            {sections && <p className="mt-1 text-gray-400">{sections.pricing}</p>}
          </div>
          <div>
            <h3 className="font-medium">Logística</h3>
            <p className="text-gray-400">{sections?.logistics || `Full ${analysis.logistics.Full} · Flex ${analysis.logistics.Flex} · Outros ${(analysis.logistics.Outros || 0) + (analysis.logistics.Normal || 0)}`}</p>
          </div>
        </div>
      </div>

      <details className={detailClass}>
        <summary className={summaryClass}>Ofertas analisadas ({analysis.total})</summary>
        <ul className="mt-2 divide-y divide-gray-700/60 text-sm">
          {analysis.selected.map(row => (
            <li key={row.id} className="grid gap-1 py-2 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0 break-words">
                {row.url ? <a href={row.url} target="_blank" rel="noopener noreferrer" className="text-indigo-300 hover:underline">{row.title} ↗</a> : row.title}
                <p className="text-xs text-gray-400">{row.seller || "Vendedor não identificado"}{row.logistics && ` · ${row.logistics}`}</p>
              </div>
              <p className="text-gray-300">{currency(row.price)}</p>
            </li>
          ))}
        </ul>
      </details>

      <details className={detailClass}>
        <summary className={summaryClass}>Plano de ação</summary>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm">
          {actions.map(action => <li key={action.period} className="pl-1">
            <h3 className="font-medium">{action.title} <span className="ml-1 text-xs font-normal text-indigo-300">{action.period}</span></h3>
            <p className="mt-1 text-gray-400">{action.description}</p>
          </li>)}
        </ol>
        <Link className="mt-3 inline-block text-sm text-indigo-300 hover:underline" to="/calculator">Calcular viabilidade ↗</Link>
      </details>

      <details className={detailClass}>
        <summary className={summaryClass}>Prontidão da conta</summary>
        <dl className="mt-2 grid gap-x-6 text-sm sm:grid-cols-2">
          {analysis.readiness.map(row => <div key={row.key} className="flex justify-between gap-3 border-b border-gray-700/60 py-2">
            <dt className="text-gray-300">{row.label}</dt>
            <dd className="text-right text-gray-400">{row.status}</dd>
          </div>)}
        </dl>
      </details>

      <details className={detailClass}>
        <summary className={summaryClass}>Ver fontes e cobertura dos dados</summary>
        <div className="mt-3 space-y-3 text-xs text-gray-400">
          <p>{analysis.ai ? `Modelo: ${analysis.ai.model}` : "Análise anterior por regras"} · Ads identificados: {analysis.sponsored}/{analysis.total}{analysis.adsUnknown ? ` · Ads não informado: ${analysis.adsUnknown}` : ""} · Preços: {analysis.pricing.count}/{analysis.total} · Vendas com período de 30 dias: {analysis.salesCoverage}/{analysis.total}</p>
          <p>Logística observada · Full {analysis.logistics.Full} · Flex {analysis.logistics.Flex} · Outros {(analysis.logistics.Outros || 0) + (analysis.logistics.Normal || 0)} · Sem dados {analysis.logistics.unknown || 0}</p>
          <ul className="space-y-1">{analysis.warnings.map(warning => <li key={warning}>{warning}</li>)}</ul>
          <ul className="space-y-1">
            {analysis.selected.map(row => <li key={row.id} className="break-words">
              {row.title} · {row.itemId || row.catalogId || "Sem ID"} · {row.capturedAt ? new Date(row.capturedAt).toLocaleString("pt-BR") : "Sem data"}
            </li>)}
          </ul>
          {!sections && analysis.ai && <details>
            <summary className="cursor-pointer">Ver relatório anterior</summary>
            <pre className="mt-2 whitespace-pre-wrap break-words leading-relaxed">{analysis.ai.text}</pre>
          </details>}
        </div>
      </details>
    </section>
  )
}
