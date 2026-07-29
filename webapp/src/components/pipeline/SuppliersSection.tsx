import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ShieldCheck, Clock, Star, Package, Loader2, MessageSquare, CheckCircle2, XCircle, Mail, CircleDot, ChevronRight, Search, AlertTriangle, ArrowUp, ArrowDown, Plus, X } from "lucide-react"
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
  type SortOption = "default" | "total-asc" | "total-desc"
  const [statusFilter, setStatusFilter] = useState<NegotiationStatus | "todos" | "inviavel">("todos")
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<SortOption>("default")

  // Modal de fornecedor manual
  const [showManualModal, setShowManualModal] = useState(false)
  const [manualForm, setManualForm] = useState({
    name: "",
    unitPrice: "",
    moq: "",
    shipping: "",
  })
  const [isAddingManual, setIsAddingManual] = useState(false)
  const [manualError, setManualError] = useState<string | null>(null)

  // Helper: extrai o custo total (produto + frete) da última cotação
  const getTotalCost = (s: Supplier): number | null => {
    const q = s.quotes?.length > 0 ? s.quotes[s.quotes.length - 1] : null
    if (!q) return null
    const parse = (v: string) => {
      if (!v) return null
      const cleaned = v.replace(/[^0-9.,]/g, "").replace(/\.(?=.*[.,])/g, "").replace(",", ".")
      const num = parseFloat(cleaned)
      return isNaN(num) ? null : num
    }
    const a = parse(q.totalProductCost)
    const b = parse(q.totalShippingCost)
    if (a === null && b === null) return null
    return (a || 0) + (b || 0)
  }

  const filteredSuppliers = suppliers.filter(s => {
    const matchesStatus = statusFilter === "todos"
      || (statusFilter === "inviavel" ? s.viable === false : (s.negotiationStatus || "aguardando_resposta") === statusFilter)
    const matchesSearch = !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesStatus && matchesSearch
  })

  const sortedSuppliers = [...filteredSuppliers].sort((a, b) => {
    switch (sortBy) {
      case "total-asc": {
        const ca = getTotalCost(a)
        const cb = getTotalCost(b)
        if (ca === null && cb === null) return 0
        if (ca === null) return 1
        if (cb === null) return -1
        return ca - cb
      }
      case "total-desc": {
        const ca = getTotalCost(a)
        const cb = getTotalCost(b)
        if (ca === null && cb === null) return 0
        if (ca === null) return 1
        if (cb === null) return -1
        return cb - ca
      }
      default:
        return 0
    }
  })

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

      if (saveRes.skippedCount && saveRes.skippedCount > 0) {
        setError(`Aviso: ${saveRes.skippedCount} fornecedor(es) ignorado(s) por já existirem no produto. ${saveRes.addedCount} novo(s) adicionado(s).`)
      } else {
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsCapturing(false)
    }
  }

  const handleAddManual = async () => {
    if (!manualForm.name.trim()) {
      setManualError("Nome do fornecedor é obrigatório")
      return
    }
    setIsAddingManual(true)
    setManualError(null)
    try {
      const res = await api.addManualSupplier(productId, manualForm)
      onUpdate(res.suppliers, supplierReport)
      setShowManualModal(false)
      setManualForm({
        name: "",
        unitPrice: "",
        moq: "",
        shipping: "",
      })
    } catch (err) {
      setManualError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsAddingManual(false)
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
          <button
            onClick={() => {
              setManualError(null)
              setShowManualModal(true)
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-700/50 hover:bg-emerald-700 text-emerald-300 rounded-lg transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Manualmente
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
          {/* Campo de busca + Ordenação */}
          <div className="flex items-center gap-2 mb-3">
            <div className="relative max-w-xs flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
              <input
                type="text"
                placeholder="Buscar fornecedor pelo nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-800 border border-gray-600 text-gray-300 rounded-lg focus:outline-none focus:border-blue-500 placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setSortBy(sortBy === "total-asc" ? "default" : "total-asc")}
                className={`flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-lg border transition-colors ${
                  sortBy === "total-asc"
                    ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                    : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                }`}
              >
                <ArrowUp className="w-3 h-3" />
                Menor custo
              </button>
              <button
                onClick={() => setSortBy(sortBy === "total-desc" ? "default" : "total-desc")}
                className={`flex items-center gap-1 text-[11px] px-2 py-1.5 rounded-lg border transition-colors ${
                  sortBy === "total-desc"
                    ? "border-emerald-600 bg-emerald-900/30 text-emerald-300"
                    : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-gray-500 hover:text-gray-300"
                }`}
              >
                <ArrowDown className="w-3 h-3" />
                Maior custo
              </button>
            </div>
          </div>

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
            {/* Filtro: Inviável */}
            {(() => {
              const inviavelCount = suppliers.filter(s => s.viable === false).length
              if (inviavelCount === 0) return null
              return (
                <button
                  onClick={() => setStatusFilter("inviavel")}
                  className={`text-[11px] px-2 py-1 rounded-lg border transition-colors flex items-center gap-1 ${
                    statusFilter === "inviavel"
                      ? "border-red-700 bg-red-900/40 text-red-300"
                      : "border-gray-700 bg-gray-800/50 text-gray-400 hover:border-red-800 hover:text-red-400"
                  }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  Inviável ({inviavelCount})
                </button>
              )
            })()}
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
            {sortedSuppliers.map((supplier) => {
              const index = suppliers.indexOf(supplier)
            const latestQuote = supplier.quotes?.length > 0 ? supplier.quotes[supplier.quotes.length - 1] : null
            const isNotViable = supplier.viable === false

            return (
              <button
                key={`${supplier.url}-${index}`}
                onClick={() => navigate(`/pipeline/${productId}/supplier/${index}`)}
                className={`w-full p-3 rounded-lg border transition-colors text-left group ${
                  isNotViable
                    ? "bg-red-950/30 border-red-800/60 hover:border-red-700 hover:bg-red-950/50"
                    : "bg-gray-900/50 border-gray-700 hover:border-gray-500 hover:bg-gray-800/50"
                }`}
              >
                {/* Banner de inviabilidade */}
                {isNotViable && (
                  <div className="flex items-center gap-1.5 mb-2 px-2 py-1 bg-red-900/40 border border-red-700/60 rounded text-[10px] font-semibold text-red-300 uppercase tracking-wider">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    Fornecedor sem viabilidade
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    {/* Linha 1: Nome + Rating + Trade Assurance */}
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-sm font-medium truncate ${isNotViable ? "text-red-300 line-through" : "text-gray-200"}`}>{supplier.name}</span>
                      {supplier.tradeAssurance && (
                        <ShieldCheck className={`w-3.5 h-3.5 flex-shrink-0 ${isNotViable ? "text-red-600" : "text-emerald-400"}`} />
                      )}
                      {supplier.rating > 0 && (
                        <span className="text-xs text-gray-400 flex items-center gap-0.5 ml-auto flex-shrink-0">
                          <Star className="w-3 h-3 text-yellow-500" />
                          {supplier.rating}
                        </span>
                      )}
                    </div>

                    {/* Linha 2: Custo total + cotação recebida (sútil) */}
                    <div className="flex items-center gap-2 text-xs">
                      {latestQuote ? (
                        <span className="text-emerald-400 font-medium">
                          {(() => {
                            const parseCurrency = (v: string): number | null => {
                              if (!v) return null
                              const cleaned = v.replace(/[^0-9.,]/g, "").replace(/\.(?=.*[.,])/g, "").replace(",", ".")
                              const num = parseFloat(cleaned)
                              return isNaN(num) ? null : num
                            }
                            const a = parseCurrency(latestQuote.totalProductCost)
                            const b = parseCurrency(latestQuote.totalShippingCost)
                            if (a === null && b === null) return null
                            const total = (a || 0) + (b || 0)
                            return `US$ ${total.toFixed(2)}`
                          })() || "—"}
                        </span>
                      ) : (
                        <span className="text-gray-600">Sem cotação</span>
                      )}
                      {supplier.negotiationStatus === "cotacao_recebida" && (
                        <span className="text-[10px] text-blue-400/60 flex items-center gap-0.5">
                          <Mail className="w-2.5 h-2.5" />
                          Cotação recebida
                        </span>
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

      {/* Modal: Adicionar Fornecedor Manualmente */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60" onClick={() => setShowManualModal(false)} />
          <div className="relative bg-gray-900 border border-gray-700 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="sticky top-0 bg-gray-900 border-b border-gray-700 px-5 py-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-200">Adicionar Fornecedor Manualmente</h3>
              <button
                onClick={() => setShowManualModal(false)}
                className="p-1 hover:bg-gray-700 rounded-md transition-colors"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {manualError && (
                <div className="px-3 py-2 text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-lg">
                  {manualError}
                </div>
              )}

              {/* Nome (obrigatório) */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Nome *</label>
                <input
                  type="text"
                  value={manualForm.name}
                  onChange={(e) => setManualForm({ ...manualForm, name: e.target.value })}
                  placeholder="Nome do fornecedor"
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder:text-gray-500"
                />
              </div>

              {/* Preço + MOQ lado a lado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Preço unitário</label>
                  <input
                    type="text"
                    value={manualForm.unitPrice}
                    onChange={(e) => setManualForm({ ...manualForm, unitPrice: e.target.value })}
                    placeholder="Ex: US$ 5.00"
                    className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder:text-gray-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">MOQ</label>
                  <input
                    type="text"
                    value={manualForm.moq}
                    onChange={(e) => setManualForm({ ...manualForm, moq: e.target.value })}
                    placeholder="Ex: 100 unidades"
                    className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder:text-gray-500"
                  />
                </div>
              </div>

              {/* Frete */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1">Frete</label>
                <input
                  type="text"
                  value={manualForm.shipping}
                  onChange={(e) => setManualForm({ ...manualForm, shipping: e.target.value })}
                  placeholder="Ex: US$ 200.00"
                  className="w-full px-3 py-2 text-sm bg-gray-800 border border-gray-600 text-gray-200 rounded-lg focus:outline-none focus:border-emerald-500 placeholder:text-gray-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-gray-900 border-t border-gray-700 px-5 py-4 flex justify-end gap-2">
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2 text-xs text-gray-400 hover:text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddManual}
                disabled={isAddingManual || !manualForm.name.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-400 text-white rounded-lg transition-colors"
              >
                {isAddingManual ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    Adicionar Fornecedor
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
