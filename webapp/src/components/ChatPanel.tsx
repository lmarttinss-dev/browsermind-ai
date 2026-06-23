import { useState, useEffect, useRef } from "react"
import { useStore } from "@/store/useStore";
import { api, MODELS, type PipelineProduct } from "@/lib/api";
import { PROMPT_TEMPLATES } from "@/lib/prompt-templates";
import { sanitizeFilename, extractProductSlugFromResponse } from "@/lib/utils";
import { Send, Play, Loader2, ChevronDown, Settings, Trash2, Download, Link2, Check } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidRenderer } from "@/components/MermaidRenderer";

const MARKET_TEMPLATE_ID = "analise-oferta-demanda-concorrencia"

export function ChatPanel() {
  const {
    prompt, setPrompt,
    selectedModel, setSelectedModel,
    response, isLoading, error,
    pendingActions, analyzePage, executeActions,
    history, restoreEntry, clearHistory,
    setShowSettings,
    browserTitle,
  } = useStore();

  const [activeTemplate, setActiveTemplate] = useState("")
  const [pipelineProducts, setPipelineProducts] = useState<PipelineProduct[]>([])
  const [selectedProductId, setSelectedProductId] = useState("")
  const [isSavingReport, setIsSavingReport] = useState(false)
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null)
  const prevLoadingRef = useRef(isLoading)

  // Carrega produtos da esteira quando o template de mercado é selecionado
  useEffect(() => {
    if (activeTemplate === MARKET_TEMPLATE_ID && pipelineProducts.length === 0) {
      api.getPipelineProducts().then((res) => {
        const all = Object.values(res.products).flat() as PipelineProduct[]
        setPipelineProducts(all)
      }).catch(() => {})
    }
  }, [activeTemplate, pipelineProducts.length])

  // Salva relatório no produto após análise concluir
  useEffect(() => {
    const wasLoading = prevLoadingRef.current
    prevLoadingRef.current = isLoading

    if (wasLoading && !isLoading && response && activeTemplate === MARKET_TEMPLATE_ID && selectedProductId) {
      setIsSavingReport(true)
      api.updateMarketReport(selectedProductId, response)
        .then(() => {
          const product = pipelineProducts.find(p => p._id === selectedProductId)
          setSaveSuccess(`Relatório salvo em "${product?.title}"`)
        })
        .catch((err) => {
          console.error("Erro ao salvar relatório de mercado:", err)
        })
        .finally(() => setIsSavingReport(false))
    }
  }, [isLoading, response, activeTemplate, selectedProductId, pipelineProducts])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      setSaveSuccess(null)
      analyzePage(activeTemplate || undefined);
    }
  };

  const applyTemplate = (templateId: string) => {
    if (!templateId) return;
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId);
    if (template) {
      setPrompt(template.content);
      setActiveTemplate(templateId)
      setSelectedProductId("")
      setSaveSuccess(null)
    }
  };

  return (
    <div className="w-[420px] min-w-[380px] flex flex-col bg-white border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-800 text-white">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h1 className="text-sm font-bold tracking-tight">BrowserMind AI</h1>
        </div>
        <button
          onClick={() => setShowSettings(true)}
          className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
          title="Configurações"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Model selector + prompt */}
      <div className="p-3 space-y-2 border-b border-gray-100">
        <div className="relative">
          <select
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value as typeof selectedModel)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            {MODELS.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Template selector */}
        <div className="relative">
          <select
            value=""
            onChange={(e) => applyTemplate(e.target.value)}
            className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer"
          >
            <option value="">Selecionar template de prompt...</option>
            {PROMPT_TEMPLATES.map((t) => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>

        {/* Product selector for market analysis template */}
        {activeTemplate === MARKET_TEMPLATE_ID && (
          <div className="relative">
            <select
              value={selectedProductId}
              onChange={(e) => { setSelectedProductId(e.target.value); setSaveSuccess(null) }}
              className="w-full appearance-none bg-blue-50 border border-blue-200 rounded-lg px-3 py-2 pr-8 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="">Vincular a um produto da esteira (opcional)...</option>
              {pipelineProducts.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.title.replace(/\*+/g, "")} ({p.stage})
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none" />
          </div>
        )}

        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Descreva o que deseja analisar ou fazer nesta página... (Ctrl+Enter para enviar)"
          className="w-full h-24 resize-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
          disabled={isLoading}
        />

        <div className="flex gap-2">
          <button
            onClick={() => { setSaveSuccess(null); analyzePage(activeTemplate || undefined) }}
            disabled={isLoading || !prompt.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Analisar
          </button>
          {pendingActions.length > 0 && (
            <button
              onClick={() => executeActions()}
              disabled={isLoading}
              className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
            >
              <Play className="w-4 h-4" />
              Executar ({pendingActions.length})
            </button>
          )}
        </div>

        {/* Save status indicator */}
        {isSavingReport && (
          <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-600">
            <Loader2 className="w-3 h-3 animate-spin" />
            Salvando relatório no produto...
          </div>
        )}
        {saveSuccess && (
          <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-600">
            <Check className="w-3 h-3" />
            {saveSuccess}
          </div>
        )}
      </div>

      {/* Response */}
      <div className="flex-1 overflow-y-auto">
        {error && (
          <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {isLoading && !response && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm">Analisando página...</p>
          </div>
        )}

        {response && (
          <div className="p-3">
            <div className="flex justify-end mb-2">
              <button
                onClick={() => {
                  const blob = new Blob([response], { type: "text/markdown;charset=utf-8" })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement("a")
                  a.href = url
                  a.download = `${extractProductSlugFromResponse(response) || sanitizeFilename(browserTitle)}.md`
                  a.click()
                  URL.revokeObjectURL(url)
                }}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary-600 transition-colors"
                title="Baixar resposta como .md"
              >
                <Download className="w-3.5 h-3.5" />
                .md
              </button>
            </div>
            <div className="text-sm text-gray-700 leading-relaxed [&_h1]:text-lg [&_h1]:font-bold [&_h1]:text-gray-800 [&_h1]:mt-3 [&_h1]:mb-1 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-gray-800 [&_h2]:mt-2 [&_h2]:mb-1 [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mt-2 [&_h3]:mb-1 [&_p]:mb-2 [&_ul]:list-disc [&_ul]:pl-4 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:pl-4 [&_ol]:mb-2 [&_li]:mb-0.5 [&_a]:text-primary-600 [&_a]:underline [&_code]:bg-gray-100 [&_code]:text-primary-700 [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_pre]:bg-gray-900 [&_pre]:text-gray-100 [&_pre]:p-3 [&_pre]:rounded-lg [&_pre]:overflow-x-auto [&_pre]:my-2 [&_pre_code]:bg-transparent [&_pre_code]:text-gray-100 [&_pre_code]:p-0 [&_blockquote]:border-l-4 [&_blockquote]:border-primary-300 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-500 [&_strong]:font-semibold [&_strong]:text-gray-800">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
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
                {response}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {!response && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-gray-300">
            <span className="text-4xl">🧠</span>
            <p className="text-sm text-gray-400 text-center">
              Navegue para uma página e escreva um prompt para começar
            </p>
          </div>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="border-t border-gray-100">
          <div className="flex items-center justify-between px-3 py-1.5">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Histórico</span>
            <button onClick={clearHistory} className="text-[10px] text-red-400 hover:text-red-600 flex items-center gap-0.5">
              <Trash2 className="w-2.5 h-2.5" /> Limpar
            </button>
          </div>
          <div className="max-h-32 overflow-y-auto divide-y divide-gray-50">
            {history.slice(0, 5).map((entry) => (
              <button
                key={entry.id}
                onClick={() => restoreEntry(entry)}
                className="w-full text-left px-3 py-1.5 hover:bg-gray-50 transition-colors"
              >
                <p className="text-xs text-gray-600 truncate">{entry.prompt}</p>
                <p className="text-[10px] text-gray-400 truncate">{entry.url}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
