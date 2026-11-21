import { useEffect } from "react"
import { Link } from "react-router-dom"
import { ArrowUpRight, Layers3, Sparkles, CheckCheck, Loader2, RefreshCw } from "lucide-react"
import { KanbanBoard } from "@/components/pipeline/KanbanBoard"
import { ComparisonModal } from "@/components/pipeline/ComparisonModal"
import { usePipelineStore } from "@/store/usePipelineStore"
import type { PipelineStage } from "@/lib/api"

export const PipelinePage = () => {
  const { products, fetchProducts, isLoading, error, showComparison } = usePipelineStore()
  const openComparison = (stage: PipelineStage) => usePipelineStore.setState({ showComparison: true, comparisonStage: stage })
  const closeComparison = () => usePipelineStore.getState().clearComparison()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="pipeline-page flex-1 flex flex-col overflow-hidden">
      {/* Header da página */}
      <div className="module-heading flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div>
          <span className="pipeline-eyebrow">DA DESCOBERTA À OPERAÇÃO</span>
          <h1 className="text-lg font-semibold text-gray-100">Esteira de Produtos</h1>
          <p className="text-xs text-gray-500">Encontre o próximo passo de cada oportunidade.</p>
        </div>
        <button
          onClick={fetchProducts}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Atualizar
        </button>
      </div>

      <div className="pipeline-summary">
        <div><Layers3 size={18}/><span><strong>{Object.values(products).flat().length}</strong> produtos no workspace</span></div>
        <div><Sparkles size={18}/><span><strong>{products.triagem.length + products.analise.length}</strong> em descoberta e análise</span></div>
        <div><CheckCheck size={18}/><span><strong>{products.aprovado.length}</strong> oportunidades aprovadas</span></div>
        <Link to="/market-analysis">Pesquisar oportunidades <ArrowUpRight size={15}/></Link>
      </div>
      {/* Erro */}
      {error && (
        <div role="alert" className="mx-4 mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard onCompareClick={openComparison} />
      </div>

      {/* Modal de comparação */}
      {showComparison && <ComparisonModal onClose={closeComparison} />}
    </div>
  )
}
