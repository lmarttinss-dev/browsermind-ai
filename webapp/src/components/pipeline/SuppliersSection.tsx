import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ExternalLink, Trash2, ShieldCheck, Clock, Star, Package, Loader2, ChevronDown, ChevronUp, AlertTriangle, Search, MessageSquare, CheckCircle2, XCircle, Mail, CircleDot, Plus, DollarSign } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { api, type Supplier, type NegotiationStatus, type SupplierQuote, MODELS, NEGOTIATION_STATUSES } from "@/lib/api"
import { PROMPT_TEMPLATES } from "@/lib/prompt-templates"

const SUPPLIER_TEMPLATE = PROMPT_TEMPLATES.find(t => t.id === "top3-fornecedores-alibaba")!

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
  const [expandedReports, setExpandedReports] = useState<Set<number>>(new Set())
  const [confirmRemoveIndex, setConfirmRemoveIndex] = useState<number | null>(null)
  const [quoteModalIndex, setQuoteModalIndex] = useState<number | null>(null)
  const [editingQuoteIndex, setEditingQuoteIndex] = useState<number | null>(null)
  const [expandedQuotes, setExpandedQuotes] = useState<Set<number>>(new Set())
  const [quoteForm, setQuoteForm] = useState<Omit<SupplierQuote, "quotedAt">>({
    unitPrice: "", moq: "", shippingCost: "", totalProductCost: "", totalShippingCost: "", deliveryTime: "", paymentTerms: "", notes: "",
  })
  const [isSavingQuote, setIsSavingQuote] = useState(false)

  const toggleReport = (index: number) => {
    setExpandedReports(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const toggleQuotes = (index: number) => {
    setExpandedQuotes(prev => {
      const next = new Set(prev)
      if (next.has(index)) next.delete(index)
      else next.add(index)
      return next
    })
  }

  const handleStatusChange = async (index: number, status: NegotiationStatus) => {
    try {
      const res = await api.updateSupplierStatus(productId, index, status)
      onUpdate(res.suppliers, supplierReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleSaveQuote = async () => {
    if (quoteModalIndex === null) return
    setIsSavingQuote(true)
    try {
      let res
      if (editingQuoteIndex !== null) {
        res = await api.editSupplierQuote(productId, quoteModalIndex, editingQuoteIndex, quoteForm)
      } else {
        res = await api.addSupplierQuote(productId, quoteModalIndex, quoteForm)
      }
      onUpdate(res.suppliers, supplierReport)
      setQuoteModalIndex(null)
      setEditingQuoteIndex(null)
      setQuoteForm({ unitPrice: "", moq: "", shippingCost: "", totalProductCost: "", totalShippingCost: "", deliveryTime: "", paymentTerms: "", notes: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSavingQuote(false)
    }
  }

  const handleEditQuote = (supplierIndex: number, quoteIndex: number) => {
    const quote = suppliers[supplierIndex].quotes[quoteIndex]
    setQuoteForm({
      unitPrice: quote.unitPrice || "",
      moq: quote.moq || "",
      shippingCost: quote.shippingCost || "",
      totalProductCost: quote.totalProductCost || "",
      totalShippingCost: quote.totalShippingCost || "",
      deliveryTime: quote.deliveryTime || "",
      paymentTerms: quote.paymentTerms || "",
      notes: quote.notes || "",
    })
    setQuoteModalIndex(supplierIndex)
    setEditingQuoteIndex(quoteIndex)
  }

  const handleRemoveQuote = async (supplierIndex: number, quoteIndex: number) => {
    try {
      const res = await api.removeSupplierQuote(productId, supplierIndex, quoteIndex)
      onUpdate(res.suppliers, supplierReport)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
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

                  {/* Status badge + dropdown */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${STATUS_CONFIG[supplier.negotiationStatus || "aguardando_resposta"].color} ${STATUS_CONFIG[supplier.negotiationStatus || "aguardando_resposta"].bgColor} ${STATUS_CONFIG[supplier.negotiationStatus || "aguardando_resposta"].borderColor}`}>
                      <StatusIcon status={supplier.negotiationStatus || "aguardando_resposta"} />
                      {STATUS_CONFIG[supplier.negotiationStatus || "aguardando_resposta"].label}
                    </div>
                    <select
                      value={supplier.negotiationStatus || "aguardando_resposta"}
                      onChange={(e) => handleStatusChange(index, e.target.value as NegotiationStatus)}
                      className="text-[10px] bg-gray-800 border border-gray-700 text-gray-400 rounded px-1 py-0.5 focus:outline-none focus:border-blue-500 cursor-pointer"
                    >
                      {NEGOTIATION_STATUSES.map(s => (
                        <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                      ))}
                    </select>
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
                    {supplier.quotes?.length > 0 && (
                      <span className="text-blue-400 font-medium">
                        {supplier.quotes.length} cotação(ões)
                      </span>
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
                  <button
                    onClick={() => setQuoteModalIndex(index)}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-emerald-400 bg-gray-800 hover:bg-emerald-900/50 rounded transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Cotação
                  </button>
                  {supplier.quotes?.length > 0 && (
                    <button
                      onClick={() => toggleQuotes(index)}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] text-blue-400 bg-gray-800 hover:bg-blue-900/50 rounded transition-colors"
                    >
                      {expandedQuotes.has(index) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      Cotações
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

              {/* Histórico de cotações */}
              {supplier.quotes?.length > 0 && expandedQuotes.has(index) && (
                <div className="mt-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                  <h5 className="text-[11px] font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5" />
                    Histórico de Cotações
                  </h5>
                  <div className="space-y-2">
                    {[...supplier.quotes].reverse().map((quote, qi) => {
                      const realIndex = supplier.quotes.length - 1 - qi
                      return (
                        <div key={qi} className={`p-2.5 rounded border ${qi === 0 ? "border-blue-800/50 bg-blue-900/10" : "border-gray-700/50 bg-gray-900/30"}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[10px] text-gray-500">
                              {new Date(quote.quotedAt).toLocaleDateString("pt-BR")} {new Date(quote.quotedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                              {qi === 0 && <span className="ml-1.5 text-blue-400 font-medium">(mais recente)</span>}
                            </span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleEditQuote(index, realIndex)}
                                className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors"
                                title="Editar cotação"
                              >
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                              </button>
                              <button
                                onClick={() => handleRemoveQuote(index, realIndex)}
                                className="text-[10px] text-red-400 hover:text-red-300 transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1 text-xs">
                            {quote.unitPrice && (
                              <span><span className="text-gray-500">Preço:</span> <span className="text-emerald-400 font-medium">{quote.unitPrice}</span></span>
                            )}
                            {quote.moq && (
                              <span><span className="text-gray-500">MOQ:</span> <span className="text-gray-300">{quote.moq}</span></span>
                            )}
                            {quote.shippingCost && (
                              <span><span className="text-gray-500">Frete/un:</span> <span className="text-gray-300">{quote.shippingCost}</span></span>
                            )}
                            {quote.totalProductCost && (
                              <span><span className="text-gray-500">Total produto:</span> <span className="text-amber-400 font-medium">{quote.totalProductCost}</span></span>
                            )}
                            {quote.totalShippingCost && (
                              <span><span className="text-gray-500">Total frete:</span> <span className="text-amber-400 font-medium">{quote.totalShippingCost}</span></span>
                            )}
                            {quote.deliveryTime && (
                              <span><span className="text-gray-500">Prazo:</span> <span className="text-gray-300">{quote.deliveryTime}</span></span>
                            )}
                            {quote.paymentTerms && (
                              <span className="col-span-2"><span className="text-gray-500">Pagamento:</span> <span className="text-gray-300">{quote.paymentTerms}</span></span>
                            )}
                          </div>
                          {quote.notes && (
                            <p className="mt-1.5 text-[11px] text-gray-400 whitespace-pre-wrap border-t border-gray-700/50 pt-1.5">{quote.notes}</p>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

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

      {/* Modal de nova cotação */}
      {quoteModalIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setQuoteModalIndex(null)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-5 max-w-lg w-full mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-emerald-900/30 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-100">{editingQuoteIndex !== null ? "Editar Cotação" : "Registrar Cotação"}</h4>
                <p className="text-xs text-gray-400">{suppliers[quoteModalIndex]?.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Preço unitário</label>
                <input
                  type="text"
                  value={quoteForm.unitPrice}
                  onChange={(e) => setQuoteForm(f => ({ ...f, unitPrice: e.target.value }))}
                  placeholder="US$ 2.50"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">MOQ</label>
                <input
                  type="text"
                  value={quoteForm.moq}
                  onChange={(e) => setQuoteForm(f => ({ ...f, moq: e.target.value }))}
                  placeholder="100 unidades"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Frete unitário</label>
                <input
                  type="text"
                  value={quoteForm.shippingCost}
                  onChange={(e) => setQuoteForm(f => ({ ...f, shippingCost: e.target.value }))}
                  placeholder="US$ 1.50/un"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Prazo de entrega</label>
                <input
                  type="text"
                  value={quoteForm.deliveryTime}
                  onChange={(e) => setQuoteForm(f => ({ ...f, deliveryTime: e.target.value }))}
                  placeholder="15-20 dias"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Custo total do produto</label>
                <input
                  type="text"
                  value={quoteForm.totalProductCost}
                  onChange={(e) => setQuoteForm(f => ({ ...f, totalProductCost: e.target.value }))}
                  placeholder="US$ 250.00"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
              <div>
                <label className="block text-[11px] text-gray-400 mb-1">Custo total do frete</label>
                <input
                  type="text"
                  value={quoteForm.totalShippingCost}
                  onChange={(e) => setQuoteForm(f => ({ ...f, totalShippingCost: e.target.value }))}
                  placeholder="US$ 150.00"
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="block text-[11px] text-gray-400 mb-1">Condições de pagamento</label>
              <input
                type="text"
                value={quoteForm.paymentTerms}
                onChange={(e) => setQuoteForm(f => ({ ...f, paymentTerms: e.target.value }))}
                placeholder="30% adiantado + 70% antes do envio"
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="mb-4">
              <label className="block text-[11px] text-gray-400 mb-1">Notas / Mensagem do fornecedor</label>
              <textarea
                value={quoteForm.notes}
                onChange={(e) => setQuoteForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Cole aqui a resposta do fornecedor ou observações..."
                rows={4}
                className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-y"
              />
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setQuoteModalIndex(null); setEditingQuoteIndex(null); setQuoteForm({ unitPrice: "", moq: "", shippingCost: "", totalProductCost: "", totalShippingCost: "", deliveryTime: "", paymentTerms: "", notes: "" }) }}
                className="px-3 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuote}
                disabled={isSavingQuote}
                className="px-3 py-1.5 text-sm text-white bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-900 disabled:text-emerald-400 rounded-lg transition-colors flex items-center gap-1.5"
              >
                {isSavingQuote ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                {isSavingQuote ? "Salvando..." : editingQuoteIndex !== null ? "Salvar" : "Registrar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
