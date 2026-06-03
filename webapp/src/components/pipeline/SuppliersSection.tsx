import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink, Trash2, ShieldCheck, Clock, Star, Package, Loader2, ChevronDown, ChevronUp, AlertTriangle, Search } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { api, type Supplier, MODELS } from "@/lib/api"
import { PROMPT_TEMPLATES } from "@/lib/prompt-templates"

const SUPPLIER_TEMPLATE = PROMPT_TEMPLATES.find(t => t.id === "top3-fornecedores-alibaba")!

type Props = {
  productId: string
  suppliers: Supplier[]
  supplierReport: string
  onUpdate: (suppliers: Supplier[], supplierReport: string) => void
}

export const SuppliersSection = ({ productId, suppliers, supplierReport, onUpdate }: Props) => {
  const navigate = useNavigate()
  const [isCapturing, setIsCapturing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set())
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null)

  const toggleReport = (index: number) => {
    setExpandedReports(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleCapture = async () => {
    setIsCapturing(true)
    setError(null)
    try {
      // 1. Chamar análise via proxy principal (mesma funcionalidade do chat)
      const analyzeRes = await api.analyze({
        prompt: SUPPLIER_TEMPLATE.content,
        model: selectedModel,
      })

      if (!analyzeRes.success || !analyzeRes.response) {
        throw new Error("IA não retornou resposta")
      }

      // 2. Salvar relatório e parsear fornecedores no backend
      const saveRes = await api.captureSuppliers(productId, analyzeRes.response)
      onUpdate(saveRes.suppliers, saveRes.supplierReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCapturing(false)
    }
  }

  const handleRemove = async (index: number) => {
    try {
      const res = await api.removeSupplier(productId, index)
      onUpdate(res.suppliers, supplierReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setConfirmRemoveIndex(null)
    }
  }

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Fornecedores ({suppliers.length})
        </h3>
        <div className="flex items-center gap-2">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
            disabled={isCapturing}
            className="text-xs bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
          >
            {MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <button
            onClick={handleCapture}
            disabled={isCapturing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white rounded-lg transition-colors"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Package className="w-3.5 h-3.5" />
                Analisar Fornecedores
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 px-3 py-2 text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-lg">
          {error}
        </div>
      )}

      {suppliers.length === 0 ? (
        <div className="text-center py-10">
          <Package className="w-10 h-10 text-gray-600 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">Nenhum fornecedor vinculado.</p>
          <p className="text-gray-600 text-xs mt-1">
            Abra a página de resultados do Alibaba no Playwright e clique em "Capturar da Página Atual".
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {suppliers.map((supplier, index) => (
            <div
              key={`${supplier.url}-${index}`}
              className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-600 transition-colors"
            >
              <div className="flex gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-sm font-medium text-gray-200 truncate">{supplier.name}</span>
                    {supplier.tradeAssurance && (
                      <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-900/30 border border-emerald-800 px-1.5 py-0.5 rounded">
                        <ShieldCheck className="w-3 h-3" />
                        Trade Assurance
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    {supplier.unitPrice && (
                      <span className="text-emerald-400 font-medium">{supplier.unitPrice}</span>
                    )}
                    {supplier.moq && (
                      <span>MOQ: {supplier.moq}</span>
                    )}
                    {supplier.rating > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star className="w-3 h-3 text-yellow-500" />
                        {supplier.rating}/5
                      </span>
                    )}
                    {supplier.yearsInBusiness > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {supplier.yearsInBusiness} anos
                      </span>
                    )}
                    {supplier.responseRate && (
                      <span>Resposta: {supplier.responseRate}</span>
                    )}
                  </div>

                  {(supplier.capabilities || supplier.certifications) && (
                    <div className="flex flex-wrap gap-x-4 text-xs text-gray-500 mt-1.5">
                      {supplier.capabilities && <span>{supplier.capabilities}</span>}
                      {supplier.certifications && <span>📜 {supplier.certifications}</span>}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  {supplier.url && (
                    <a
                      href={supplier.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-blue-400 bg-gray-800 hover:bg-gray-700 rounded transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Alibaba
                    </a>
                  )}
                  {supplier.url && !supplier.report && (
                    <button
                      onClick={() => navigate(`/supplier-analysis?url=${encodeURIComponent(supplier.url)}`)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-amber-400 bg-gray-800 hover:bg-amber-900/50 rounded transition-colors"
                    >
                      <Search className="w-3 h-3" />
                      Detalhar
                    </button>
                  )}
                  {supplier.report && (
                    <button
                      onClick={() => toggleReport(index)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-purple-400 bg-gray-800 hover:bg-purple-900/50 rounded transition-colors"
                    >
                      {expandedReports.has(index) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Relatório
                    </button>
                  )}
                  <button
                    onClick={() => setConfirmRemoveIndex(index)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-red-400 bg-gray-800 hover:bg-red-900/50 rounded transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remover
                  </button>
                </div>
              </div>

              {/* Relatório individual do fornecedor */}
              {supplier.report && expandedReports.has(index) && (
                <div className="mt-3 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                  <div className="prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        a: ({ href, children }) => (
                          <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                        ),
                      }}
                    >
                      {supplier.report}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modal de confirmação */}
      {confirmRemoveIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmRemoveIndex(null)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-5 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-100">Remover fornecedor</h4>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Tem certeza que deseja remover <span className="text-gray-200 font-medium">{suppliers[confirmRemoveIndex]?.name}</span>? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmRemoveIndex(null)}
                className="px-3 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRemove(confirmRemoveIndex)}
                className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
