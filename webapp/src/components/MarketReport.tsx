import { useEffect, useState } from "react"
import { HtmlMarketReport } from "@/components/HtmlMarketReport"
import type { MarketAnalysis } from "@/lib/market-analysis"

const reportCache = new WeakMap<MarketAnalysis, string>()
export function MarketReport({ analysis }: { analysis: MarketAnalysis }) {
  const [rendered, setRendered] = useState<{ analysis: MarketAnalysis; html: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setError("")
    const cached = reportCache.get(analysis)
    if (cached) {
      setRendered({ analysis, html: cached }); setLoading(false)
      return () => controller.abort()
    }
    setLoading(true)
    fetch('/api/market-analysis/report-html', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ analysis }), signal: controller.signal })
      .then(async response => { if (!response.ok) throw new Error('Não foi possível abrir o relatório selecionado.'); return response.json() })
      .then(data => {
        if (typeof data.html !== 'string' || !data.html.trim()) throw new Error('O relatório selecionado retornou vazio.')
        if (controller.signal.aborted) return
        reportCache.set(analysis, data.html)
        setRendered({ analysis, html: data.html })
      })
      .catch(error => { if (!controller.signal.aborted) setError(error.message) })
      .finally(() => { if (!controller.signal.aborted) setLoading(false) })
    return () => controller.abort()
  }, [analysis, retry])
  return <section aria-label="Resultado da análise" className="space-y-3">
    {loading && <p role="status" className="text-sm text-gray-400">Carregando relatório selecionado…</p>}
    {error && <div role="alert" className="text-sm text-red-300"><p>{error}{rendered ? ' O relatório anterior foi mantido abaixo.' : ''}</p><button type="button" className="mt-2 text-indigo-300 underline" onClick={() => setRetry(value => value + 1)}>Tentar abrir novamente</button></div>}
    {rendered && <><p className="text-xs text-gray-400">Exibindo: {rendered.analysis.title} · {new Date(rendered.analysis.analyzedAt).toLocaleString('pt-BR')}</p><HtmlMarketReport html={rendered.html} reportKind="comparison" /></>}
  </section>
}
