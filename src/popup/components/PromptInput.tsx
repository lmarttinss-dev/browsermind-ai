import { useState, useRef, useEffect } from "react"
import { Send, Play, Loader2, FileText, X } from "lucide-react"
import { useAppStore } from "@/store/useAppStore"
import { ModelSelector } from "./ModelSelector"
import { PROMPT_TEMPLATES } from "@/constants/prompt-templates"

export function PromptInput() {
  const { prompt, setPrompt, isLoading, analyzePage, pendingActions, executeActions } =
    useAppStore()
  const [showTemplates, setShowTemplates] = useState(false)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      analyzePage()
    }
  }

  const applyTemplate = (templateId: string) => {
    const template = PROMPT_TEMPLATES.find((t) => t.id === templateId)
    if (template) {
      setPrompt(template.content)
      setShowTemplates(false)
    }
  }

  return (
    <div className="p-3 space-y-2 border-b border-gray-100">
      <ModelSelector />

      {/* Template selector toggle */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowTemplates(!showTemplates)}
          className={`flex items-center gap-1.5 text-xs border rounded-lg px-2.5 py-1.5 transition-colors ${
            showTemplates
              ? "text-primary-700 bg-primary-50 border-primary-300"
              : "text-gray-500 hover:text-primary-600 border-gray-200 hover:border-primary-300 hover:bg-gray-50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Templates</span>
        </button>
      </div>

      {/* Template list */}
      {showTemplates && (
        <div className="border border-gray-200 rounded-lg bg-gray-50 p-2 space-y-1">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Selecione um template</span>
            <button
              type="button"
              onClick={() => setShowTemplates(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-3 h-3" />
            </button>
          </div>
          {PROMPT_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              onClick={() => applyTemplate(template.id)}
              className="w-full text-left px-3 py-2 bg-white border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors"
            >
              <span className="text-xs font-medium text-gray-700 block">{template.name}</span>
              <span className="text-[10px] text-gray-400 block mt-0.5">{template.description}</span>
            </button>
          ))}
        </div>
      )}

      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Descreva o que deseja analisar ou fazer nesta página..."
        className="w-full h-24 resize-none bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        disabled={isLoading}
      />
      <div className="flex gap-2">
        <button
          onClick={analyzePage}
          disabled={isLoading || !prompt.trim()}
          className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          Analisar Página
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
    </div>
  )
}
