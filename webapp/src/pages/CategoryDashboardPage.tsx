import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, Loader2, Star, TrendingUp, BarChart3, Percent, Package, Layers } from "lucide-react"
import { api, type Category, type PipelineProduct, type CategoryDashboard } from "@/lib/api"

const STAGE_LABELS: Record<string, string> = {
  triagem: "Triagem",
  analise: "Em Análise",
  aprovado: "Aprovado",
  importando: "Importando",
  concluido: "Concluído",
}

const COMPETITION_COLORS: Record<string, string> = {
  Baixa: "text-emerald-400 bg-emerald-900/30 border-emerald-800",
  Média: "text-yellow-400 bg-yellow-900/30 border-yellow-800",
  Alta: "text-orange-400 bg-orange-900/30 border-orange-800",
  Saturado: "text-red-400 bg-red-900/30 border-red-800",
}

export const CategoryDashboardPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | null>(null)
  const [products, setProducts] = useState<PipelineProduct[]>([])
  const [metrics, setMetrics] = useState<CategoryDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    api.getCategory(id)
      .then((res) => {
        setCategory(res.category)
        setProducts(res.products)
        setMetrics(res.metrics)
      })
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id])

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    )
  }

  if (error || !category) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400 text-sm">{error || "Categoria não encontrada"}</p>
        <button
          onClick={() => navigate("/categories")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar às categorias
        </button>
      </div>
    )
  }

  const m = metrics

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700">
        <button
          onClick={() => navigate("/categories")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Categorias
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: category.color }} />
          <h1 className="text-lg font-semibold text-gray-100 truncate">{category.name}</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5">
          <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <Layers className="w-3 h-3" /> Produtos
            </span>
            <span className="text-xl font-bold text-gray-100">{m?.totalProducts ?? 0}</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <Star className="w-3 h-3" /> Score médio
            </span>
            <span className={`text-xl font-bold ${(m?.avgScore ?? 0) >= 7 ? "text-emerald-400" : (m?.avgScore ?? 0) >= 4 ? "text-yellow-400" : "text-red-400"}`}>
              {(m?.avgScore ?? 0) > 0 ? `${(m?.avgScore ?? 0).toFixed(1)}/10` : "—"}
            </span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Vendas/mês
            </span>
            <span className="text-xl font-bold text-purple-400">{(m?.totalMonthlySales ?? 0).toLocaleString("pt-BR")}</span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> Faturamento
            </span>
            <span className="text-xl font-bold text-emerald-400">
              {(m?.potentialRevenue ?? 0) > 0
                ? `R$ ${(m?.potentialRevenue ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                : "—"}
            </span>
          </div>
          <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
            <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
              <Package className="w-3 h-3" /> Cotações
            </span>
            <span className="text-xl font-bold text-blue-400">{m?.suppliersWithQuotes ?? 0}</span>
          </div>
        </div>

        {/* Distribuição por estágio */}
        {m && (
          <div className="px-5 pb-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Distribuição por estágio</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(m.byStage).map(([stage, count]) => (
                <div key={stage} className="flex items-center gap-2 px-3 py-1.5 bg-gray-900/50 rounded-lg border border-gray-700">
                  <span className="text-xs text-gray-400">{STAGE_LABELS[stage] || stage}</span>
                  <span className="text-xs font-semibold text-gray-100 bg-gray-700 px-2 py-0.5 rounded-full">{count}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Concorrência */}
        {m && (
          <div className="px-5 pb-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3 flex items-center gap-2">
              <Percent className="w-4 h-4" /> Concorrência
            </h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(m.competition).map(([level, count]) => (
                <span key={level} className={`text-xs font-medium px-2.5 py-1 rounded border ${COMPETITION_COLORS[level] || "text-gray-400 bg-gray-900/30 border-gray-700"}`}>
                  {level}: {count}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Produtos */}
        <div className="px-5 pb-8">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Produtos da categoria</h3>
          {products.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-gray-600">
              <Layers className="w-10 h-10 mb-2" />
              <p className="text-xs">Nenhum produto vinculado a esta categoria.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {products.map(product => (
                <button
                  key={product._id}
                  onClick={() => navigate(`/pipeline/${product._id}`)}
                  className="bg-gray-800 rounded-lg border border-gray-700 p-3 text-left hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.title} className="w-12 h-12 object-cover rounded-md bg-gray-700" />
                    ) : (
                      <div className="w-12 h-12 rounded-md bg-gray-700 flex items-center justify-center">
                        <Package className="w-5 h-5 text-gray-500" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-medium text-gray-100 truncate">{product.title.replace(/\*+/g, "")}</h4>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                        <span>{STAGE_LABELS[product.stage] || product.stage}</span>
                        {product.score > 0 && <span className="text-blue-400">★ {product.score}</span>}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
