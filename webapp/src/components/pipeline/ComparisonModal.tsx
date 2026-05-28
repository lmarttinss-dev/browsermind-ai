import { useState } from "react"
import { X, Loader2, ArrowRight, Trophy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { usePipelineStore } from "@/store/usePipelineStore"
import { MODELS } from "@/lib/api"
import type { PipelineProduct, PipelineStage } from "@/lib/api"

const MEDAL = ["🥇", "🥈", "🥉"]

const STAGE_LABELS: Record<string, { title: string; subtitle: string; destLabel: string }> = {
  triagem: {
    title: "Comparação de Produtos — Triagem",
    subtitle: "Selecione os melhores para avançar para análise",
    destLabel: "Mover para Análise",
  },
  analise: {
    title: "Comparação de Produtos — Em Análise",
    subtitle: "Selecione os melhores para aprovar para importação",
    destLabel: "Mover para Aprovado",
  },
}

export const ComparisonModal = ({ onClose }: { onClose: () => void }) => {
  const { products, comparison, isComparing, compareProducts, confirmTopProducts, comparisonStage } = usePipelineStore()
  const [model, setModel] = useState(MODELS[0].id)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  const stage = comparisonStage || "triagem"
  const stageProducts = products[stage]
  const labels = STAGE_LABELS[stage] || STAGE_LABELS.triagem

  // Sincroniza seleção quando ranking chega
  const rankingIds = comparison?.ranking.map(r => r.productId) || []
  const effectiveSelection = selectedIds.length > 0 ? selectedIds : rankingIds

  const toggleSelection = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  const handleConfirm = async () => {
    if (effectiveSelection.length === 0) return
    await confirmTopProducts(effectiveSelection)
    onClose()
  }

  const getProductById = (id: string): PipelineProduct | undefined =>
    stageProducts.find(p => p._id === id)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-xl w-[90vw] max-w-4xl max-h-[85vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <div>
            <h2 className="text-lg font-semibold text-gray-100">{labels.title}</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {stageProducts.length} produtos — {labels.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controles */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-800">
          <select
            value={model}
            onChange={e => setModel(e.target.value as typeof model)}
            className="bg-gray-800 border border-gray-600 text-gray-200 text-sm rounded-lg px-3 py-1.5 focus:ring-blue-500 focus:border-blue-500"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            onClick={() => compareProducts(model, stage)}
            disabled={isComparing || stageProducts.length < 3}
            className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {isComparing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Trophy className="w-4 h-4" />
                Analisar Top 3
              </>
            )}
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">
          {isComparing && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin mb-3" />
              <p className="text-sm">A IA está comparando {stageProducts.length} produtos...</p>
              <p className="text-xs text-gray-600 mt-1">Isso pode levar alguns segundos</p>
            </div>
          )}

          {!isComparing && !comparison && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <Trophy className="w-10 h-10 mb-3 text-gray-600" />
              <p className="text-sm">Clique em "Analisar Top 3" para a IA comparar os produtos</p>
              <p className="text-xs text-gray-600 mt-1">
                {stage === "analise"
                  ? "A IA vai avaliar margem real, fornecedores, MOQ e risco operacional"
                  : "A IA vai avaliar score, vendas, concorrência e margem de cada produto"}
              </p>
            </div>
          )}

          {!isComparing && comparison && (
            <>
              {/* Ranking Top 3 */}
              {comparison.ranking.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-3">Ranking Top 3</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {comparison.ranking.map((item, idx) => {
                      const product = getProductById(item.productId)
                      if (!product) return null
                      const isSelected = effectiveSelection.includes(item.productId)

                      return (
                        <div
                          key={item.productId}
                          onClick={() => toggleSelection(item.productId)}
                          className={`relative p-3 rounded-lg border cursor-pointer transition-all ${
                            isSelected
                              ? "border-blue-500 bg-blue-900/20 ring-1 ring-blue-500/50"
                              : "border-gray-700 bg-gray-800 hover:border-gray-600"
                          }`}
                        >
                          {/* Medal */}
                          <div className="absolute -top-2 -left-2 text-lg">{MEDAL[idx]}</div>

                          {/* Checkbox */}
                          <div className={`absolute top-2 right-2 w-5 h-5 rounded border flex items-center justify-center ${
                            isSelected ? "bg-blue-600 border-blue-600" : "border-gray-600"
                          }`}>
                            {isSelected && <Check className="w-3 h-3 text-white" />}
                          </div>

                          {/* Conteúdo */}
                          <div className="mt-2">
                            {product.imageUrl && (
                              <img
                                src={product.imageUrl}
                                alt={product.title}
                                className="w-full h-20 object-cover rounded mb-2"
                              />
                            )}
                            <h4 className="text-xs font-medium text-gray-100 line-clamp-2">{product.title}</h4>
                            <div className="flex items-center gap-2 mt-1.5 text-xs text-gray-400">
                              {product.price > 0 && (
                                <span className="text-emerald-400">R$ {product.price.toFixed(2).replace(".", ",")}</span>
                              )}
                              <span>Score: {product.score}/10</span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1.5 line-clamp-2">{item.reason}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Tabela comparativa (métricas) */}
              <div>
                <h3 className="text-sm font-semibold text-gray-200 mb-3">Tabela Comparativa</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-gray-300 border border-gray-700 rounded-lg overflow-hidden">
                    <thead className="bg-gray-800">
                      <tr>
                        <th className="text-left px-3 py-2 border-b border-gray-700">Produto</th>
                        <th className="text-center px-3 py-2 border-b border-gray-700">Preço</th>
                        <th className="text-center px-3 py-2 border-b border-gray-700">Score</th>
                        <th className="text-center px-3 py-2 border-b border-gray-700">Vendas/mês</th>
                        <th className="text-center px-3 py-2 border-b border-gray-700">Concorrência</th>
                        <th className="text-center px-3 py-2 border-b border-gray-700">Margem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stageProducts.slice(0, 15).map(product => {
                        const rankPos = comparison.ranking.findIndex(r => r.productId === product._id)
                        return (
                          <tr
                            key={product._id}
                            className={rankPos >= 0 ? "bg-blue-900/10" : ""}
                          >
                            <td className="px-3 py-2 border-b border-gray-800">
                              <div className="flex items-center gap-2">
                                {rankPos >= 0 && <span className="text-sm">{MEDAL[rankPos]}</span>}
                                <span className="line-clamp-1 max-w-[200px]">{product.title}</span>
                              </div>
                            </td>
                            <td className="text-center px-3 py-2 border-b border-gray-800 text-emerald-400">
                              {product.price > 0 ? `R$ ${product.price.toFixed(2).replace(".", ",")}` : "-"}
                            </td>
                            <td className="text-center px-3 py-2 border-b border-gray-800">
                              {product.score}/10
                            </td>
                            <td className="text-center px-3 py-2 border-b border-gray-800">
                              {product.monthlySales > 0 ? product.monthlySales.toLocaleString("pt-BR") : "-"}
                            </td>
                            <td className="text-center px-3 py-2 border-b border-gray-800">
                              {product.competitionLevel}
                            </td>
                            <td className="text-center px-3 py-2 border-b border-gray-800">
                              {product.potentialMargin || "-"}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Relatório da IA */}
              {comparison.report && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-200 mb-3">Análise Detalhada</h3>
                  <div className="prose prose-invert prose-sm max-w-none bg-gray-800 rounded-lg p-4 border border-gray-700">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {comparison.report}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!isComparing && comparison && comparison.ranking.length > 0 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-700">
            <p className="text-xs text-gray-500">
              {effectiveSelection.length} produto(s) selecionado(s) para mover
            </p>
            <button
              onClick={handleConfirm}
              disabled={effectiveSelection.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
              {labels.destLabel}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
