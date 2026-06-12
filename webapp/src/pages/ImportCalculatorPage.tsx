import { useState, useMemo, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { Calculator, DollarSign, Package, TrendingUp, HelpCircle, ArrowRight, Loader2, Link, CheckCircle2, Plus, Trash2, Boxes } from "lucide-react"
import { api, type PipelineProduct, type Supplier } from "@/lib/api"
import {
  calcImport,
  calcSales,
  calcInvestment,
  COURIER_RATE,
  type ProductInput,
  type SalesInput,
} from "@/lib/calculator"
import { parseReportMetrics } from "@/lib/utils"

type ProductMode = "single" | "multiple"

type KitCalcItem = {
  name: string
  quantity: number
}

const ImportCalculatorPage = () => {
  const { search } = useLocation()
  const navigate = useNavigate()
  const [dollarRate, setDollarRate] = useState(5.17)
  const [loadingRate, setLoadingRate] = useState(true)
  const [productMode, setProductMode] = useState<ProductMode>("single")

  // Estado para produto da esteira
  const [pipelineProduct, setPipelineProduct] = useState<PipelineProduct | null>(null)
  const [isLoadingProduct, setIsLoadingProduct] = useState(false)
  const [selectedSupplierInfo, setSelectedSupplierInfo] = useState<{
    supplier: Supplier | null
    supplierIndex: number
    quoteIndex: number | null
  } | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  // Lê parâmetros da URL manualmente (mais confiável que useSearchParams com navigate)
  const params = new URLSearchParams(search)
  const productId = params.get("productId")
  const supplierIndex = params.get("supplier")
  const quoteIndex = params.get("quote")
  const urlPrice = params.get("price")

  const [product, setProduct] = useState<ProductInput>({
    name: "",
    importTax: 60,
    quantity: 50,
    unitPriceDollar: 0,
    shippingDollar: 0,
    icms: 17,
  })

  const [sales, setSales] = useState<SalesInput>({
    isKit: false,
    salesTax: 4,
    salePrice: 0,
    shippingFee: 9,
    adFee: 11,
    packagingCost: 0,
  })

  // Kit simulation (Etapa 2)
  const [isKit, setIsKit] = useState(false)
  const [kitItems, setKitItems] = useState<KitCalcItem[]>([{ name: "", quantity: 1 }])

  // Limpa strings como "US$ 1.32" → 1.32
  const parsePrice = (v: string | undefined): number => {
    if (!v) return 0
    const cleaned = v.replace(/[^0-9.,]/g, "").replace(",", ".")
    return parseFloat(cleaned) || 0
  }

  // Busca produto da esteira se veio com productId
  useEffect(() => {
    if (!productId) return
    setIsLoadingProduct(true)
    api.getPipelineProduct(productId)
      .then((res) => {
        setPipelineProduct(res.product)
        const prod = res.product

        // Preenche nome do produto
        setProduct((prev) => ({ ...prev, name: prod.title || "" }))

        // Determina o preço de venda: product.price > metrics > urlParam
        const metricsPrice = parseReportMetrics(prod.analysisReport || "").price
        const resolvedPrice = prod.price > 0 ? prod.price : (metricsPrice > 0 ? metricsPrice : 0)
        const salePrice = resolvedPrice > 0 ? resolvedPrice : (urlPrice ? parseFloat(urlPrice) : 0)

        // Preenche dados de venda
        setSales((prev) => ({
          ...prev,
          salePrice: salePrice > 0 ? salePrice : prev.salePrice,
        }))

        // Se tem supplier/quote nos params, extrai dados
        if (supplierIndex && prod.suppliers) {
          const sIdx = parseInt(supplierIndex, 10)
          const supplier = prod.suppliers[sIdx]
          if (supplier) {
            // Determina qual cotação usar: a especificada nos params ou a mais recente
            let effectiveQuoteIndex: number | null = quoteIndex ? parseInt(quoteIndex, 10) : null

            if (effectiveQuoteIndex === null && supplier.quotes && supplier.quotes.length > 0) {
              const sortedQuotes = supplier.quotes
                .map((q, i) => ({ index: i, date: new Date(q.quotedAt).getTime() }))
                .sort((a, b) => b.date - a.date)
              effectiveQuoteIndex = sortedQuotes[0].index
            }

            setSelectedSupplierInfo({
              supplier,
              supplierIndex: sIdx,
              quoteIndex: effectiveQuoteIndex,
            })

            // Preço do fornecedor — atualiza via setProduct separado
            if (effectiveQuoteIndex !== null) {
              const quote = supplier.quotes?.[effectiveQuoteIndex]
              if (quote) {
                setProduct((prev) => ({
                  ...prev,
                  unitPriceDollar: parsePrice(quote.unitPrice),
                  shippingDollar: parsePrice(quote.totalShippingCost),
                  quantity: parseInt(quote.moq, 10) || 50,
                }))
              }
            } else {
              setProduct((prev) => ({
                ...prev,
                unitPriceDollar: parsePrice(supplier.unitPrice),
                quantity: parseInt(supplier.moq, 10) || 50,
              }))
            }
          }
        }
      })
      .catch((err) => console.error("Erro ao buscar produto da esteira:", err))
      .finally(() => setIsLoadingProduct(false))
  }, [productId, supplierIndex, quoteIndex])

  useEffect(() => {
    fetch("https://economia.awesomeapi.com.br/json/last/USD-BRL")
      .then((res) => res.json())
      .then((data) => {
        const rate = parseFloat(data.USDBRL.ask)
        if (!isNaN(rate)) setDollarRate(Math.round(rate * 100) / 100)
      })
      .catch(() => {})
      .finally(() => setLoadingRate(false))
  }, [])

  // Etapa 1 - Cálculos de importação (sem interferência do kit)
  const importCalc = useMemo(
    () => calcImport(product, dollarRate, COURIER_RATE),
    [product, dollarRate],
  )

  // Custo unitário efetivo na Etapa 2: se for kit, unitCost × soma das qtds
  const effectiveUnitCost = useMemo(() => {
    if (!isKit) return importCalc.unitCost
    const totalQty = kitItems.reduce((sum, item) => sum + (item.quantity || 1), 0)
    return importCalc.unitCost * totalQty
  }, [isKit, kitItems, importCalc.unitCost])

  // Etapa 2 - Cálculos de viabilidade de venda
  const salesCalc = useMemo(
    () => calcSales(sales, effectiveUnitCost),
    [sales, effectiveUnitCost],
  )

  // Etapa 3 - Montinho ao Montão
  const investmentCalc = useMemo(
    () =>
      calcInvestment(
        importCalc.totalImport,
        effectiveUnitCost,
        sales.salePrice,
        product.quantity,
        salesCalc.totalExpenses,
      ),
    [importCalc, salesCalc, sales.salePrice, product.quantity, effectiveUnitCost],
  )

  const handleSaveCalculator = async () => {
    if (!productId) return
    setIsSaving(true)
    try {
      await api.saveCalculatorResult(productId, {
        unitCost: importCalc.unitCost,
        roi: salesCalc.roi,
        contributionMargin: salesCalc.contributionMargin,
        profitPerUnit: salesCalc.profitPerUnit,
        multiplier: investmentCalc.multiplier,
        salePrice: sales.salePrice,
        quantity: product.quantity,
      })
      setSavedSuccess(true)
    } catch (err) {
      console.error("Erro ao salvar resultado:", err)
    } finally {
      setIsSaving(false)
    }
  }

  const formatBRL = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatUSD = (value: number) =>
    value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="flex-1 bg-gray-900">
      {/* Header */}
      <div className="py-4">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-100">
              Calculadora de Importação Simplificada
            </h1>
            <p className="text-xs text-gray-500 mt-1">
              Descubra o custo real, o preço de venda ideal e o lucro da sua importação
            </p>

            {/* Badge: Produto da Esteira */}
            {isLoadingProduct && (
              <div className="mt-3 flex items-center justify-center gap-2 text-xs text-gray-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Carregando produto...
              </div>
            )}
            {pipelineProduct && !isLoadingProduct && (
              <div className="mt-3 flex items-center justify-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 bg-blue-900/30 text-blue-400 text-xs font-medium px-3 py-1 rounded-full border border-blue-800/30">
                  <Link className="w-3 h-3" />
                  Produto: {pipelineProduct.title.length > 50
                    ? pipelineProduct.title.slice(0, 50) + "…"
                    : pipelineProduct.title}
                </span>
                {selectedSupplierInfo?.supplier && (
                  <span className="inline-flex items-center gap-1.5 bg-amber-900/30 text-amber-400 text-xs font-medium px-3 py-1 rounded-full border border-amber-800/30">
                    <Package className="w-3 h-3" />
                    Fornecedor: {selectedSupplierInfo.supplier.name}
                  </span>
                )}
                <button
                  onClick={() => navigate(`/pipeline/${productId}`)}
                  className="text-xs text-gray-500 hover:text-blue-400 underline transition-colors"
                >
                  Ver na esteira →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Etapa 1 e 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ETAPA 1 */}
          <div>
            <span className="inline-block bg-orange-900/30 text-orange-400 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              Etapa 1
            </span>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-orange-400" />
                  <h2 className="text-lg font-bold text-gray-100">Simulação de Custos da Importação</h2>
                </div>
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1.5">
                  <DollarSign className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-400">Dólar</span>
                  <span className="font-semibold text-sm text-gray-200">R$</span>
                  <input
                    type="number"
                    value={Number(dollarRate.toFixed(2))}
                    onChange={(e) => setDollarRate(Math.round(Number(e.target.value) * 100) / 100)}
                    className="w-14 text-sm font-semibold bg-transparent border-none focus:outline-none text-gray-200"
                    step="0.01"
                  />
                  {loadingRate ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400" />
                  ) : (
                    <span className="text-xs text-emerald-400 font-medium bg-emerald-900/30 px-2 py-0.5 rounded">HOJE</span>
                  )}
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Descubra o custo do produto na sua porta, pronto para revender.
              </p>

              {/* Toggle 1 produto / Vários */}
              <div className="flex items-center justify-between bg-gray-750 rounded-lg p-3 mb-6 bg-gray-700/50">
                <div className="flex items-center gap-1">
                  <span className="text-sm text-gray-300">Múltiplos produtos na mesma importação?</span>
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex bg-gray-800 rounded-lg border border-gray-600">
                  <button
                    onClick={() => setProductMode("single")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      productMode === "single"
                        ? "bg-orange-500 text-white"
                        : "text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    1 produto
                  </button>
                  <button
                    onClick={() => setProductMode("multiple")}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      productMode === "multiple"
                        ? "bg-orange-500 text-white"
                        : "text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Vários
                  </button>
                </div>
              </div>

              {/* Inputs Etapa 1 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Produto</label>
                  <input
                    type="text"
                    value={product.name}
                    onChange={(e) => setProduct({ ...product, name: e.target.value })}
                    placeholder="Nome do produto"
                    className="w-full border border-gray-600 bg-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                    <Package className="w-3 h-3" /> Imposto de Importação
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={product.importTax}
                      onChange={(e) => setProduct({ ...product, importTax: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Quantidade</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={product.quantity}
                      onChange={(e) => setProduct({ ...product, quantity: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">un</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Preço unitário (em dólar)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={product.unitPriceDollar}
                      onChange={(e) => setProduct({ ...product, unitPriceDollar: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg pl-7 pr-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Custo do Frete (em dólar)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">$</span>
                    <input
                      type="number"
                      value={product.shippingDollar}
                      onChange={(e) => setProduct({ ...product, shippingDollar: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg pl-7 pr-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">ICMS do seu estado</label>
                  <div className="relative">
                    <input
                      type="number"
                      value={product.icms}
                      onChange={(e) => setProduct({ ...product, icms: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-orange-500/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
              </div>

              {/* Resultado Etapa 1 */}
              <div className="mt-6 bg-orange-900/20 border border-orange-800/30 rounded-xl p-5">
                <p className="text-xs font-bold text-orange-400 uppercase tracking-wide mb-1">Custo Unitário Final</p>
                <p className="text-3xl font-bold text-gray-100">R$ {formatBRL(importCalc.unitCost)}</p>
                <p className="text-sm text-gray-500 mt-1">Na sua porta, pronto para venda</p>
              </div>

              {/* Detalhamento */}
              <details className="mt-4">
                <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-200">
                  Ver detalhamento dos custos da importação
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor aduaneiro USD</span>
                    <span className="font-medium text-gray-200">${formatUSD(importCalc.customsValueUSD)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Valor aduaneiro BRL</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(importCalc.customsValueBRL)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Imp. Importação ({product.importTax}%)</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(importCalc.importTaxValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">ICMS ({product.icms}%)</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(importCalc.icmsValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taxa Courier (DHL)</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(importCalc.courierFee)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2 font-semibold">
                    <span className="text-gray-200">Total da importação</span>
                    <span className="text-gray-200">R$ {formatBRL(importCalc.totalImport)}</span>
                  </div>
                </div>
              </details>
            </div>
          </div>

          {/* ETAPA 2 */}
          <div>
            <span className="inline-block bg-emerald-900/30 text-emerald-400 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
              Etapa 2
            </span>

            <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5 text-emerald-400" />
                  <h2 className="text-lg font-bold text-gray-100">Seu Produto Vale a Pena?</h2>
                </div>
                <div className="flex items-center gap-2 bg-gray-700 rounded-lg px-3 py-1.5">
                  <span className="text-sm text-gray-400">Imposto de Venda</span>
                  <input
                    type="number"
                    value={sales.salesTax}
                    onChange={(e) => setSales({ ...sales, salesTax: Number(e.target.value) })}
                    className="w-10 text-sm font-semibold bg-transparent border-none focus:outline-none text-center text-gray-200"
                  />
                  <span className="text-sm text-gray-500">%</span>
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mb-6">
                Faça a análise de viabilidade e descubra quanto você vai lucrar.
              </p>

              {/* Toggle Kit */}
              <div className="flex items-center justify-between bg-gray-700/50 rounded-lg p-3 mb-3">
                <div className="flex items-center gap-1">
                  <Boxes className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-300">É kit?</span>
                  <HelpCircle className="w-3.5 h-3.5 text-gray-500" />
                </div>
                <div className="flex bg-gray-800 rounded-lg border border-gray-600">
                  <button
                    onClick={() => setIsKit(false)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      !isKit ? "bg-emerald-500 text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Não
                  </button>
                  <button
                    onClick={() => setIsKit(true)}
                    className={`px-3 py-1.5 text-sm rounded-lg transition ${
                      isKit ? "bg-emerald-500 text-white" : "text-gray-400 hover:bg-gray-700"
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>

              {/* Kit Items (Etapa 2) */}
              {isKit && (
                <div className="bg-gray-700/30 rounded-lg border border-gray-600 p-4 space-y-3 mb-6">
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-400 font-medium">
                      Itens do Kit ({kitItems.length})
                    </p>
                    <button
                      onClick={() => setKitItems([...kitItems, { name: "", quantity: 1 }])}
                      className="flex items-center gap-1 text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      Adicionar item
                    </button>
                  </div>

                  {kitItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="text-[10px] text-gray-500 mb-0.5 block">
                          Item {i + 1}
                        </label>
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => {
                            const updated = [...kitItems]
                            updated[i] = { ...updated[i], name: e.target.value }
                            setKitItems(updated)
                          }}
                          placeholder="Nome do item"
                          className="w-full border border-gray-600 bg-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        />
                      </div>
                      <div className="w-20">
                        <label className="text-[10px] text-gray-500 mb-0.5 block">Unid/Kit</label>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => {
                            const updated = [...kitItems]
                            updated[i] = { ...updated[i], quantity: Math.max(1, Number(e.target.value) || 1) }
                            setKitItems(updated)
                          }}
                          min={1}
                          className="w-full border border-gray-600 bg-gray-700 rounded-lg px-2 py-2 text-sm text-gray-200 text-center focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                        />
                      </div>
                      {kitItems.length > 1 && (
                        <button
                          onClick={() => setKitItems(kitItems.filter((_, idx) => idx !== i))}
                          className="text-gray-500 hover:text-red-400 transition-colors mt-4"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}

                  {/* Total do kit */}
                  <div className="flex justify-between items-center pt-3 border-t border-gray-600">
                    <span className="text-xs text-gray-400">
                      Custo unit. (Etapa 1) × {kitItems.reduce((s, i) => s + (i.quantity || 1), 0)} unid
                    </span>
                    <span className="text-sm font-bold text-cyan-400">
                      R$ {effectiveUnitCost.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )}

              {/* Inputs Etapa 2 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Valor da Venda</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      value={sales.salePrice}
                      onChange={(e) => setSales({ ...sales, salePrice: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">
                    Custo do produto {isKit ? "(Kit)" : "(Etapa 1)"}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      value={Number(effectiveUnitCost.toFixed(2))}
                      readOnly
                      className="w-full border border-gray-600 bg-gray-700/50 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-300 font-semibold"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                    Taxa de frete <HelpCircle className="w-3 h-3 text-gray-500" />
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      value={sales.shippingFee}
                      onChange={(e) => setSales({ ...sales, shippingFee: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      step="0.01"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-400 mb-1 block flex items-center gap-1">
                    Tarifa do anúncio <HelpCircle className="w-3 h-3 text-gray-500" />
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={sales.adFee}
                      onChange={(e) => setSales({ ...sales, adFee: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">%</span>
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-gray-400 mb-1 block">Custo de embalagem</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="number"
                      value={sales.packagingCost}
                      onChange={(e) => setSales({ ...sales, packagingCost: Number(e.target.value) })}
                      className="w-full border border-gray-600 bg-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Resultado Etapa 2 */}
              <div className="mt-6 bg-gray-700/50 rounded-xl p-5">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">Resultado da Venda</p>
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-500">Lucro por unidade</p>
                    <p className={`text-lg font-bold ${salesCalc.profitPerUnit >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      R$ {formatBRL(salesCalc.profitPerUnit)}
                    </p>
                    <p className="text-xs text-gray-500">Por venda realizada</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-500">Margem de Contribuição</p>
                    <p className="text-lg font-bold text-gray-100">
                      {salesCalc.contributionMargin.toFixed(1)}%
                    </p>
                    <p className="text-xs text-gray-500">% sobre a venda</p>
                  </div>
                  <div className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <p className="text-xs text-gray-500">ROI (Retorno sobre o Investimento)</p>
                    <p className={`text-lg font-bold ${salesCalc.roi >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                      {salesCalc.roi.toFixed(0)}%
                    </p>
                    <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(Math.max(salesCalc.roi, 0), 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalhamento de custos por venda */}
              <details className="mt-4">
                <summary className="text-xs font-bold text-gray-400 uppercase tracking-wide cursor-pointer hover:text-gray-200">
                  Ver detalhamento de custos por venda
                </summary>
                <div className="mt-3 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Imposto sobre venda ({sales.salesTax}%)</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(salesCalc.salesTaxValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Tarifa do anúncio ({sales.adFee}%)</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(salesCalc.adFeeValue)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Taxa de frete</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(sales.shippingFee)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custo de embalagem</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(sales.packagingCost)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Custo do produto</span>
                    <span className="font-medium text-gray-200">R$ {formatBRL(salesCalc.productCost)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-700 pt-2 font-semibold">
                    <span className="text-gray-200">Total de despesas</span>
                    <span className="text-gray-200">R$ {formatBRL(salesCalc.totalExpenses)}</span>
                  </div>
                </div>
              </details>
            </div>
          </div>
        </div>

        {/* ETAPA 3 */}
        <div>
          <span className="inline-block bg-blue-900/30 text-blue-400 text-xs font-bold px-3 py-1 rounded-full mb-4 uppercase tracking-wide">
            Etapa 3
          </span>

          <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              <h2 className="text-lg font-bold text-gray-100">Do Montinho ao Montão</h2>
            </div>
            <p className="text-sm text-gray-500 mb-6">
              Descubra quanto seu investimento inicial pode se multiplicar.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-center">
              {/* Montinho */}
              <div className="bg-gray-700/50 rounded-xl p-6 text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Package className="w-4 h-4 text-gray-400" />
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Montinho</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">O que você investiu</p>
                <p className="text-3xl font-bold text-gray-100">
                  R$ {formatBRL(investmentCalc.totalInvestment)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {product.quantity} un × R$ {formatBRL(importCalc.unitCost)}
                </p>
              </div>

              {/* Multiplicador */}
              <div className="flex flex-col items-center gap-2">
                <ArrowRight className="w-5 h-5 text-orange-400" />
                <div className="bg-orange-500 text-white rounded-full w-20 h-20 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase font-bold">Multiplica</span>
                  <span className="text-xl font-bold">{investmentCalc.multiplier.toFixed(2)}x</span>
                </div>
                <ArrowRight className="w-5 h-5 text-emerald-400" />
              </div>

              {/* Montão */}
              <div className="bg-emerald-900/20 rounded-xl p-6 text-center border border-emerald-800/30">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wide">Montão</span>
                </div>
                <p className="text-xs text-gray-500 mb-1">O que volta pro seu bolso após vender tudo</p>
                <p className="text-3xl font-bold text-emerald-400">
                  R$ {formatBRL(investmentCalc.totalReturn)}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Receita R$ {formatBRL(investmentCalc.totalRevenue)} – taxas
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-center text-xs text-gray-600">
          Cálculos estimados • ICMS aplicado por dentro • Confirme alíquotas com seu contador
        </p>

        {/* Salvar na Esteira */}
        {pipelineProduct && !savedSuccess && (
          <div className="flex justify-center pb-8">
            <button
              onClick={handleSaveCalculator}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link className="w-4 h-4" />
              )}
              {isSaving ? "Salvando..." : "Salvar Resultado na Esteira"}
            </button>
          </div>
        )}

        {/* Sucesso ao salvar */}
        {savedSuccess && (
          <div className="flex flex-col items-center gap-4 pb-8">
            <div className="flex items-center gap-2 text-emerald-400 bg-emerald-900/20 border border-emerald-800/30 rounded-xl px-6 py-4">
              <CheckCircle2 className="w-5 h-5" />
              <span className="text-sm font-semibold">Resultado salvo na esteira!</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/pipeline/${productId}`)}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm rounded-lg transition-colors"
              >
                Ver Produto na Esteira
              </button>
              <button
                onClick={() => {
                  setSavedSuccess(false)
                  setPipelineProduct(null)
                  setSelectedSupplierInfo(null)
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-gray-700/50 hover:bg-gray-600 text-gray-400 text-sm rounded-lg transition-colors"
              >
                Continuar Calculando
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default ImportCalculatorPage
