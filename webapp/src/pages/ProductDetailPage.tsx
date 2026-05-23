import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import { ArrowLeft, ExternalLink, Trash2, Calendar, Tag, Star, TrendingUp, BarChart3, Percent, Layers, Package } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { api, type PipelineProduct, type PipelineStage, type Supplier } from "@/lib/api"
import { parseReportMetrics } from "@/lib/utils"
import { SuppliersSection } from "@/components/pipeline/SuppliersSection"

const STAGE_LABELS: Record<PipelineStage, { label: string; color: string }> = {
  triagem: { label: "Triagem", color: "bg-gray-600 text-gray-200" },
  analise: { label: "Em Análise", color: "bg-blue-900/50 text-blue-300" },
  aprovado: { label: "Aprovado", color: "bg-emerald-900/50 text-emerald-300" },
  importando: { label: "Importando", color: "bg-amber-900/50 text-amber-300" },
  concluido: { label: "Concluído", color: "bg-purple-900/50 text-purple-300" },
}

const COMPETITION_COLORS: Record<string, string> = {
  Baixa: "text-emerald-400 bg-emerald-900/30 border-emerald-800",
  Média: "text-yellow-400 bg-yellow-900/30 border-yellow-800",
  Alta: "text-orange-400 bg-orange-900/30 border-orange-800",
  Saturado: "text-red-400 bg-red-900/30 border-red-800",
}

type Tab = "produto" | "fornecedores"

export const ProductDetailPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [product, setProduct] = useState<PipelineProduct | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>("produto")

  useEffect(() => {
    if (!id) return
    setIsLoading(true)
    api.getPipelineProduct(id)
      .then((res) => setProduct(res.product))
      .catch((err) => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [id])

  const handleDelete = async () => {
    if (!product) return
    if (confirm("Remover este produto da esteira?")) {
      await api.deletePipelineProduct(product._id)
      navigate("/pipeline")
    }
  }

  const handleSuppliersUpdate = (suppliers: Supplier[], supplierReport: string) => {
    if (!product) return
    setProduct({ ...product, suppliers, supplierReport })
  }

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-spin w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3">
        <p className="text-gray-400 text-sm">{error || "Produto não encontrado"}</p>
        <button
          onClick={() => navigate("/pipeline")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Voltar à esteira
        </button>
      </div>
    )
  }

  const stageInfo = STAGE_LABELS[product.stage]
  const competitionColor = COMPETITION_COLORS[product.competitionLevel] || "text-gray-400 bg-gray-900/30 border-gray-700"

  const metrics = parseReportMetrics(product.analysisReport || "")
  const price = product.price > 0 ? product.price : metrics.price
  const score = product.score > 0 ? product.score : metrics.score
  const monthlySales = product.monthlySales > 0 ? product.monthlySales : metrics.monthlySales
  const potentialMargin = product.potentialMargin || metrics.potentialMargin

  const suppliersCount = product.suppliers?.length || 0

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-5 py-3 border-b border-gray-700">
        <button
          onClick={() => navigate("/pipeline")}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Esteira
        </button>
        <div className="flex-1" />
        {product.url && (
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 text-blue-400 rounded-lg transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Abrir no ML
          </a>
        )}
        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-700 hover:bg-red-900/50 text-red-400 rounded-lg transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Remover
        </button>
      </div>

      {/* Header do produto */}
      <div className="flex gap-5 p-5 border-b border-gray-700">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.title}
            className="w-32 h-32 object-cover rounded-xl bg-gray-700 flex-shrink-0"
          />
        ) : (
          <div className="w-32 h-32 rounded-xl bg-gray-700 flex-shrink-0 flex items-center justify-center">
            <Layers className="w-10 h-10 text-gray-500" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${stageInfo.color}`}>
              {stageInfo.label}
            </span>
          </div>
          <h1 className="text-xl font-semibold text-gray-100 mb-2">{product.title.replace(/\*+/g, "")}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            {product.category && (
              <span className="flex items-center gap-1">
                <Tag className="w-3.5 h-3.5" />
                {product.category.replace(/\*+/g, "")}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {new Date(product.analyzedAt).toLocaleDateString("pt-BR")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab("produto")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "produto"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          Produto
        </button>
        <button
          onClick={() => setActiveTab("fornecedores")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === "fornecedores"
              ? "border-blue-500 text-blue-400"
              : "border-transparent text-gray-400 hover:text-gray-300"
          }`}
        >
          <Package className="w-4 h-4" />
          Fornecedores
          {suppliersCount > 0 && (
            <span className="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-full">
              {suppliersCount}
            </span>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "produto" && (
          <>
            {/* Métricas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-5 border-b border-gray-700">
              <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1">Preço</span>
                <span className="text-xl font-bold text-emerald-400">
                  {price > 0
                    ? `R$ ${price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    : "—"}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <Star className="w-3 h-3" /> Score
                </span>
                <span className={`text-xl font-bold ${score >= 7 ? "text-emerald-400" : score >= 4 ? "text-yellow-400" : "text-red-400"}`}>
                  {score > 0 ? `${score}/10` : "—"}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Vendas/mês
                </span>
                <span className="text-xl font-bold text-purple-400">
                  {monthlySales > 0 ? monthlySales.toLocaleString("pt-BR") : "—"}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <Percent className="w-3 h-3" /> Margem
                </span>
                <span className="text-xl font-bold text-blue-400">
                  {potentialMargin?.replace(/\*+/g, "") || "—"}
                </span>
              </div>
              <div className="flex flex-col items-center p-4 bg-gray-900/50 rounded-lg border border-gray-700">
                <span className="text-[10px] uppercase tracking-wider text-gray-500 mb-1 flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" /> Competição
                </span>
                <span className={`text-sm font-medium px-2.5 py-1 rounded border ${competitionColor}`}>
                  {product.competitionLevel}
                </span>
              </div>
            </div>

            {/* Relatório */}
            <div className="p-5">
              {product.analysisReport ? (
                <>
                  <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4" />
                    Relatório de Análise
                  </h3>
                  <div className="prose prose-invert max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {product.analysisReport.replace(/## 📋 Resumo para Esteira[\s\S]*?(?=\n---|\n## )/, "").replace(/^\s*---\s*\n/, "")}
                    </ReactMarkdown>
                  </div>
                </>
              ) : (
                <div className="text-center py-16">
                  <BarChart3 className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Nenhum relatório de análise disponível.</p>
                  <p className="text-gray-600 text-xs mt-1">Execute uma análise de viabilidade para gerar o relatório.</p>
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === "fornecedores" && (
          <SuppliersSection
            productId={product._id}
            suppliers={product.suppliers || []}
            supplierReport={product.supplierReport || ""}
            onUpdate={handleSuppliersUpdate}
          />
        )}
      </div>
    </div>
  )
}
