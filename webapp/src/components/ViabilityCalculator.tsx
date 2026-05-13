import { useState, useMemo } from "react"
import { useStore } from "@/store/useStore"
import { api } from "@/lib/api"
import { X, Calculator, Loader2, ChevronDown, ChevronUp, Info, RefreshCw } from "lucide-react"

type AdType = "classic" | "premium"
type CostType = "fixed" | "percent"

const SELLER_REPUTATIONS = [
  { value: "", label: "Selecionar" },
  { value: "green", label: "Verde" },
  { value: "light_green", label: "Verde claro" },
  { value: "yellow", label: "Amarelo" },
  { value: "orange", label: "Laranja" },
  { value: "red", label: "Vermelho" },
  { value: "gray", label: "Cinza" },
]

const TAX_REGIMES = [
  { value: "", label: "Selecionar" },
  { value: "simples", label: "Simples Nacional" },
  { value: "lucro_presumido", label: "Lucro Presumido" },
  { value: "lucro_real", label: "Lucro Real" },
  { value: "mei", label: "MEI" },
]

const ANNUAL_REVENUE_RANGES = [
  { value: "", label: "Selecionar" },
  { value: "180k", label: "Até R$ 180.000,00" },
  { value: "360k", label: "De R$ 180.000,01 a R$ 360.000,00" },
  { value: "720k", label: "De R$ 360.000,01 a R$ 720.000,00" },
  { value: "1800k", label: "De R$ 720.000,01 a R$ 1.800.000,00" },
  { value: "3600k", label: "De R$ 1.800.000,01 a R$ 3.600.000,00" },
  { value: "4800k", label: "De R$ 3.600.000,01 a R$ 4.800.000,00" },
]

const STATES = [
  "", "Acre (AC)", "Alagoas (AL)", "Amapá (AP)", "Amazonas (AM)", "Bahia (BA)",
  "Ceará (CE)", "Distrito Federal (DF)", "Espírito Santo (ES)", "Goiás (GO)",
  "Maranhão (MA)", "Mato Grosso (MT)", "Mato Grosso do Sul (MS)", "Minas Gerais (MG)",
  "Pará (PA)", "Paraíba (PB)", "Paraná (PR)", "Pernambuco (PE)", "Piauí (PI)",
  "Rio de Janeiro (RJ)", "Rio Grande do Norte (RN)", "Rio Grande do Sul (RS)",
  "Rondônia (RO)", "Roraima (RR)", "Santa Catarina (SC)", "São Paulo (SP)",
  "Sergipe (SE)", "Tocantins (TO)",
]

function formatCurrency(value: number): string {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function Section({ title, children, defaultOpen = true }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 text-left font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
      >
        {title}
        {open ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
      </button>
      {open && <div className="px-4 pb-4 space-y-3">{children}</div>}
    </div>
  )
}

function InputField({ label, value, onChange, suffix = "R$", type = "number", tooltip, disabled, placeholder }: {
  label: string
  value: string | number
  onChange: (v: string) => void
  suffix?: string
  type?: string
  tooltip?: string
  disabled?: boolean
  placeholder?: string
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm text-gray-600">
        {label}
        {tooltip && (
          <span className="group relative">
            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <div className="flex">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder || "0"}
          className="flex-1 bg-gray-50 border border-gray-200 rounded-l-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-60 disabled:cursor-not-allowed [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="inline-flex items-center px-3 bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg text-sm text-gray-500">
          {suffix}
        </span>
      </div>
    </div>
  )
}

function RadioGroup({ label, options, value, onChange }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="space-y-1">
      <label className="text-sm text-gray-600">{label}</label>
      <div className="flex items-center gap-4">
        {options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-1.5 cursor-pointer text-sm text-gray-700">
            <input
              type="radio"
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </div>
  )
}

function SelectField({ label, options, value, onChange, tooltip }: {
  label: string
  options: { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
  tooltip?: string
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center gap-1 text-sm text-gray-600">
        {label}
        {tooltip && (
          <span className="group relative">
            <Info className="w-3.5 h-3.5 text-gray-400 cursor-help" />
            <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 text-xs bg-gray-800 text-white rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
              {tooltip}
            </span>
          </span>
        )}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
      </div>
    </div>
  )
}

function ResultRow({ label, value, negative, bold }: { label: string; value: string; negative?: boolean; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 ${bold ? "font-semibold" : ""}`}>
      <span className="text-sm text-gray-600">{label}</span>
      <span className={`text-sm ${negative ? "text-red-600" : "text-gray-800"} ${bold ? "font-semibold" : ""}`}>
        {value}
      </span>
    </div>
  )
}

export function ViabilityCalculator() {
  const { showCalculator, setShowCalculator, browserActive } = useStore()
  const [loading, setLoading] = useState(false)
  const [avantproLoaded, setAvantproLoaded] = useState(false)

  // Produto
  const [salePrice, setSalePrice] = useState("")
  const [purchasePrice, setPurchasePrice] = useState("")
  const [monthlySales, setMonthlySales] = useState("")

  // Comissões
  const [adType, setAdType] = useState<AdType>("premium")
  const [commissionPercent, setCommissionPercent] = useState("")

  // Envio
  const [shippingState, setShippingState] = useState("")
  const [weight, setWeight] = useState("")
  const [sellerReputation, setSellerReputation] = useState("")
  const [freeShipping, setFreeShipping] = useState("no")
  const [shippingCost, setShippingCost] = useState("")

  // Impostos
  const [taxRegime, setTaxRegime] = useState("")
  const [annualRevenue, setAnnualRevenue] = useState("")
  const [taxPercent, setTaxPercent] = useState("")

  // Custo adicional
  const [additionalCost, setAdditionalCost] = useState("")
  const [additionalCostType, setAdditionalCostType] = useState<CostType>("fixed")

  const loadAvantproData = async () => {
    if (!browserActive) return
    setLoading(true)
    try {
      const res = await api.extractProduct()
      if (res.success && res.data) {
        const d = res.data
        if (d.salePrice !== null) setSalePrice(String(d.salePrice).replace(".", ","))
        if (d.monthlySales !== null) setMonthlySales(String(d.monthlySales))
        if (d.commissionPercent !== null) setCommissionPercent(String(d.commissionPercent).replace(".", ","))
        if (d.taxPercent !== null) setTaxPercent(String(d.taxPercent).replace(".", ","))
        setAvantproLoaded(true)
      }
    } catch {
      // Silencioso se falhar
    } finally {
      setLoading(false)
    }
  }

  const parseNum = (v: string) => {
    if (!v) return 0
    return parseFloat(v.replace(",", ".")) || 0
  }

  const calc = useMemo(() => {
    const sale = parseNum(salePrice)
    const purchase = parseNum(purchasePrice)
    const sales = parseInt(monthlySales) || 0
    const commission = parseNum(commissionPercent)
    const shipping = parseNum(shippingCost)
    const tax = parseNum(taxPercent)
    const additional = parseNum(additionalCost)

    const commissionValue = sale * commission / 100
    const taxValue = sale * tax / 100
    const additionalValue = additionalCostType === "percent"
      ? sale * additional / 100
      : additional

    const totalExpensesPerUnit = purchase + commissionValue + shipping + taxValue + additionalValue
    const revenuePerUnit = sale - totalExpensesPerUnit
    const grossMargin = sale > 0 ? (revenuePerUnit / sale) * 100 : 0

    const totalMonthlyExpenses = totalExpensesPerUnit * sales
    const totalMonthlyRevenue = revenuePerUnit * sales

    return {
      commissionValue,
      taxValue,
      additionalValue,
      totalExpensesPerUnit,
      revenuePerUnit,
      grossMargin,
      grossRevenue: sale,
      monthlySalesCount: sales,
      totalMonthlyExpenses,
      totalMonthlyRevenue,
      purchase,
      shipping,
    }
  }, [salePrice, purchasePrice, monthlySales, commissionPercent, shippingCost, taxPercent, additionalCost, additionalCostType])

  const netMargin = calc.grossMargin
  const netProfit = calc.revenuePerUnit

  if (!showCalculator) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-gray-50 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-800">Calculadora de Viabilidade</h2>
          </div>
          <div className="flex items-center gap-2">
            {browserActive && (
              <button
                onClick={loadAvantproData}
                disabled={loading}
                className="flex items-center gap-1.5 text-xs bg-blue-50 text-blue-700 hover:bg-blue-100 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors"
                title="Carregar dados do AvantPro da página atual"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {avantproLoaded ? "Recarregar AvantPro" : "Carregar AvantPro"}
              </button>
            )}
            <button onClick={() => setShowCalculator(false)} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">

          {/* Resumo - Margem líquida */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-2">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Margem líquida</span>
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className={`text-3xl font-bold ${netMargin >= 0 ? "text-gray-800" : "text-red-600"}`}>
              {formatCurrency(netMargin)}%
            </p>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-600">Lucro líquido</span>
              <Info className="w-3.5 h-3.5 text-gray-400" />
            </div>
            <p className={`text-lg font-semibold ${netProfit >= 0 ? "text-blue-600" : "text-red-600"}`}>
              R$ {formatCurrency(netProfit)}
            </p>
            {(!shippingCost && !additionalCost) && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2 mt-2">
                <span className="text-amber-500">⚠</span>
                Adicionar custo de envio, custos adicionais para obter a margem líquida correta
              </div>
            )}
          </div>

          {/* Produto */}
          <Section title="Produto">
            <InputField
              label="* Preço de venda, R$"
              tooltip="Preço de venda do produto no Mercado Livre"
              value={salePrice}
              onChange={setSalePrice}
            />
            <InputField
              label="* Preço de compra, R$"
              tooltip="Quanto você paga pelo produto"
              value={purchasePrice}
              onChange={setPurchasePrice}
            />
            <InputField
              label="Vendas"
              tooltip="Quantidade de vendas mensais"
              value={monthlySales}
              onChange={setMonthlySales}
              suffix="un"
            />
          </Section>

          {/* Custos - Comissões */}
          <Section title="Comissões">
            <RadioGroup
              label="Tipo de anúncio"
              options={[
                { value: "classic", label: "Clássico" },
                { value: "premium", label: "Premium" },
              ]}
              value={adType}
              onChange={(v) => setAdType(v as AdType)}
            />
            <div className="grid grid-cols-3 gap-3">
              <InputField
                label="Comissão, %"
                tooltip="Porcentagem de comissão do Mercado Livre"
                value={commissionPercent}
                onChange={setCommissionPercent}
                suffix="%"
              />
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  Comissão em R$
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <p className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800">
                  {formatCurrency(calc.commissionValue)}
                </p>
              </div>
              <div className="space-y-1">
                <label className="flex items-center gap-1 text-sm text-gray-600">
                  Taxa fixa, R$
                  <Info className="w-3.5 h-3.5 text-gray-400" />
                </label>
                <p className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500 italic">
                  Não disponível
                </p>
              </div>
            </div>
          </Section>

          {/* Envio */}
          <Section title="Envio">
            <div className="grid grid-cols-3 gap-3">
              <SelectField
                label="Estado de envio"
                options={STATES.map((s) => ({ value: s, label: s || "Selecionar" }))}
                value={shippingState}
                onChange={setShippingState}
              />
              <InputField
                label="Peso"
                tooltip="Peso do produto em gramas"
                value={weight}
                onChange={setWeight}
                suffix="g"
              />
              <SelectField
                label="Reputação do vendedor"
                options={SELLER_REPUTATIONS}
                value={sellerReputation}
                onChange={setSellerReputation}
              />
            </div>
            <RadioGroup
              label="Frete grátis"
              options={[
                { value: "yes", label: "Sim" },
                { value: "no", label: "Não" },
              ]}
              value={freeShipping}
              onChange={setFreeShipping}
            />
            <InputField
              label="Custo de envio em R$"
              tooltip="Custo do frete por unidade"
              value={shippingCost}
              onChange={setShippingCost}
            />
          </Section>

          {/* Impostos */}
          <Section title="Impostos">
            <SelectField
              label="Regime Fiscal"
              tooltip="Regime tributário da empresa"
              options={TAX_REGIMES}
              value={taxRegime}
              onChange={setTaxRegime}
            />
            <SelectField
              label="Receita bruta anual"
              tooltip="Faixa de receita bruta anual"
              options={ANNUAL_REVENUE_RANGES}
              value={annualRevenue}
              onChange={setAnnualRevenue}
            />
            <InputField
              label="Impostos, %"
              tooltip="Alíquota de imposto aplicada"
              value={taxPercent}
              onChange={setTaxPercent}
              suffix="%"
            />
          </Section>

          {/* Custo adicional */}
          <Section title="Custo adicional" defaultOpen={false}>
            <div className="space-y-1">
              <label className="text-sm text-gray-600">Custos adicionais, R$ ou %</label>
              <div className="flex">
                <input
                  type="number"
                  value={additionalCost}
                  onChange={(e) => setAdditionalCost(e.target.value)}
                  placeholder="0"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-l-lg px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <select
                  value={additionalCostType}
                  onChange={(e) => setAdditionalCostType(e.target.value as CostType)}
                  className="bg-gray-100 border border-l-0 border-gray-200 rounded-r-lg px-2 text-sm text-gray-600 focus:outline-none cursor-pointer"
                >
                  <option value="fixed">R$</option>
                  <option value="percent">%</option>
                </select>
              </div>
            </div>
          </Section>

          {/* Cálculo detalhado */}
          <Section title="Cálculo detalhado">
            <div className="space-y-4">
              <div className="space-y-1">
                <ResultRow label="Margem bruta" value={`${formatCurrency(calc.grossMargin)}%`} bold />
                <ResultRow label="Receita bruta" value={`R$ ${formatCurrency(calc.grossRevenue)}`} bold />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Por unidade</p>
                <ResultRow label="Despesas totais" value={`-R$ ${formatCurrency(calc.totalExpensesPerUnit)}`} negative />
                <ResultRow label="Receita" value={`R$ ${formatCurrency(calc.revenuePerUnit)}`} />
              </div>

              <div>
                <p className="text-sm font-semibold text-gray-700 mb-1">Incluindo todas as vendas mensais</p>
                <ResultRow label="Vendas mensais" value={String(calc.monthlySalesCount)} />
                <ResultRow label="Despesas totais" value={`-R$ ${formatCurrency(calc.totalMonthlyExpenses)}`} negative />
                <ResultRow label="Receita" value={`R$ ${formatCurrency(calc.totalMonthlyRevenue)}`} />
              </div>

              <div className="border-t border-gray-200 pt-3">
                <p className="text-sm font-semibold text-gray-700 mb-1">Todas as despesas</p>
                <ResultRow label="Preço de compra" value={`-R$ ${formatCurrency(calc.purchase)}`} negative />
                <ResultRow label="Comissão" value={`-R$ ${formatCurrency(calc.commissionValue)}`} negative />
                <ResultRow label="Frete" value={`-R$ ${formatCurrency(calc.shipping)}`} negative />
                <ResultRow label="Impostos" value={`-R$ ${formatCurrency(calc.taxValue)}`} negative />
                <ResultRow label="Custos adicionais" value={`-R$ ${formatCurrency(calc.additionalValue)}`} negative />
              </div>
            </div>
          </Section>
        </div>
      </div>
    </div>
  )
}
