import { X, ExternalLink, Trash2, Calendar, Tag } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { usePipelineStore } from "@/store/usePipelineStore"

export const ProductDetailModal = () => {
  const { selectedProduct, setSelectedProduct, deleteProduct } = usePipelineStore()

  if (!selectedProduct) return null

  const handleDelete = async () => {
    if (confirm("Remover este produto da esteira?")) {
      await deleteProduct(selectedProduct._id)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-800 rounded-xl border border-gray-700 w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-gray-700">
          <div className="flex gap-3 flex-1 min-w-0">
            {selectedProduct.imageUrl ? (
              <img
                src={selectedProduct.imageUrl}
                alt={selectedProduct.title}
                className="w-16 h-16 object-cover rounded-lg bg-gray-700 flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 rounded-lg bg-gray-700 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <h2 className="text-lg font-semibold text-gray-100 line-clamp-2">{selectedProduct.title}</h2>
              <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                {selectedProduct.price > 0 && (
                  <span className="text-emerald-400 font-semibold">
                    R$ {selectedProduct.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                )}
                {selectedProduct.category && (
                  <span className="flex items-center gap-1">
                    <Tag className="w-3 h-3" />
                    {selectedProduct.category}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedProduct.analyzedAt).toLocaleDateString("pt-BR")}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {selectedProduct.url && (
              <a
                href={selectedProduct.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-blue-400 hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={handleDelete}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedProduct(null)}
              className="p-2 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Relatório */}
        <div className="flex-1 overflow-y-auto p-4">
          {selectedProduct.analysisReport ? (
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {selectedProduct.analysisReport}
              </ReactMarkdown>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhum relatório de análise disponível.</p>
          )}
        </div>
      </div>
    </div>
  )
}
