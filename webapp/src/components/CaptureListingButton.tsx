import { useState } from "react"
import { Link } from "react-router-dom"
import { Camera, Loader2 } from "lucide-react"
import { api } from "@/lib/api"
import { useStore } from "@/store/useStore"
import { comparisonDestination, selectCapturedListing } from "@/lib/listing-comparison"
import { isPublicMercadoLivreListingUrl } from "../../../shared/public-listing-url"
import type { MarketSnapshot } from "@/lib/market-analysis"

type CaptureResult = { snapshot: MarketSnapshot; savedId: string; warning?: string }
export function CaptureListingButton({ productId, onCaptured, onCapturingChange, disabled = false, showReturn = false }: {
  productId?: string; onCaptured?: (result: CaptureResult) => void; onCapturingChange?: (capturing: boolean) => void; disabled?: boolean; showReturn?: boolean
}) {
  const browserActive = useStore(state => state.browserActive)
  const browserUrl = useStore(state => state.browserUrl)
  const serverOnline = useStore(state => state.serverOnline)
  const publicListing = isPublicMercadoLivreListingUrl(browserUrl)
  const [capturing, setCapturing] = useState(false)
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const capture = async () => {
    if (capturing || !publicListing) return
    setCapturing(true); onCapturingChange?.(true); setNotice(""); setError("")
    try {
      const result = await api.captureMarketListings(productId)
      let savedSelection = true
      try { selectCapturedListing(localStorage, result.savedId, productId) }
      catch { savedSelection = false }
      onCaptured?.(result)
      setNotice(result.warning || (savedSelection ? "Anúncio salvo e selecionado para comparação." : "Anúncio salvo. Selecione-o na comparação; o navegador não permitiu salvar a seleção."))
    } catch (err) { setError(err instanceof Error ? err.message : "Não foi possível capturar o anúncio.") }
    finally { setCapturing(false); onCapturingChange?.(false) }
  }
  return <div className="space-y-2">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={capture} disabled={disabled || capturing || !browserActive || !serverOnline || !publicListing}
        className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500 disabled:opacity-50">
        {capturing ? <Loader2 size={16} className="animate-spin" /> : <Camera size={16} />}
        {capturing ? "Capturando…" : "Capturar anúncio com AvantPro"}
      </button>
      {showReturn && <Link className="text-sm text-indigo-300 underline" to={comparisonDestination(productId)}>Voltar à comparação</Link>}
    </div>
    {!browserActive ? <p className="text-xs text-gray-400">Inicie o navegador e abra um anúncio para capturar.</p> : !publicListing && <p className="text-xs text-gray-400">Abra uma página pública de anúncio do Mercado Livre.</p>}
    {notice && <p role="status" className="text-sm text-emerald-300">{notice}</p>}
    {error && <p role="alert" className="text-sm text-red-300">{error}</p>}
  </div>
}
