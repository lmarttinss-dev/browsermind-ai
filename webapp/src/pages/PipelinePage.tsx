import { useEffect } from "react"
import { Loader2, RefreshCw } from "lucide-react"
import { KanbanBoard } from "@/components/pipeline/KanbanBoard"
import { usePipelineStore } from "@/store/usePipelineStore"

export const PipelinePage = () => {
  const { fetchProducts, isLoading, error } = usePipelineStore()

  useEffect(() => {
    fetchProducts()
  }, [fetchProducts])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header da página */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
        <div>
          <h1 className="text-lg font-semibold text-gray-100">Esteira de Produtos</h1>
          <p className="text-xs text-gray-500">Triagem e acompanhamento de produtos analisados</p>
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

      {/* Erro */}
      {error && (
        <div className="mx-4 mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {/* Board */}
      <div className="flex-1 overflow-hidden">
        <KanbanBoard />
      </div>
    </div>
  )
}
