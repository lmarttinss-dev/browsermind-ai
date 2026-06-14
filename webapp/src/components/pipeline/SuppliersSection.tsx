import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, Clock, Star, Package, Loader2, MessageSquare, CheckCircle2, XCircle, Mail, CircleDot, ChevronRight } from "lucide-react"
import { api, type Supplier, type NegotiationStatus, MODELS } from "@/lib/api"
import { PROMPT_TEMPLATES } from "@/lib/prompt-templates"

const SUPPLIER_TEMPLATE = PROMPT_TEMPLATES.find(t => t.id === "top5-fornecedores-alibaba")!

const STATUS_CONFIG: Record<NegotiationStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  aguardando_resposta: { label: "Aguardando", color: "text-gray-400", bgColor: "bg-gray-800", borderColor: "border-gray-600" },
  cotacao_recebida: { label: "Cotação recebida", color: "text-blue-400", bgColor: "bg-blue-900/30", borderColor: "border-blue-800" },
  negociando: { label: "Negociando", color: "text-amber-400", bgColor: "bg-amber-900/30", borderColor: "border-amber-800" },
  acordo_fechado: { label: "Acordo fechado", color: "text-emerald-400", bgColor: "bg-emerald-900/30", borderColor: "border-emerald-800" },
  rejeitado: { label: "Rejeitado", color: "text-red-400", bgColor: "bg-red-900/30", borderColor: "border-red-800" },
  sem_resposta: { label: "Sem resposta", color: "text-gray-500", bgColor: "bg-gray-900", borderColor: "border-gray-700" },
}

const StatusIcon = ({ status }: { status: NegotiationStatus }) => {
  const iconClass = "w-3 h-3"
  switch (status) {
    case "aguardando_resposta": return <Clock className={iconClass} />
    case "cotacao_recebida": return <Mail className={iconClass} />
    case "negociando": return <MessageSquare className={iconClass} />
    case "acordo_fechado": return <CheckCircle2 className={iconClass} />
    case "rejeitado": return <XCircle className={iconClass} />
    case "sem_resposta": return <CircleDot className={iconClass} />
  }
}

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
  const [statusFilter, setStatusFilter] = useState<NegotiationStatus | "todos">("todos")

  const filteredSuppliers = statusFilter === "todos"
    ? suppliers
    : suppliers.filter(s => (s.negotiationStatus || "aguardando_resposta") === statusFilter)

  const handleCapture = async () => {
    setIsCapturing(true)
    setError(null)
    try {
      const analyzeRes = await api.analyze({
        prompt: SUPPLIER_TEMPLATE.content,
        model: selectedModel,
      })

      if (!analyzeRes.success || !analyzeRes.response) {
        throw new Error("IA não retornou resposta")
      }

      const saveRes = await api.captureSuppliers(productId, analyzeRes.response)
      onUpdate(saveRes.suppliers, saveRes.supplierReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCapturing(false)
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
            Abra a página de resultados do Alibaba no Playwright e clique em "Analisar Fornecedores".
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap gap-1.5 mb-3">
            <button
              onClick={() => setStatusFilter("todos")}
              className={`text-[11px] px-2 py-1 rounded-lg border transition-colors ${
                statusFilter === "todos"
                  ? "border-blue-500 bg-blue-900/40 text-blue-300"
                  : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500"
              }`}
            >
              Todos ({suppliers.length})
            </button>
            {(Object.keys(STATUS_CONFIG) as NegotiationStatus[]).map(key => {
              const count = suppliers.filter(s => (s.negotiationStatus || "aguardando_resposta") === key).length
              if (count === 0) return null
              const cfg = STATUS_CONFIG[key]
              return (
                <button
                  key={key}
                  onClick={() => setStatusFilter(key)}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                    statusFilter === key
                      ? `${cfg.borderColor} ${cfg.bgColor} ${cfg.color}`
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500"
                  }`}
                >
                  <StatusIcon status={key} />
                  {cfg.label} ({count})
                </button>
              )
            })}
          </div>

          <div className="grid gap-2">
            {filteredSuppliers.map((supplier) => {
              const index = suppliers.indexOf(supplier)
            const status = supplier.negotiationStatus || "aguardando_resposta"
            const statusConfig = STATUS_CONFIG[status]
            const latestQuote = supplier.quotes?.length > 0 ? supplier.quotes[supplier.quotes.length - 1] : null

            return (
              <button
                key={`${supplier.url}-${index}`}
                onClick={() => navigate(`/pipeline/${productId}/supplier/${index}`)}
                className="w-full p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-gray-500 hover:bg-gray-800/50 transition-colors text-left group"
              >
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-200 truncate">{supplier.name}</span>
                      {supplier.tradeAssurance && (
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs">
                      <div className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                        <StatusIcon status={status} />
                        {statusConfig.label}
                      </div>
                      {supplier.unitPrice && (
                        <span className="text-emerald-400 font-medium">{supplier.unitPrice}</span>
                      )}
                      {supplier.moq && (
                        <span className="text-gray-500">MOQ: {supplier.moq}</span>
                      )}
                      {supplier.rating > 0 && (
                        <span className="text-gray-500 flex items-center gap-0.5">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {supplier.rating}
                        </span>
                      )}
                      {supplier.quotes?.length > 0 && (
                        <span className="text-blue-400">{supplier.quotes.length} cotação(ões)</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-600 group-hover:text-gray-400 transition-colors flex-shrink-0" />
                </div>
              </button>
            )
          })}
          </div>
        </>
      )}
    </div>
  )
}
