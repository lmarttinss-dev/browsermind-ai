import { CaptureListingButton } from "@/components/CaptureListingButton"
import { Link } from "react-router-dom"
import { comparisonKeys, readComparisonSelection } from "@/lib/listing-comparison"
import { ListingCover } from "@/components/ListingCover"
import { MarketReport } from "@/components/MarketReport"
import { useStore } from "@/store/useStore"
import { useEffect, useMemo, useRef, useState } from "react"
import { Layers3, CheckCheck, Sparkles, BarChart3, Download, History, Loader2, Search, Trash2 } from "lucide-react"
import { api, MODELS } from "@/lib/api"
import { currency, emptyProfile, filterListings, type AccountProfile, type MarketAnalysis, type MarketSnapshot } from "@/lib/market-analysis"

const fieldClass = "bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"

function loadHistory(key: string): MarketAnalysis[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) || "[]")
    return Array.isArray(parsed) ? parsed.filter(row => row && typeof row.report === "string" && Array.isArray(row.selected) && Array.isArray(row.readiness) && Array.isArray(row.actions) && Array.isArray(row.warnings) && row.pricing && row.logistics).slice(0, 10) : []
  } catch { return [] }
}
export function MarketAnalysisPage({ productId, productTitle }: { productId: string; productTitle?: string }) {
  const { history: historyKey, selection: selectionKey } = comparisonKeys(productId)
  const { selectedModel, setSelectedModel } = useStore()
  const [exportingPdf, setExportingPdf] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)
  const [selected, setSelected] = useState<Set<string>>(() => readComparisonSelection(localStorage, productId))
  const [profile] = useState<AccountProfile>(emptyProfile)
  const reportResult = useRef<HTMLDivElement>(null)
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null)
  const [history, setHistory] = useState(() => loadHistory(historyKey))
  const [showSetup, setShowSetup] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [search, setSearch] = useState("")
  const [logistics, setLogistics] = useState("")
  const [busy, setBusy] = useState<"capture" | "analysis" | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const rows = useMemo(() => filterListings(snapshot?.listings || [], search, logistics), [snapshot, search, logistics])
  useEffect(() => {
    let active = true;
    (async () => {
      const previous = readComparisonSelection(localStorage, productId)
      if (productId && previous.size) {
        const response = await api.adoptLegacyMarketListings(productId, [...previous])
        if (active) { setSnapshot(response.snapshot); setSelected(new Set(Object.values(response.idMap))) }
      } else {
        const response = await api.getSavedMarketListings(productId)
        if (active) setSnapshot(response.snapshot)
      }
    })().catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoadingSaved(false) })
    return () => { active = false }
  }, [productId])
  useEffect(() => {
    if (!selectionKey) return
    try { localStorage.setItem(selectionKey, JSON.stringify([...selected])) }
    catch { setNotice("O navegador não permitiu salvar a seleção deste produto.") }
  }, [selected, selectionKey])
  useEffect(() => {
    if (!analysis) return
    const frame = requestAnimationFrame(() => reportResult.current?.scrollIntoView({ block: "start" }))
    return () => cancelAnimationFrame(frame)
  }, [analysis])
  const updateAds = async (id: string, status: "yes" | "no" | "unknown") => {
    setBusy("capture"); setError(""); setNotice("")
    try { const response = await api.updateMarketListingAds(id, status, productId); setSnapshot(response.snapshot); setAnalysis(null); setNotice("Informação de Ads salva.") }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar Ads.") }
    finally { setBusy(null) }
  }
  const removeListing = async (id: string) => {
    setBusy("capture"); setError(""); setNotice("")
    try { const response = await api.removeSavedMarketListing(id, productId); setSnapshot(response.snapshot); setSelected(previous => { const next = new Set(previous); next.delete(id); return next }); setAnalysis(null); setNotice("Anúncio excluído da lista de seleção.") }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível remover a ficha.") }
    finally { setBusy(null) }
  }
  const invalidate = () => { setAnalysis(null); setNotice("") }
  const analyze = async () => {
    if (!snapshot || selected.size < 2) return
    setBusy("analysis"); setError(""); setNotice("")
    try {
      const { analysis: result } = await api.analyzeMarketSelection(snapshot.id, [...selected], profile, selectedModel, productId)
      setAnalysis(result); setShowSetup(false)
      const next = [result, ...history].slice(0, 10)
      setHistory(next)
      try { localStorage.setItem(historyKey, JSON.stringify(next)); setNotice("Análise salva no histórico deste navegador.") }
      catch { setNotice("Análise concluída. O navegador não permitiu salvar o histórico; exporte o relatório para guardar.") }
    } catch (err) { setError(err instanceof Error ? err.message : "Falha ao analisar seleção.") }
    finally { setBusy(null) }
  }
  const exportReport = async () => {
    if (!analysis || exportingPdf) return
    setExportingPdf(true); setError("")
    try {
      const pdf = await api.exportMarketReportPdf(analysis)
      const url = URL.createObjectURL(pdf)
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `comparacao-anuncios-${analysis.analyzedAt.slice(0, 10)}.pdf`; anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível gerar o PDF.") }
    finally { setExportingPdf(false) }
  }

  return <section className="market-page min-w-0 shrink-0 p-4 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      <header className="market-heading flex flex-wrap justify-between items-start gap-4">
        <div><p className="market-eyebrow text-xs uppercase tracking-widest mb-2">Anúncios do mesmo produto</p><h1 className="text-2xl font-semibold flex gap-2 items-center"><BarChart3 /> Comparar anúncios</h1><p className="text-sm text-gray-400 mt-2">Compare anúncios do mesmo produto.</p>{productTitle && <p className="text-sm text-indigo-300 mt-2">{productTitle}</p>}</div>
        <div className="flex gap-2"><button className={fieldClass + " flex items-center gap-2"} aria-expanded={showHistory} onClick={() => setShowHistory(!showHistory)}><History size={16} /> Histórico ({history.length})</button><button disabled={!analysis || exportingPdf} onClick={exportReport} className={fieldClass + " flex items-center gap-2 disabled:opacity-40"}>{exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}</button></div>
      </header>
      <div className="market-overview" aria-label="Resumo da pesquisa">
        <div><span className="market-stat-icon"><Layers3 size={20}/></span><div><span>Fichas disponíveis</span><strong>{loadingSaved ? "…" : error && !snapshot ? "—" : snapshot?.listings.length || 0}</strong><small>Sua base de comparação</small></div></div>
        <div><span className="market-stat-icon"><CheckCheck size={20}/></span><div><span>Ofertas selecionadas</span><strong>{selected.size}</strong><small>Prontas para comparar</small></div></div>

      </div>
      {loadingSaved && <p role="status" className="text-sm text-gray-400">Carregando fichas salvas…</p>}
      {error && <div role="alert" className="border border-red-800 bg-red-950/50 text-red-200 rounded-xl p-4">{error}</div>}
      {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
      {showHistory && <section aria-label="Histórico de análises" className="border border-gray-700 rounded-xl p-4 space-y-2"><div className="flex justify-between"><h2 className="font-semibold">Histórico deste navegador</h2>{history.length > 0 && <button className="text-xs text-gray-400" onClick={() => { try { localStorage.removeItem(historyKey); setHistory([]) } catch { setError("Não foi possível limpar o histórico.") } }}>Limpar histórico</button>}</div><p className="text-xs text-gray-400">Últimas 10 análises; não sincronizado entre dispositivos.</p>{!history.length && <p className="text-sm text-gray-400">Nenhuma análise salva.</p>}{history.map((item, index) => <button key={index} onClick={() => { setAnalysis(item); setShowSetup(false); setShowHistory(false); requestAnimationFrame(() => reportResult.current?.scrollIntoView({ block: "start" })); setNotice("Exibindo análise histórica. A seleção atual não foi alterada.") }} className="block text-left w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">{item.title}<span className="block text-xs text-gray-400 mt-1">{new Date(item.analyzedAt).toLocaleString("pt-BR")} · {item.total} anúncios · {item.verdict}</span></button>)}</section>}
      <details open={showSetup || !analysis} onToggle={event => setShowSetup(event.currentTarget.open)} className="market-setup space-y-4">
        <summary className="cursor-pointer text-sm text-gray-300">Preparar minha análise</summary>
      <section className="market-section rounded-xl border border-gray-700 bg-gray-800/40 p-5">
        <div className="market-section-heading flex flex-wrap justify-between gap-4"><div><h2 className="font-semibold"><span className="market-step">01</span> Construa sua seleção</h2><p className="text-sm text-gray-400 mt-1">Selecione anúncios do mesmo modelo, versão e quantidade.</p><p className="text-sm text-gray-400 mt-2">Abra o anúncio no assistente, aguarde o AvantPro e volte aqui para capturar.</p></div><div className="space-y-3"><Link className="inline-block text-sm text-indigo-300 underline" to={productId ? `/browser?comparisonProductId=${encodeURIComponent(productId)}` : "/browser"}>Abrir assistente de navegação</Link><CaptureListingButton productId={productId} onCapturingChange={capturing => setBusy(capturing ? "capture" : null)} disabled={!!busy || loadingSaved} onCaptured={result => { setSnapshot(result.snapshot); setSelected(previous => new Set([...previous, result.savedId])); setAnalysis(null); setSearch(""); setLogistics("") }} /></div></div>
        {snapshot && <>
          <p className="text-xs text-gray-400 mt-4 break-all">{snapshot.title} · {new Date(snapshot.capturedAt).toLocaleString("pt-BR")} · {snapshot.listings.length} ofertas únicas</p>
          {snapshot.warnings.map(warning => <p key={warning} className="text-sm text-amber-300 mt-2">{warning}</p>)}
          <div className="market-filters flex flex-wrap gap-3 items-center my-4"><label className="flex items-center gap-2"><Search size={16} /><input aria-label="Buscar anúncios" placeholder="Título, vendedor ou MLB" value={search} onChange={event => setSearch(event.target.value)} className={fieldClass} /></label><select aria-label="Filtrar logística" value={logistics} onChange={event => setLogistics(event.target.value)} className={fieldClass}><option value="">Toda logística</option><option>Full</option><option>Flex</option><option>Normal</option><option>Outros</option><option value="unknown">Não identificada</option></select><button disabled={!!busy || !rows.length} className="text-sm text-indigo-300 disabled:opacity-40" onClick={() => { setSelected(previous => { const next = new Set(previous); const all = rows.every(row => next.has(row.id)); rows.forEach(row => all ? next.delete(row.id) : next.add(row.id)); return next }); invalidate() }}>{rows.length > 0 && rows.every(row => selected.has(row.id)) ? "Desmarcar visíveis" : "Selecionar visíveis"}</button><button disabled={!!busy} className="text-sm text-gray-400" onClick={() => { setSelected(new Set()); invalidate() }}>Limpar seleção</button><span aria-live="polite" className="text-sm ml-auto text-gray-300">{selected.size}/{snapshot.listings.length} selecionados · {rows.length} visíveis</span></div>
          <div className="market-table overflow-x-auto border border-gray-700 rounded-lg"><table className="w-full text-sm text-left"><thead className="bg-gray-900 sticky top-0 text-gray-400"><tr>{["Selecionar", "Anúncio / vendedor", "Preço", "Métricas do AvantPro", "Logística", "Usa Ads?", "Dados brutos"].map(label => <th className="p-3 font-medium whitespace-nowrap" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-700">{rows.map(row => <tr key={row.id} className={selected.has(row.id) ? "market-row-selected" : "bg-gray-800/30"}><td className="p-3"><input type="checkbox" aria-label={`Selecionar ${row.title}`} disabled={!!busy} checked={selected.has(row.id)} onChange={() => { setSelected(previous => { const next = new Set(previous); next.has(row.id) ? next.delete(row.id) : next.add(row.id); return next }); invalidate() }} /><button type="button" disabled={!!busy} onClick={() => removeListing(row.id)} aria-label={`Excluir ${row.title} da lista`} title="Excluir da lista de seleção" className="flex items-center gap-1 mt-3 px-2 py-1.5 rounded-md border border-red-400/30 text-xs text-red-300 hover:bg-red-500/15 disabled:opacity-40"><Trash2 size={14} aria-hidden="true" />Excluir</button></td><td className="p-3 min-w-64"><div className="flex items-center gap-3"><ListingCover key={row.imageUrl || "no-cover"} src={row.imageUrl} title={row.title} /><div className="min-w-0"><span className="block font-medium">{row.title}</span><span className="block text-xs text-gray-400 mt-1">{row.seller ? `Vendedor: ${row.seller}` : "Vendedor não identificado"} · {row.itemId || row.catalogId || "Sem ID"}</span>{row.url && <a className="text-xs text-indigo-300" href={row.url} target="_blank" rel="noopener noreferrer">Abrir oferta ↗</a>}<p className="text-[10px] text-gray-500 mt-1">Capturado em {row.capturedAt ? new Date(row.capturedAt).toLocaleString("pt-BR") : "data não disponível"}</p></div></div></td><td className="p-3 whitespace-nowrap">{currency(row.price)}</td><td className="p-3"><dl className="min-w-48 space-y-1 text-xs">{(row.avantproFields || []).filter(field => ["Vendidos", "Vendas estimadas", "Ritmo atual (vendas/mês)", "Vendas mensais"].includes(field.label)).map(field => <div key={field.label} className="flex justify-between gap-3"><dt className="text-gray-400">{field.label}</dt><dd className="text-right whitespace-nowrap">{field.value ?? "Sem dados"}</dd></div>)}</dl></td><td className="p-3" title={row.delivery || undefined}>{row.logistics || "Não identificada"}</td><td className="p-3"><select aria-label={`Ads de ${row.title}`} value={row.adsStatus || "unknown"} disabled={!!busy} onChange={event => updateAds(row.id, event.target.value as "yes" | "no" | "unknown")} className={fieldClass}><option value="unknown">{row.adClickId ? "Sim (pela URL)" : "Não informado"}</option><option value="yes">Sim</option><option value="no">Não</option></select>{row.adClickId && <p className="text-[10px] text-gray-400 mt-1">Clique Ads identificado na URL</p>}</td><td className="p-3"><details><summary className="cursor-pointer text-xs text-indigo-300">AvantPro</summary><pre className="whitespace-pre-wrap text-xs max-w-72 max-h-40 overflow-auto mt-2">{row.metrics || "Sem métricas AvantPro neste card."}</pre></details></td></tr>)}{!rows.length && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhuma ficha salva corresponde aos filtros. Ajuste a busca ou adicione dados à sua base.</td></tr>}</tbody></table></div>
        </>}
        {!snapshot && <p className="text-sm text-gray-400 mt-4">Nenhum anúncio disponível na sua base de comparação.</p>}
      </section>
      <section className="market-section rounded-xl border border-gray-700 bg-gray-800/40 p-5"><div className="market-analysis-footer flex flex-wrap gap-3 justify-end items-center mt-5"><label className="text-sm">Modelo de IA <select aria-label="Modelo de IA" disabled={!!busy} value={selectedModel} onChange={event => { setSelectedModel(event.target.value as typeof selectedModel); invalidate() }} className={fieldClass + " ml-2"}>{MODELS.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}</select></label><button onClick={analyze} disabled={!snapshot || selected.size < 2 || !!busy} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy === "analysis" && <Loader2 className="animate-spin" size={16} />}{busy === "analysis" ? "Aguardando o modelo…" : `Analisar ${selected.size} anúncios selecionados`}</button></div></section>
      </details>
      {analysis && <div ref={reportResult}><div className="market-result-heading"><Sparkles size={18}/><h2>Da pesquisa à decisão</h2><span>Resultado da análise</span></div><MarketReport analysis={analysis} /></div>}
    </div>
  </section>
}
