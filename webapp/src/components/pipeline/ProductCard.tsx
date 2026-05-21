import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Package, TrendingUp, Star, ExternalLink } from "lucide-react"
import type { PipelineProduct } from "@/lib/api"

export const ProductCard = ({ product, onClick }: { product: PipelineProduct; onClick: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product._id,
    data: { product },
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const competitionColor = {
    Baixa: "text-emerald-400 bg-emerald-900/30",
    Média: "text-yellow-400 bg-yellow-900/30",
    Alta: "text-orange-400 bg-orange-900/30",
    Saturado: "text-red-400 bg-red-900/30",
  }[product.competitionLevel] || "text-gray-400 bg-gray-900/30"

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-gray-800 rounded-lg border border-gray-700 p-3 cursor-grab active:cursor-grabbing hover:border-gray-600 transition-colors"
    >
      {/* Imagem */}
      {product.imageUrl ? (
        <img
          src={product.imageUrl}
          alt={product.title}
          className="w-full h-28 object-cover rounded-md mb-2 bg-gray-700"
        />
      ) : (
        <div className="w-full h-28 rounded-md mb-2 bg-gray-700 flex items-center justify-center">
          <Package className="w-8 h-8 text-gray-500" />
        </div>
      )}

      {/* Título */}
      <h4 className="text-sm font-medium text-gray-100 line-clamp-2 mb-2">{product.title}</h4>

      {/* Preço */}
      {product.price > 0 && (
        <p className="text-sm font-semibold text-emerald-400 mb-2">
          R$ {product.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      )}

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-2">
        {product.score > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-blue-900/30 text-blue-400">
            <Star className="w-3 h-3" />
            {product.score}
          </span>
        )}
        {product.monthlySales > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded bg-purple-900/30 text-purple-400">
            <TrendingUp className="w-3 h-3" />
            {product.monthlySales}/mês
          </span>
        )}
        <span className={`text-[10px] px-1.5 py-0.5 rounded ${competitionColor}`}>
          {product.competitionLevel}
        </span>
      </div>

      {/* Categoria + Link */}
      <div className="flex items-center justify-between text-[10px] text-gray-500">
        <span className="truncate">{product.category || "Sem categoria"}</span>
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}
