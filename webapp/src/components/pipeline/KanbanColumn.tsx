import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { Scale } from "lucide-react"
import { ProductCard } from "./ProductCard"
import type { PipelineProduct, PipelineStage } from "@/lib/api"

const STAGE_CONFIG: Record<PipelineStage, { label: string; color: string }> = {
  triagem: { label: "Triagem", color: "border-t-blue-500" },
  analise: { label: "Em Análise", color: "border-t-yellow-500" },
  aprovado: { label: "Aprovado", color: "border-t-emerald-500" },
  importando: { label: "Importando", color: "border-t-purple-500" },
  concluido: { label: "Concluído", color: "border-t-gray-500" },
}

export const KanbanColumn = ({
  stage,
  products,
  onCardClick,
  onCompareClick,
}: {
  stage: PipelineStage
  products: PipelineProduct[]
  onCardClick: (product: PipelineProduct) => void
  onCompareClick?: () => void
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: stage })
  const config = STAGE_CONFIG[stage]

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col min-w-[280px] w-[280px] bg-gray-850 rounded-lg border border-gray-700 border-t-2 ${config.color} ${
        isOver ? "ring-2 ring-blue-500/50" : ""
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-gray-200">{config.label}</h3>
          <span className="text-xs text-gray-500 bg-gray-700 px-2 py-0.5 rounded-full">
            {products.length}
          </span>
        </div>
        {stage === "triagem" && products.length >= 3 && onCompareClick && (
          <button
            onClick={onCompareClick}
            title="Comparar produtos e selecionar Top 3"
            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-900/30 rounded transition-colors"
          >
            <Scale className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Cards */}
      <SortableContext items={products.map(p => p._id)} strategy={verticalListSortingStrategy}>
        <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px]">
          {products.map(product => (
            <ProductCard
              key={product._id}
              product={product}
              onClick={() => onCardClick(product)}
            />
          ))}
          {products.length === 0 && (
            <div className="flex items-center justify-center h-32 text-gray-600 text-xs">
              Nenhum produto
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}
