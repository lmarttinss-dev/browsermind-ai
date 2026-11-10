import { MarketListingRow } from "@/components/MarketListingRow"
import { MarketReport } from "@/components/MarketReport"
import { useStore } from "@/store/useStore"
import { useEffect, useMemo, useRef, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { ArrowLeft, Download, History, Loader2, Plus, Search, Trash2 } from "lucide-react"
import { api, MODELS } from "@/lib/api"
import { emptyProfile, filterListings, type AccountProfile, type MarketAnalysis, type MarketSnapshot } from "@/lib/market-analysis"

const HISTORY_KEY = "browsermind-market-analysis-v1"
const fieldClass = "rounded-lg border border-gray-700 bg-gray-900 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
const textButton = "text-sm text-gray-300 hover:text-white disabled:opacity-40"
const profileLabels: Record<keyof AccountProfile, string> = { account: "Conta habilitada para vender", sales: "Possui vendas concluídas", full: "Opera com Full", flex: "Opera com Flex", reviews: "Possui avaliações", medal: "Possui medalha MercadoLíder" }
function loadHistory(): MarketAnalysis[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]")
    return Array.isArray(parsed) ? parsed.filter(row => row && typeof row.report === "string" && Array.isArray(row.selected) && Array.isArray(row.readiness) && Array.isArray(row.actions) && Array.isArray(row.warnings) && row.pricing && row.logistics).slice(0, 10) : []
  } catch { return [] }
}
export function MarketAnalysisPage() {
  const { productId } = useParams()
  return <MarketAnalysisView key={productId ?? "standalone"} productId={productId} />
}

function MarketAnalysisView({ productId }: { productId?: string }) {
  const { selectedModel, setSelectedModel } = useStore()
  const mainRef = useRef<HTMLElement>(null)
  const [exportingPdf, setExportingPdf] = useState(false)
  const [loadingSaved, setLoadingSaved] = useState(true)
  const [snapshot, setSnapshot] = useState<MarketSnapshot | null>(null)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [profile, setProfile] = useState<AccountProfile>(emptyProfile)
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null)
  const [history, setHistory] = useState(() => productId ? [] : loadHistory())
  const [productTitle, setProductTitle] = useState<string | null>(null)
  const [loadingProduct, setLoadingProduct] = useState(!!productId)
  const [productError, setProductError] = useState("")
  const [showSetup, setShowSetup] = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const [search, setSearch] = useState("")
  const [logistics, setLogistics] = useState("")
  const [busy, setBusy] = useState<"capture" | "analysis" | "remove" | "ads" | null>(null)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const rows = useMemo(() => filterListings(snapshot?.listings || [], search, logistics), [snapshot, search, logistics])
  useEffect(() => {
    let active = true
    api.getSavedMarketListings().then(response => { if (active) setSnapshot(response.snapshot) }).catch(err => { if (active) setError(err.message) }).finally(() => { if (active) setLoadingSaved(false) })
    return () => { active = false }
  }, [])
  useEffect(() => {
    if (!productId) return
    let active = true
    api.getProductMarketAnalysis(productId).then(({ title, analysis: saved }) => {
      if (!active) return
      setProductTitle(title)
      if (saved) {
        setAnalysis(saved)
        setProfile(saved.profile)
        setShowSetup(false)
      }
    }).catch(err => {
      if (active) setProductError(err.message)
    }).finally(() => {
      if (active) setLoadingProduct(false)
    })
    return () => { active = false }
  }, [productId])

  const invalidate = () => {
    if (!productId) setAnalysis(null)
    setNotice("")
  }
  const updateAds = async (id: string, status: "yes" | "no" | "unknown") => {
    setBusy("ads"); setError(""); setNotice("")
    try { const response = await api.updateMarketListingAds(id, status); setSnapshot(response.snapshot); invalidate(); setNotice("Informação de Ads salva.") }
    catch (err) { setError(err instanceof Error ? err.message : "Não foi possível salvar Ads.") }
    finally { setBusy(null) }
  }
  const removeListings = async (ids: string[]) => {
    setBusy("remove"); setError(""); setNotice("")
    try {
      const { snapshot: remaining, deletedCount } = await api.removeSavedMarketListings(ids)
      setSnapshot(remaining)
      const remainingIds = new Set(remaining.listings.map(row => row.id))
      setSelected(previous => new Set([...previous].filter(id => remainingIds.has(id))))
      invalidate()
      setNotice(deletedCount === 1 ? "Anúncio excluído da lista de seleção."
        : deletedCount ? `${deletedCount} anúncios excluídos da lista de seleção.`
        : "Os anúncios selecionados já haviam sido removidos.")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível excluir os anúncios.")
    } finally {
      setBusy(null)
    }
  }
  const removeSelected = () => {
    const ids = [...selected]
    const target = ids.length === 1 ? "1 anúncio selecionado" : `${ids.length} anúncios selecionados`
    if (ids.length && window.confirm(`Excluir ${target} da lista compartilhada do Panorama AvantPro?`)) {
      void removeListings(ids)
    }
  }
  const capture = async () => {
    setBusy("capture"); setError(""); setNotice("")
    try {
      const response = await api.captureMarketListings()
      setSnapshot(response.snapshot); invalidate(); setSearch(""); setLogistics(""); setNotice(response.warning || "Anúncio capturado.")
    } catch (err) { setError(err instanceof Error ? err.message : "Falha ao capturar anúncios.") }
    finally { setBusy(null) }
  }
  const analyze = async () => {
    if (!snapshot || !selected.size || (productId && productTitle === null)) return
    setBusy("analysis"); setError(""); setNotice("")
    try {
      const { analysis: result } = await api.analyzeMarketSelection([...selected], profile, selectedModel, productId)
      showReport(result)
      if (productId) {
        setNotice("Panorama salvo no produto.")
        return
      }
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

  const showReport = (report: MarketAnalysis) => {
    setAnalysis(report)
    setShowSetup(false)
    mainRef.current?.scrollTo({ top: 0 })
  }

  const changeSelection = (ids: string[], checked: boolean) => {
    setSelected(previous => {
      const next = new Set(previous)
      for (const id of ids) {
        if (checked) next.add(id)
        else next.delete(id)
      }
      return next
    })
    invalidate()
  }

  const hasListings = !!snapshot?.listings.length
  const allVisibleSelected = rows.length > 0 && rows.every(row => selected.has(row.id))
  const hasFilters = !!(search.trim() || logistics)
  const selectionLabel = selected.size === 1 ? "1 oferta selecionada" : `${selected.size} ofertas selecionadas`
  const analyzeLabel = selected.size > 1 ? "Comparar anúncios" : "Analisar anúncio"

  return (
    <main ref={mainRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-5xl space-y-5 pb-10">
        {productId && <Link to={productTitle !== null ? `/pipeline/${productId}` : "/pipeline"} className="inline-flex items-center gap-1.5 text-sm text-indigo-300 hover:underline">
          <ArrowLeft size={14} aria-hidden="true" /> {productTitle !== null ? "Voltar ao produto" : "Voltar à esteira"}
        </Link>}

        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold">Panorama AvantPro</h1>
            <p className="mt-1 break-words text-sm text-gray-400">{productTitle ?? "Compare anúncios do mesmo produto no Mercado Livre."}</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {!productId && <button type="button" aria-expanded={showHistory} className={`${textButton} inline-flex items-center gap-1.5`} onClick={() => setShowHistory(!showHistory)}>
              <History size={16} aria-hidden="true" /> Histórico ({history.length})
            </button>}
            {analysis && <button type="button" disabled={exportingPdf} onClick={exportReport} className={`${fieldClass} inline-flex items-center gap-2 disabled:opacity-40`}>
              {exportingPdf ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Download size={16} aria-hidden="true" />}
              {exportingPdf ? "Gerando PDF…" : "Exportar PDF"}
            </button>}
          </div>
        </header>

        {loadingProduct && <p role="status" className="text-sm text-gray-400">Carregando panorama do produto…</p>}
        {productError && <p role="alert" className="text-sm text-red-300">{productError}</p>}
        {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p>}
        {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
        {showHistory && <section aria-label="Histórico de análises" className="space-y-2 rounded-xl border border-gray-700 p-4">
          <div className="flex justify-between gap-2">
            <h2 className="font-semibold">Histórico deste navegador</h2>
            {history.length > 0 && <button className={textButton} onClick={() => {
              try { localStorage.removeItem(HISTORY_KEY); setHistory([]) }
              catch { setError("Não foi possível limpar o histórico.") }
            }}>Limpar histórico</button>}
          </div>
          {!history.length && <p className="text-sm text-gray-400">Nenhuma análise salva.</p>}
          {history.map((item, index) => <button key={index} onClick={() => {
            showReport(item)
            setShowHistory(false)
            setNotice("")
          }} className="block w-full rounded-lg bg-gray-800 p-3 text-left text-sm hover:bg-gray-700">
            {item.title}
            <span className="mt-1 block text-xs text-gray-400">{new Date(item.analyzedAt).toLocaleString("pt-BR")} · {item.total} anúncios · {item.verdict}</span>
          </button>)}
        </section>}

        {analysis && <MarketReport analysis={analysis} />}
        {(!productId || productTitle !== null) && <details
          open={showSetup || !analysis}
          onToggle={event => setShowSetup(event.currentTarget.open)}
          className="rounded-xl border border-gray-700 bg-gray-800/25"
        >
          <summary className="cursor-pointer px-4 py-3 font-semibold sm:px-5">{analysis ? "Preparar outra análise" : "Selecionar anúncios para comparar"}</summary>
          <div className="space-y-4 border-t border-gray-700 p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="max-w-md text-sm text-gray-400">
                Abra um anúncio no <Link className="text-indigo-300 hover:underline" to="/">Browser</Link> para capturá-lo.
                Selecione ofertas com o mesmo modelo e variação.
              </p>
              <button type="button" disabled={!!busy || loadingSaved} onClick={capture} className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/50 px-3 py-2 text-sm font-medium text-indigo-200 hover:bg-indigo-500/15 disabled:opacity-40">
                {busy === "capture" ? <Loader2 size={16} className="animate-spin" aria-hidden="true" /> : <Plus size={16} aria-hidden="true" />}
                {busy === "capture" ? "Capturando…" : "Capturar anúncio aberto"}
              </button>
            </div>
            {loadingSaved && <p role="status" className="text-sm text-gray-400">Carregando fichas salvas…</p>}
            {!loadingSaved && !hasListings && <p className="rounded-lg border border-dashed border-gray-700 p-6 text-center text-sm text-gray-400">Capture o primeiro anúncio para começar.</p>}
            {hasListings && snapshot && <>
              <div className="flex flex-wrap items-start gap-3">
                <label className="flex min-w-0 grow items-center gap-2">
                  <Search size={16} className="shrink-0 text-gray-400" aria-hidden="true" />
                  <input aria-label="Buscar anúncios" placeholder="Título, vendedor ou MLB" value={search} onChange={event => setSearch(event.target.value)} className={`${fieldClass} w-full`} />
                </label>
                <details className="min-w-0 rounded-lg border border-gray-700 px-3 py-2 text-sm">
                  <summary className="cursor-pointer text-gray-300">{logistics ? "Filtro de logística ativo" : "Filtros"}</summary>
                  <select aria-label="Filtrar logística" value={logistics} onChange={event => setLogistics(event.target.value)} className={`${fieldClass} mt-2 w-full`}>
                    <option value="">Toda logística</option><option>Full</option><option>Flex</option><option>Normal</option><option>Outros</option><option value="unknown">Não identificada</option>
                  </select>
                </details>
              </div>

              <div className="overflow-hidden rounded-lg border border-gray-700">
                <div className="hidden grid-cols-[1rem_minmax(0,1fr)_7rem_8rem] gap-3 border-b border-gray-700 bg-gray-900/50 px-4 py-2 text-xs text-gray-400 sm:grid" aria-hidden="true">
                  <span /><span>Anúncio e vendedor</span><span>Preço</span><span>Vendas estimadas</span>
                </div>
                {rows.length ? <ul aria-label="Anúncios capturados" className="max-h-[28rem] divide-y divide-gray-700 overflow-auto">
                  {rows.map(row => <MarketListingRow
                    key={row.id}
                    listing={row}
                    selected={selected.has(row.id)}
                    disabled={!!busy}
                    onSelect={() => changeSelection([row.id], !selected.has(row.id))}
                    onAdsChange={status => updateAds(row.id, status)}
                    onRemove={() => removeListings([row.id])}
                  />)}
                </ul> : <p className="p-6 text-center text-sm text-gray-400">Nenhum anúncio corresponde aos filtros.</p>}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <button type="button" className={textButton} disabled={!!busy || snapshot.listings.every(row => selected.has(row.id))}
                  onClick={() => changeSelection(snapshot.listings.map(row => row.id), true)}
                  title="Inclui os anúncios fora dos filtros"
                >Selecionar todos</button>
                {hasFilters && rows.length > 0 && <button type="button" className={textButton} disabled={!!busy}
                  onClick={() => changeSelection(rows.map(row => row.id), !allVisibleSelected)}
                >{allVisibleSelected ? "Desmarcar visíveis" : "Selecionar visíveis"}</button>}
                {selected.size > 0 && <>
                  <button type="button" className={textButton} disabled={!!busy}
                    onClick={() => { setSelected(new Set()); invalidate() }}
                  >Limpar seleção</button>
                  <button type="button" className="inline-flex items-center gap-1 text-red-300 hover:text-red-200 disabled:opacity-40" disabled={!!busy} onClick={removeSelected}>
                    <Trash2 size={14} aria-hidden="true" /> {busy === "remove" ? "Excluindo…" : "Excluir selecionados"}
                  </button>
                </>}
              </div>
            </>}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-700 pt-4">
              <p aria-live="polite" className="text-sm text-gray-400">
                {selectionLabel}{hasFilters && ` · ${rows.length} ${rows.length === 1 ? "visível" : "visíveis"}`}
              </p>
              <button type="button" onClick={analyze} disabled={!selected.size || !!busy}
                className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-40"
              >
                {busy === "analysis" && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                {busy === "analysis" ? "Analisando…" : productId && selected.size ? `${analyzeLabel} e salvar` : analyzeLabel}
              </button>
            </div>

            <details>
              <summary className="w-fit cursor-pointer text-sm text-gray-400 hover:text-indigo-200">Configurações opcionais</summary>
              <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <label className="flex flex-col gap-1.5 text-sm text-gray-300">
                  Modelo de IA
                  <select aria-label="Modelo de IA" disabled={!!busy} value={selectedModel} onChange={event => {
                    setSelectedModel(event.target.value as typeof selectedModel)
                    invalidate()
                  }} className={fieldClass}>
                    {MODELS.map(model => <option key={model.id} value={model.id}>{model.name}</option>)}
                  </select>
                </label>
                {(Object.keys(profileLabels) as (keyof AccountProfile)[]).map(key => <label key={key} className="flex flex-col gap-1.5 text-sm text-gray-300">
                  {profileLabels[key]}
                  <select aria-label={profileLabels[key]} disabled={!!busy} value={profile[key]} onChange={event => {
                    setProfile(previous => ({ ...previous, [key]: event.target.value }))
                    invalidate()
                  }} className={fieldClass}>
                    <option value="unknown">Não informado</option><option value="yes">Sim</option><option value="no">Não</option>
                  </select>
                </label>)}
              </div>
            </details>
          </div>
        </details>}
      </div>
    </main>
  )
}
