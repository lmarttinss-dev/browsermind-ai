import { useEffect, useRef, useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { api, type StructuredMarketDocument } from '@/lib/api'

type Props = { html?: string; src?: string; document?: StructuredMarketDocument; productId?: string }
export function HtmlMarketReport({ html, src, document, productId }: Props) {
  const iframe = useRef<HTMLIFrameElement>(null)
  const [exporting, setExporting] = useState(false)
  const [error, setError] = useState('')
  const resize = () => {
    const frame = iframe.current
    if (!frame) return
    try {
      frame.style.height = '1px'
      frame.style.height = Math.max(600, frame.contentDocument?.documentElement.scrollHeight || 600) + 'px'
    } catch { frame.style.height = '85vh' }
  }
  useEffect(() => {
    const frame = iframe.current
    if (!frame?.parentElement) return
    let width = 0
    const observer = new ResizeObserver(entries => {
      const next = entries[0]?.contentRect.width || 0
      if (next !== width) { width = next; resize() }
    })
    observer.observe(frame.parentElement)
    return () => observer.disconnect()
  }, [])
  const download = async () => {
    if (exporting) return
    setExporting(true); setError('')
    try {
      const blob = productId ? await api.exportSavedFullMarketPdf(productId) : await api.exportFullMarketPdf(document!)
      const url = URL.createObjectURL(blob)
      const anchor = window.document.createElement('a')
      anchor.href = url; anchor.download = 'analise-de-mercado.pdf'; anchor.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { setError(err instanceof Error ? err.message : 'Não foi possível exportar o PDF.') }
    finally { setExporting(false) }
  }
  return <section aria-label="Relatório HTML de análise de mercado" className="min-w-0">
    <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-gray-400">Análise de mercado · Relatório completo</p>
      <button type="button" onClick={download} disabled={exporting || !productId && !document} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50">
        {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
        {exporting ? 'Gerando PDF…' : 'Exportar PDF'}
      </button>
    </div>
    {error && <p role="alert" className="mb-3 rounded-lg bg-red-950/30 p-3 text-sm text-red-400">{error}</p>}
    <iframe ref={iframe} title="Análise de mercado" src={src} srcDoc={html} onLoad={resize}
      sandbox="allow-same-origin allow-popups allow-popups-to-escape-sandbox" referrerPolicy="no-referrer"
      className="block min-h-[600px] w-full rounded-xl border-0 bg-white" />
  </section>
}
