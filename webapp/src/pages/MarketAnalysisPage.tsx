import { ListingCover } from "@/components/ListingCover"
import { MarketReport } from "@/components/MarketReport"
import { useStore } from "@/store/useStore"
import { useEffect, useMemo, useState } from "react"
import { Link } from "react-router-dom"
import { BarChart3, Download, History, Loader2, RefreshCw, Search, Trash2 } from "lucide-react"
import { api, MODELS } from "@/lib/api"
import { currency, emptyProfile, filterListings, type AccountProfile, type MarketAnalysis, type MarketSnapshot } from "@/lib/market-analysis"

const HISTORY_KEY = "browsermind-market-analysis-v1"
const fieldClass = "bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
const profileLabels: Record<keyof AccountProfile, string> = { account: "Conta habilitada para vender", sales: "Possui vendas concluídas", full: "Opera com Full", flex: "Opera com Flex", reviews: "Possui avaliações", medal: "Possui medalha MercadoLíder" }
function loadHistory(): MarketAnalysis[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
    return Array.isArray(parsed) ? parsed.filter(row => row && typeof row.report === "string" && Array.isArray(row.selected) && Array.isArray(row.readiness) && Array.isArray(row.actions) && Array.isArray(row.warnings) && row.pricing && row.logistics).slice(0, 10) : []
  } catch { return [] }
}
export function MarketAnalysisPage() {
  const { selectedModel, setSelectedModel } = useStore()
  const [exportingPdf, setExportingPdf] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [profile, setProfile] = useState<AccountProfile>(emptyProfile)
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null)
  const [history, setHistory] = useState(loadHistory)
  const [showSetup, setShowSetup] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [search, setSearch] = useState("")
  const [logistics, setLogistics] = useState("")
  const [busy, setBusy] = useState<"capture" | "analysis" | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const rows = useMemo(() => filterListings(snapshot?.listings || [], search, logistics), [snapshot, search, logistics])
  useEffect(() => {
    let active = true
    api.getSavedMarketListings().then(response => { if (active) setSnapshot(response.snapshot) }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoadingSaved(false) })
    return () => { active = false }
  }, [])
  const updateAds = async (id: string, status: "yes" | "no" | "unknown") => {
    setBusy("capture"); setError(""); setNotice("")
    try { const response = await api.updateMarketListingAds(id, status); setSnapshot(response.snapshot); setAnalysis(null); setNotice("Informação de Ads salva.") }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar Ads.") }
    finally { setBusy(null) }
  }
  const removeListing = async (id: string) => {
    setBusy("capture"); setError(""); setNotice("")
    try { const response = await api.removeSavedMarketListing(id); setSnapshot(response.snapshot); setSelected(previous => { const next = new Set(previous); next.delete(id); return next }); setAnalysis(null); setNotice("Anúncio excluído da lista de seleção.") }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível remover a ficha.") }
    finally { setBusy(null) }
  }
  const invalidate = () => { setAnalysis(null); setNotice("") }
  const capture = async () => {
    setBusy("capture"); setError(""); setNotice("")
    try {
      const response = await api.captureMarketListings()
      setSnapshot(response.snapshot); setAnalysis(null); setSearch(""); setLogistics(""); setNotice(response.warning || "Ficha salva. Selecione os anúncios equivalentes para comparar ou analise uma ficha individualmente.")
    } catch (err) { setError(err instanceof Error ? err.message : "Falha ao capturar anúncios.") }
    finally { setBusy(null) }
  }
  const analyze = async () => {
    if (!snapshot || !selected.size) return
    setBusy("analysis"); setError(""); setNotice("")
    try {
      const { analysis: result } = await api.analyzeMarketSelection(snapshot.id, [...selected], profile, selectedModel)
      setAnalysis(result); setShowSetup(false)
      const next = [result, ...history].slice(0, 10)
      setHistory(next)
      try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); setNotice("Análise salva no histórico deste navegador.") }
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
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `panorama-avantpro-${analysis.analyzedAt.slice(0, 10)}.pdf`; anchor.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível gerar o PDF.") }
    finally { setExportingPdf(false) }
  }

  return <main className="flex-1 overflow-y-auto p-4 sm:p-6">
    <div className="max-w-7xl mx-auto space-y-5 pb-10">
      <header className="flex flex-wrap justify-between items-start gap-4">
        <div><p className="text-xs uppercase tracking-widest text-indigo-400 mb-2">Inteligência de mercado</p><h1 className="text-2xl font-semibold flex gap-2 items-center"><BarChart3 /> Panorama AvantPro</h1><p className="text-sm text-gray-400 mt-2">Selecione as ofertas comparáveis e avalie concorrência, logística e precificação.</p></div>
        <div className="flex gap-2"><button className={fieldClass + " flex items-center gap-2"} onClick={() => setShowHistory(!showHistory)}><History size={16} /> Histórico ({history.length})</button><button disabled={!analysis || exportingPdf} onClick={exportReport} className={fieldClass + " flex items-center gap-2 disabled:opacity-40"}>{exportingPdf ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}</button></div>
      </header>
      {loadingSaved && <p role="status" className="text-sm text-gray-400">Carregando fichas salvas…</p>}
      {error && <div role="alert" className="border border-red-800 bg-red-950/50 text-red-200 rounded-xl p-4">{error}</div>}
      {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
      {showHistory && <section aria-label="Histórico de análises" className="border border-gray-700 rounded-xl p-4 space-y-2"><div className="flex justify-between"><h2 className="font-semibold">Histórico deste navegador</h2>{history.length > 0 && <button className="text-xs text-gray-400" onClick={() => { try { localStorage.removeItem(HISTORY_KEY); setHistory([]) } catch { setError("Não foi possível limpar o histórico.") } }}>Limpar histórico</button>}</div><p className="text-xs text-gray-400">Últimas 10 análises; não sincronizado entre dispositivos.</p>{!history.length && <p className="text-sm text-gray-400">Nenhuma análise salva.</p>}{history.map((item, index) => <button key={index} onClick={() => { setAnalysis(item); setShowSetup(false); setShowHistory(false); setNotice("Exibindo análise histórica. A seleção atual não foi alterada.") }} className="block text-left w-full p-3 rounded-lg bg-gray-800 hover:bg-gray-700 text-sm">{item.title}<span className="block text-xs text-gray-400 mt-1">{new Date(item.analyzedAt).toLocaleString("pt-BR")} · {item.total} anúncios · {item.verdict}</span></button>)}</section>}
      <details open={showSetup || !analysis} onToggle={event => setShowSetup(event.currentTarget.open)} className="space-y-4">
        <summary className="cursor-pointer text-sm text-gray-300">Anúncios e configuração da análise</summary>
      <section className="rounded-xl border border-gray-700 bg-gray-800/40 p-5">
        <div className="flex flex-wrap justify-between gap-4"><div><h2 className="font-semibold">1. Capture anúncios individuais e selecione as fichas</h2><p className="text-sm text-gray-400 mt-1">Cole a URL de um anúncio no <Link className="text-indigo-300 underline" to="/">Browser</Link> com AvantPro ativo e clique em capturar. Repita para cada concorrente equivalente; as fichas ficam salvas para comparação.</p></div><button disabled={!!busy || loadingSaved} onClick={capture} className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2 text-sm disabled:opacity-50">{busy === "capture" ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}{busy === "capture" ? "Capturando…" : "Capturar anúncio aberto"}</button></div>
        {snapshot && <>
          <p className="text-xs text-gray-400 mt-4 break-all">{snapshot.title} · {new Date(snapshot.capturedAt).toLocaleString("pt-BR")} · {snapshot.listings.length} ofertas únicas</p>
          {snapshot.warnings.map(warning => <p key={warning} className="text-sm text-amber-300 mt-2">{warning}</p>)}
          <div className="flex flex-wrap gap-3 items-center my-4"><label className="flex items-center gap-2"><Search size={16} /><input aria-label="Buscar anúncios" placeholder="Título, vendedor ou MLB" value={search} onChange={event => setSearch(event.target.value)} className={fieldClass} /></label><select aria-label="Filtrar logística" value={logistics} onChange={event => setLogistics(event.target.value)} className={fieldClass}><option value="">Toda logística</option><option>Full</option><option>Flex</option><option>Normal</option><option>Outros</option><option value="unknown">Não identificada</option></select><button disabled={!!busy || !rows.length} className="text-sm text-indigo-300 disabled:opacity-40" onClick={() => { setSelected(previous => { const next = new Set(previous); const all = rows.every(row => next.has(row.id)); rows.forEach(row => all ? next.delete(row.id) : next.add(row.id)); return next }); invalidate() }}>{rows.length > 0 && rows.every(row => selected.has(row.id)) ? "Desmarcar visíveis" : "Selecionar visíveis"}</button><button disabled={!!busy} className="text-sm text-gray-400" onClick={() => { setSelected(new Set()); invalidate() }}>Limpar seleção</button><span aria-live="polite" className="text-sm ml-auto text-gray-300">{selected.size}/{snapshot.listings.length} selecionados · {rows.length} visíveis</span></div>
          <div className="overflow-auto max-h-[28rem] border border-gray-700 rounded-lg"><table className="w-full text-sm text-left"><thead className="bg-gray-900 sticky top-0 text-gray-400"><tr>{["Selecionar", "Anúncio / vendedor", "Preço", "Métricas do AvantPro", "Logística", "Usa Ads?", "Dados brutos"].map(label => <th className="p-3 font-medium whitespace-nowrap" key={label}>{label}</th>)}</tr></thead><tbody className="divide-y divide-gray-700">{rows.map(row => <tr key={row.id} className={selected.has(row.id) ? "bg-indigo-950/40" : "bg-gray-800/30"}><td className="p-3"><input type="checkbox" aria-label={`Selecionar ${row.title}`} disabled={!!busy} checked={selected.has(row.id)} onChange={() => { setSelected(previous => { const next = new Set(previous); next.has(row.id) ? next.delete(row.id) : next.add(row.id); return next }); invalidate() }} /><button type="button" disabled={!!busy} onClick={() => removeListing(row.id)} aria-label={`Excluir ${row.title} da lista`} title="Excluir da lista de seleção" className="flex items-center gap-1 mt-3 px-2 py-1.5 rounded-md border border-red-400/30 text-xs text-red-300 hover:bg-red-500/15 disabled:opacity-40"><Trash2 size={14} aria-hidden="true" />Excluir</button></td><td className="p-3 min-w-64"><div className="flex items-center gap-3"><ListingCover key={row.imageUrl || "no-cover"} src={row.imageUrl} title={row.title} /><div className="min-w-0"><span className="block font-medium">{row.title}</span><span className="block text-xs text-gray-400 mt-1">{row.seller ? `Vendedor: ${row.seller}` : "Vendedor não identificado"} · {row.itemId || row.catalogId || "Sem ID"}</span>{row.url && <a className="text-xs text-indigo-300" href={row.url} target="_blank" rel="noopener noreferrer">Abrir oferta ↗</a>}<p className="text-[10px] text-gray-500 mt-1">Capturado em {row.capturedAt ? new Date(row.capturedAt).toLocaleString("pt-BR") : "data não disponível"}</p></div></div></td><td className="p-3 whitespace-nowrap">{currency(row.price)}</td><td className="p-3"><dl className="min-w-48 space-y-1 text-xs">{(row.avantproFields || []).filter(field => ["Vendidos", "Vendas estimadas", "Ritmo atual (vendas/mês)", "Vendas mensais"].includes(field.label)).map(field => <div key={field.label} className="flex justify-between gap-3"><dt className="text-gray-400">{field.label}</dt><dd className="text-right whitespace-nowrap">{field.value ?? "Sem dados"}</dd></div>)}</dl></td><td className="p-3" title={row.delivery || undefined}>{row.logistics || "Não identificada"}</td><td className="p-3"><select aria-label={`Ads de ${row.title}`} value={row.adsStatus || "unknown"} disabled={!!busy} onChange={event => updateAds(row.id, event.target.value as "yes" | "no" | "unknown")} className={fieldClass}><option value="unknown">{row.adClickId ? "Sim (pela URL)" : "Não informado"}</option><option value="yes">Sim</option><option value="no">Não</option></select>{row.adClickId && <p className="text-[10px] text-gray-400 mt-1">Clique Ads identificado na URL</p>}</td><td className="p-3"><details><summary className="cursor-pointer text-xs text-indigo-300">AvantPro</summary><pre className="whitespace-pre-wrap text-xs max-w-72 max-h-40 overflow-auto mt-2">{row.metrics || "Sem métricas AvantPro neste card."}</pre></details></td></tr>)}{!rows.length && <tr><td colSpan={7} className="p-8 text-center text-gray-400">Nenhuma ficha salva corresponde aos filtros. Capture um anúncio individual no Browser.</td></tr>}</tbody></table></div>
        </>}
        {!snapshot && <div className="text-center text-gray-400 text-sm py-10">Abra um anúncio individual no Browser e capture sua ficha. Depois, selecione as fichas relevantes para analisar com a IA.</div>}
      </section>
      <section className="rounded-xl border border-gray-700 bg-gray-800/40 p-5"><h2 className="font-semibold">2. Informe a prontidão da sua conta</h2><p className="text-sm text-gray-400 mt-1 mb-4">Informações declaradas por você. Campos não informados permanecem como “Sem dados”.</p><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">{(Object.keys(profileLabels) as (keyof AccountProfile)[]).map(key => <label key={key} className="flex flex-col gap-2 text-sm text-gray-300">{profileLabels[key]}<select aria-label={profileLabels[key]} disabled={!!busy} value={profile[key]} onChange={event => { setProfile(previous => ({ ...previous, [key]: event.target.value })); invalidate() }} className={fieldClass}><option value="unknown">Não informado</option><option value="yes">Sim</option><option value="no">Não</option></select></label>)}</div><div className="flex flex-wrap gap-3 justify-end items-center mt-5"><label className="text-sm">Modelo de IA <select aria-label="Modelo de IA" disabled={!!busy} value={selectedModel} onChange={event => { setSelectedModel(event.target.value as typeof selectedModel); invalidate() }} className={fieldClass + " ml-2"}>{MODELS.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}</select></label><button onClick={analyze} disabled={!snapshot || !selected.size || !!busy} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg px-5 py-2.5 text-sm font-medium disabled:opacity-40">{busy === "analysis" && <Loader2 className="animate-spin" size={16} />}{busy === "analysis" ? "Aguardando o modelo…" : `Analisar ${selected.size} anúncios selecionados`}</button></div></section>
      </details>
      {analysis && <MarketReport analysis={analysis} />}
    </div>
  </main>
}
