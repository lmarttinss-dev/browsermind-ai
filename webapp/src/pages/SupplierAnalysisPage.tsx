import { useState, useEffect, useMemo } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { ArrowLeft, Search, Loader2, ExternalLink, Clock, Link2, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { MermaidRenderer } from "@/components/MermaidRenderer"
import { api, MODELS, type PipelineProduct, type ModelId } from "@/lib/api"

type AnalysisResult = {
  report: string
  supplierUrl: string
  analyzedAt: string
}

export const SupplierAnalysisPage = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [url, setUrl] = useState(searchParams.get("url") || "")
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [history, setHistory] = useState<AnalysisResult[]>([])
  const [products, setProducts] = useState<PipelineProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [isLinking, setIsLinking] = useState(false)
  const [linkSuccess, setLinkSuccess] = useState<string | null>(null)

  useEffect(() => {
    api.getPipelineProducts().then((res) => {
      const all = Object.values(res.products).flat()
      setProducts(all)
    }).catch(() => {})
  }, [])

  // Auto-preenche URL e modelo dos parâmetros da rota e já dispara a análise
  useEffect(() => {
    const urlParam = searchParams.get("url")
    const modelParam = searchParams.get("model")

    if (!urlParam || result || isAnalyzing) return

    setUrl(urlParam)

    // Define o modelo antes de analisar, usando o valor do searchParams diretamente
    const model = modelParam && MODELS.some((m) => m.id === modelParam)
      ? (modelParam as ModelId)
      : selectedModel

    setSelectedModel(model)

    if (urlParam.trim()) {
      // Pequeno delay para garantir que o state do modelo atualizou antes da análise
      const timer = setTimeout(() => doAnalyze(urlParam.trim(), model), 50)
      return () => clearTimeout(timer)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const doAnalyze = async (targetUrl: string, model: ModelId) => {
    setIsAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const res = await api.analyzeSupplier(targetUrl, model)
      const analysis: AnalysisResult = {
        report: res.report,
        supplierUrl: res.supplierUrl,
        analyzedAt: res.analyzedAt,
      }
      setResult(analysis)
      setHistory(prev => [analysis, ...prev])
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleAnalyze = async () => {
    await doAnalyze(url.trim(), selectedModel)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isAnalyzing) {
      handleAnalyze()
    }
  }

  const markdownComponents = useMemo(() => ({
    a: ({ href, children }: any) => {
      const isML = /mercadolivre\.com\.br/.test(href || "")
      if (isML) {
        return (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-600/20 text-blue-400 rounded border border-blue-600/30 hover:bg-blue-600/30 text-xs font-medium transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            {children || "Abrir anúncio"}
          </a>
        )
      }
      return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>
    },
    code({ className, children, ...props }: any) {
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
  }), [])

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="border-b border-gray-700/50 bg-gray-800/30 px-5 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/pipeline")}
            className="p-1.5 hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-semibold text-gray-100">Análise de Fornecedor</h1>
            <p className="text-xs text-gray-400">Cole a URL de um fornecedor do Alibaba para análise completa</p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="border-b border-gray-700/50 bg-gray-800/20 px-5 py-4">
        <div className="flex gap-3">
          <div className="flex-1 flex gap-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://www.alibaba.com/supplier/..."
              className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
              disabled={isAnalyzing}
            />
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
              className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
              disabled={isAnalyzing}
            >
              {MODELS.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                Analisar
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="mt-3 px-3 py-2 bg-red-900/30 border border-red-800 rounded-lg text-sm text-red-300">
            {error}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
            <div className="text-center">
              <p className="text-sm text-gray-300">Navegando e analisando o fornecedor...</p>
              <p className="text-xs text-gray-500 mt-1">Isso pode levar alguns segundos</p>
            </div>
          </div>
        )}

        {!isAnalyzing && result && (
          <div className="p-5">
            {/* Resultado Header */}
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-700/50">
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                <span>{new Date(result.analyzedAt).toLocaleString("pt-BR")}</span>
              </div>
              <a
                href={result.supplierUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir no Alibaba
              </a>
            </div>

            {/* Vincular a produto */}
            {products.length > 0 && (
              <div className="mb-5 p-4 bg-gray-800/50 border border-gray-700/50 rounded-lg">
                <h4 className="text-xs font-semibold text-gray-300 mb-2 flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5" />
                  Vincular a produto da esteira
                </h4>
                <div className="flex gap-2">
                  <select
                    value={selectedProductId}
                    onChange={(e) => { setSelectedProductId(e.target.value); setLinkSuccess(null) }}
                    className="flex-1 bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
                    disabled={isLinking}
                  >
                    <option value="">Selecionar produto...</option>
                    {products.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.title} ({p.stage})
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={async () => {
                      if (!selectedProductId || !result) return
                      setIsLinking(true)
                      setLinkSuccess(null)
                      try {
                        await api.linkSupplierToProduct(selectedProductId, result.report, result.supplierUrl.replace(/`/g, ""))
                        const product = products.find(p => p._id === selectedProductId)
                        setLinkSuccess(`Vinculado a "${product?.title}"`);
                      } catch (err) {
                        setError(err instanceof Error ? err.message : String(err))
                      } finally {
                        setIsLinking(false)
                      }
                    }}
                    disabled={!selectedProductId || isLinking}
                    className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded-lg text-sm font-medium transition-colors"
                  >
                    {isLinking ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : linkSuccess ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      <Link2 className="w-3.5 h-3.5" />
                    )}
                    {isLinking ? "Vinculando..." : linkSuccess ? "Vinculado" : "Vincular"}
                  </button>
                </div>
                {linkSuccess && (
                  <p className="mt-2 text-xs text-emerald-400">{linkSuccess}</p>
                )}
              </div>
            )}

            {/* Report Markdown */}
            <div className="prose prose-invert prose-sm max-w-none">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {result.report}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {!isAnalyzing && !result && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-gray-500">
            <Search className="w-10 h-10 opacity-30" />
            <div className="text-center">
              <p className="text-sm">Nenhuma análise realizada</p>
              <p className="text-xs mt-1">Cole a URL de um fornecedor do Alibaba acima para começar</p>
            </div>
          </div>
        )}

        {/* Histórico */}
        {!isAnalyzing && !result && history.length > 0 && (
          <div className="p-5">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Análises anteriores</h3>
            <div className="space-y-2">
              {history.map((item, i) => (
                <button
                  key={i}
                  onClick={() => setResult(item)}
                  className="w-full text-left px-4 py-3 bg-gray-800/50 hover:bg-gray-700/50 border border-gray-700/50 rounded-lg transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-blue-400 truncate max-w-[70%]">{item.supplierUrl}</span>
                    <span className="text-xs text-gray-500">{new Date(item.analyzedAt).toLocaleString("pt-BR")}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
