import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ExternalLink, ShieldCheck, Clock, Star, Trash2, Plus, Loader2, AlertTriangle, MessageSquare, CheckCircle2, XCircle, Mail, CircleDot, DollarSign, Package, ChevronRight, Search } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MermaidRenderer } from "@/components/MermaidRenderer"
import { api, MODELS, type ModelId, type PipelineProduct, type Supplier, type NegotiationStatus, type SupplierQuote, NEGOTIATION_STATUSES } from "@/lib/api"

const STATUS_CONFIG: Record<NegotiationStatus, { label: string; color: string; bgColor: string; borderColor: string }> = {
  aguardando_resposta: { label: "Aguardando resposta", color: "text-gray-400", bgColor: "bg-gray-800", borderColor: "border-gray-600" },
  cotacao_recebida: { label: "Cotação recebida", color: "text-blue-400", bgColor: "bg-blue-900/30", borderColor: "border-blue-800" },
  negociando: { label: "Negociando", color: "text-amber-400", bgColor: "bg-amber-900/30", borderColor: "border-amber-800" },
  acordo_fechado: { label: "Acordo fechado", color: "text-emerald-400", bgColor: "bg-emerald-900/30", borderColor: "border-emerald-800" },
  rejeitado: { label: "Rejeitado", color: "text-red-400", bgColor: "bg-red-900/30", borderColor: "border-red-800" },
  sem_resposta: { label: "Sem resposta", color: "text-gray-500", bgColor: "bg-gray-900", borderColor: "border-gray-700" },
}

const StatusIcon = ({ status, className = "w-4 h-4" }: { status: NegotiationStatus; className?: string }) => {
  switch (status) {
    case "aguardando_resposta": return <Clock className={className} />
    case "cotacao_recebida": return <Mail className={className} />
    case "negociando": return <MessageSquare className={className} />
    case "acordo_fechado": return <CheckCircle2 className={className} />
    case "rejeitado": return <XCircle className={className} />
    case "sem_resposta": return <CircleDot className={className} />
  }
}

const parseCurrency = (value: string): number | null => {
  if (!value) return null
  const cleaned = value.replace(/[^0-9.,]/g, "").replace(/\.(?=.*[.,])/g, "").replace(",", ".")
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

const formatTotal = (a: string, b: string): string | null => {
  const va = parseCurrency(a)
  const vb = parseCurrency(b)
  if (va === null && vb === null) return null
  const total = (va || 0) + (vb || 0)
  const prefix = a.match(/^[^0-9]*/)?.[0]?.trim() || b.match(/^[^0-9]*/)?.[0]?.trim() || ""
  return prefix ? `${prefix} ${total.toFixed(2)}` : total.toFixed(2)
}

const parseMoq = (value: string): number | null => {
  if (!value) return null
  const match = value.match(/[\d.,]+/)
  if (!match) return null
  const num = parseInt(match[0].replace(/[.,]/g, ""))
  return isNaN(num) ? null : num
}

const calculateProductCost = (unitPrice: string, moq: string): string => {
  const price = parseCurrency(unitPrice)
  const qty = parseMoq(moq)
  if (price === null || qty === null) return ""
  const total = price * qty
  return maskDollar(total.toFixed(2))
}

const maskDollar = (value: string): string => {
  const digits = value.replace(/[^0-9]/g, "")
  if (!digits) return ""
  const cents = digits.padStart(3, "0")
  const intPart = cents.slice(0, -2).replace(/^0+/, "") || "0"
  const decPart = cents.slice(-2)
  return `US$ ${intPart}.${decPart}`
}

export const SupplierDetailPage = () => {
  const { id, supplierIndex } = useParams<{ id: string; supplierIndex: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<PipelineProduct | null>(null)
  const [selectedModel, setSelectedModel] = useState<ModelId>(MODELS[0].id)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showQuoteForm, setShowQuoteForm] = useState(false)
  const [editingQuoteIndex, setEditingQuoteIndex] = useState<number | null>(null)
  const [isSavingQuote, setIsSavingQuote] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)
  const [confirmRemoveQuoteIndex, setConfirmRemoveQuoteIndex] = useState<number | null>(null)
  const [quoteForm, setQuoteForm] = useState<Omit<SupplierQuote, "quotedAt">>({
    unitPrice: "", moq: "", totalProductCost: "", totalShippingCost: "", deliveryTime: "", paymentTerms: "", notes: "",
  })

  const index = parseInt(supplierIndex || "")
  const supplier: Supplier | undefined = product?.suppliers?.[index]

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    api.getPipelineProduct(id)
      .then((res) => setProduct(res.product))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleStatusChange = async (status: NegotiationStatus) => {
    if (!product) return
    try {
      const res = await api.updateSupplierStatus(product._id, index, status)
      setProduct({ ...product, suppliers: res.suppliers })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleSaveQuote = async () => {
    if (!product) return
    setIsSavingQuote(true)
    try {
      let res
      if (editingQuoteIndex !== null) {
        res = await api.editSupplierQuote(product._id, index, editingQuoteIndex, quoteForm)
      } else {
        res = await api.addSupplierQuote(product._id, index, quoteForm)
      }
      setProduct({ ...product, suppliers: res.suppliers })
      setShowQuoteForm(false)
      setEditingQuoteIndex(null)
      setQuoteForm({ unitPrice: "", moq: "", totalProductCost: "", totalShippingCost: "", deliveryTime: "", paymentTerms: "", notes: "" })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSavingQuote(false)
    }
  }

  const handleEditQuote = (quoteIndex: number) => {
    if (!supplier) return
    const quote = supplier.quotes[quoteIndex]
    setQuoteForm({
      unitPrice: quote.unitPrice || "",
      moq: quote.moq || "",
      totalProductCost: quote.totalProductCost || "",
      totalShippingCost: quote.totalShippingCost || "",
      deliveryTime: quote.deliveryTime || "",
      paymentTerms: quote.paymentTerms || "",
      notes: quote.notes || "",
    })
    setEditingQuoteIndex(quoteIndex)
    setShowQuoteForm(true)
  }

  const handleRemoveQuote = async (quoteIndex: number) => {
    if (!product) return
    try {
      const res = await api.removeSupplierQuote(product._id, index, quoteIndex)
      setProduct({ ...product, suppliers: res.suppliers })
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  const handleRemoveSupplier = async () => {
    if (!product) return
    try {
      await api.removeSupplier(product._id, index)
      navigate(`/pipeline/${product._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error && !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400 text-sm">{error}</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
      </div>
    )
  }

  if (!supplier || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400 text-sm">Fornecedor não encontrado</p>
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>
      </div>
    )
  }

  const status = supplier.negotiationStatus || "aguardando_resposta"
  const statusConfig = STATUS_CONFIG[status]

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-700/50 bg-gray-800/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/pipeline/${product._id}`)}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-gray-100 truncate">{supplier.name}</h1>
              {supplier.tradeAssurance && (
                <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-400 bg-emerald-900/30 border border-emerald-800 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" />
                  Trade Assurance
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 truncate">{product.title}</p>
          </div>
          <div className="flex items-center gap-2">
            {supplier.url && (
              <>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value as ModelId)}
                  className="text-xs bg-gray-800 border border-gray-600 text-gray-300 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-500"
                >
                  {MODELS.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
                <button
                  onClick={() => navigate(`/supplier-analysis?url=${encodeURIComponent(supplier.url.replace(/`/g, ""))}&model=${selectedModel}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
                >
                  <Search className="w-3.5 h-3.5" />
                  Analisar
                </button>
                <a
                  href={supplier.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-blue-400 rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Alibaba
                </a>
              </>
            )}
            <button
              onClick={() => setConfirmRemove(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Remover
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto p-5 space-y-6">

          {/* Error */}
          {error && (
            <div className="px-3 py-2 text-xs text-red-300 bg-red-900/30 border border-red-800 rounded-lg">
              {error}
            </div>
          )}

          {/* Status + Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Status Card */}
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Status da Negociação</h3>
              <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium border ${statusConfig.color} ${statusConfig.bgColor} ${statusConfig.borderColor} mb-3`}>
                <StatusIcon status={status} />
                {statusConfig.label}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {NEGOTIATION_STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => handleStatusChange(s)}
                    disabled={s === status}
                    className={`px-2 py-1 text-[10px] rounded border transition-colors ${
                      s === status
                        ? `${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].bgColor} ${STATUS_CONFIG[s].borderColor} cursor-default`
                        : "text-gray-500 bg-gray-900 border-gray-700 hover:border-gray-500 hover:text-gray-300"
                    }`}
                  >
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
              {supplier.negotiationStartedAt && (
                <p className="text-[10px] text-gray-500 mt-2">Iniciada em {new Date(supplier.negotiationStartedAt).toLocaleDateString("pt-BR")}</p>
              )}
              {supplier.lastContactAt && (
                <p className="text-[10px] text-gray-500">Último contato: {new Date(supplier.lastContactAt).toLocaleDateString("pt-BR")}</p>
              )}
            </div>

            {/* Info Card */}
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Informações</h3>
              <div className="space-y-2">
                {supplier.unitPrice && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Preço listado</span>
                    <span className="text-sm text-emerald-400 font-medium">{supplier.unitPrice}</span>
                  </div>
                )}
                {supplier.moq && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">MOQ</span>
                    <span className="text-sm text-gray-200">{supplier.moq}</span>
                  </div>
                )}
                {supplier.rating > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Rating</span>
                    <span className="text-sm text-gray-200 flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-yellow-500" />
                      {supplier.rating}/5
                    </span>
                  </div>
                )}
                {supplier.yearsInBusiness > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Anos no mercado</span>
                    <span className="text-sm text-gray-200">{supplier.yearsInBusiness}</span>
                  </div>
                )}
                {supplier.responseRate && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Taxa de resposta</span>
                    <span className="text-sm text-gray-200">{supplier.responseRate}</span>
                  </div>
                )}
                {supplier.capabilities && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Capacidades</span>
                    <span className="text-xs text-gray-300 text-right max-w-[60%]">{supplier.capabilities}</span>
                  </div>
                )}
                {supplier.certifications && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Certificações</span>
                    <span className="text-xs text-gray-300 text-right max-w-[60%]">{supplier.certifications}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Cotações */}
          <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Cotações ({supplier.quotes?.length || 0})
              </h3>
              <button
                onClick={() => { setShowQuoteForm(true); setEditingQuoteIndex(null); setQuoteForm({ unitPrice: "", moq: "", totalProductCost: "", totalShippingCost: "", deliveryTime: "", paymentTerms: "", notes: "" }) }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Nova Cotação
              </button>
            </div>

            {/* Formulário de cotação */}
            {showQuoteForm && (
              <div className="mb-4 p-4 bg-gray-900/50 border border-gray-600/50 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-300 mb-3">
                  {editingQuoteIndex !== null ? "Editar Cotação" : "Registrar Nova Cotação"}
                </h4>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Preço unitário</label>
                    <input
                      type="text"
                      value={quoteForm.unitPrice}
                      onChange={(e) => {
                        const unitPrice = maskDollar(e.target.value)
                        setQuoteForm(f => ({ ...f, unitPrice, totalProductCost: calculateProductCost(unitPrice, f.moq) || f.totalProductCost }))
                      }}
                      placeholder="US$ 0.00"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">MOQ</label>
                    <input
                      type="text"
                      value={quoteForm.moq}
                      onChange={(e) => {
                        const moq = e.target.value
                        setQuoteForm(f => ({ ...f, moq, totalProductCost: calculateProductCost(f.unitPrice, moq) || f.totalProductCost }))
                      }}
                      placeholder="100 unidades"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Custo total do produto</label>
                    <input
                      type="text"
                      value={quoteForm.totalProductCost}
                      onChange={(e) => setQuoteForm(f => ({ ...f, totalProductCost: maskDollar(e.target.value) }))}
                      placeholder="US$ 0.00"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Custo total do frete</label>
                    <input
                      type="text"
                      value={quoteForm.totalShippingCost}
                      onChange={(e) => setQuoteForm(f => ({ ...f, totalShippingCost: maskDollar(e.target.value) }))}
                      placeholder="US$ 0.00"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Prazo de entrega</label>
                    <input
                      type="text"
                      value={quoteForm.deliveryTime}
                      onChange={(e) => setQuoteForm(f => ({ ...f, deliveryTime: e.target.value }))}
                      placeholder="15-20 dias"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-gray-400 mb-1">Condições de pagamento</label>
                    <input
                      type="text"
                      value={quoteForm.paymentTerms}
                      onChange={(e) => setQuoteForm(f => ({ ...f, paymentTerms: e.target.value }))}
                      placeholder="30% adiantado + 70% antes do envio"
                      className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Custo total calculado */}
                {formatTotal(quoteForm.totalProductCost, quoteForm.totalShippingCost) && (
                  <div className="mb-3 px-3 py-2 bg-emerald-900/20 border border-emerald-800/50 rounded-lg flex items-center justify-between">
                    <span className="text-[11px] text-gray-400">Custo total (produto + frete)</span>
                    <span className="text-sm font-semibold text-emerald-400">{formatTotal(quoteForm.totalProductCost, quoteForm.totalShippingCost)}</span>
                  </div>
                )}

                <div className="mb-3">
                  <label className="block text-[11px] text-gray-400 mb-1">Notas / Mensagem do fornecedor</label>
                  <textarea
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="Cole aqui a resposta do fornecedor ou observações..."
                    rows={4}
                    className="w-full bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-600 focus:outline-none focus:border-emerald-500 resize-y"
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => { setShowQuoteForm(false); setEditingQuoteIndex(null) }}
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
            )}

            {/* Lista de cotações */}
            {(!supplier.quotes || supplier.quotes.length === 0) && !showQuoteForm ? (
              <div className="text-center py-8">
                <DollarSign className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">Nenhuma cotação registrada.</p>
                <p className="text-gray-600 text-xs mt-1">Clique em "Nova Cotação" para registrar a resposta do fornecedor.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...(supplier.quotes || [])].reverse().map((quote, qi) => {
                  const realIndex = (supplier.quotes?.length || 0) - 1 - qi
                  const total = formatTotal(quote.totalProductCost, quote.totalShippingCost)
                  return (
                    <div key={qi} className={`p-4 rounded-lg border ${qi === 0 ? "border-blue-800/50 bg-blue-900/10" : "border-gray-700/50 bg-gray-900/30"}`}>
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            {new Date(quote.quotedAt).toLocaleDateString("pt-BR")} {new Date(quote.quotedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {qi === 0 && <span className="text-[10px] text-blue-400 font-medium bg-blue-900/30 px-1.5 py-0.5 rounded">Mais recente</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditQuote(realIndex)}
                            className="text-xs text-blue-400 hover:text-blue-300 transition-colors px-2 py-1 rounded hover:bg-blue-900/30"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => setConfirmRemoveQuoteIndex(realIndex)}
                            className="text-xs text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-900/30"
                          >
                            Remover
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {quote.unitPrice && (
                          <div>
                            <span className="text-[10px] text-gray-500 block">Preço unitário</span>
                            <span className="text-sm text-emerald-400 font-medium">{quote.unitPrice}</span>
                          </div>
                        )}
                        {quote.moq && (
                          <div>
                            <span className="text-[10px] text-gray-500 block">MOQ</span>
                            <span className="text-sm text-gray-200">{quote.moq}</span>
                          </div>
                        )}
                        {quote.totalProductCost && (
                          <div>
                            <span className="text-[10px] text-gray-500 block">Total produto</span>
                            <span className="text-sm text-amber-400 font-medium">{quote.totalProductCost}</span>
                          </div>
                        )}
                        {quote.totalShippingCost && (
                          <div>
                            <span className="text-[10px] text-gray-500 block">Total frete</span>
                            <span className="text-sm text-amber-400 font-medium">{quote.totalShippingCost}</span>
                          </div>
                        )}
                        {total && (
                          <div>
                            <span className="text-[10px] text-gray-500 block">Custo total</span>
                            <span className="text-sm text-emerald-400 font-bold">{total}</span>
                          </div>
                        )}
                        {quote.deliveryTime && (
                          <div>
                            <span className="text-[10px] text-gray-500 block">Prazo entrega</span>
                            <span className="text-sm text-gray-200">{quote.deliveryTime}</span>
                          </div>
                        )}
                        {quote.paymentTerms && (
                          <div className="col-span-2">
                            <span className="text-[10px] text-gray-500 block">Pagamento</span>
                            <span className="text-sm text-gray-200">{quote.paymentTerms}</span>
                          </div>
                        )}
                      </div>

                      {quote.notes && (
                        <div className="mt-3 pt-3 border-t border-gray-700/50">
                          <span className="text-[10px] text-gray-500 block mb-1">Notas</span>
                          <p className="text-xs text-gray-300 whitespace-pre-wrap">{quote.notes}</p>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Relatório */}
          {supplier.report && (
            <div className="p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Package className="w-4 h-4" />
                Relatório de Análise
              </h3>
              <div className="prose prose-invert prose-sm max-w-none">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
                    ),
                    code({ className, children, ...props }) {
                      const match = /language-(\w+)/.exec(className || "")
                      if (match && match[1] === "mermaid") {
                        return <MermaidRenderer chart={String(children)} />
                      }
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      )
                    },
                  }}
                >
                  {supplier.report}
                </ReactMarkdown>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal de confirmação de remoção de cotação */}
      {confirmRemoveQuoteIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmRemoveQuoteIndex(null)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-5 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-100">Remover cotação</h4>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Tem certeza que deseja remover esta cotação? Esta ação não pode ser desfeita.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmRemoveQuoteIndex(null)}
                className="px-3 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => { handleRemoveQuote(confirmRemoveQuoteIndex); setConfirmRemoveQuoteIndex(null) }}
                className="px-3 py-1.5 text-sm text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
              >
                Remover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de confirmação de remoção */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => setConfirmRemove(false)} />
          <div className="relative bg-gray-800 border border-gray-700 rounded-xl shadow-xl p-5 max-w-sm w-full mx-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h4 className="text-sm font-semibold text-gray-100">Remover fornecedor</h4>
            </div>
            <p className="text-sm text-gray-400 mb-5">
              Tem certeza que deseja remover <span className="text-gray-200 font-medium">{supplier.name}</span>? Todas as cotações serão perdidas.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmRemove(false)}
                className="px-3 py-1.5 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleRemoveSupplier}
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
