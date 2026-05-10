import { Send, Play, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";
import { ModelSelector } from "./ModelSelector";

export function PromptInput() {
  const { prompt, setPrompt, isLoading, analyzePage, pendingActions, executeActions } =
    useAppStore();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      analyzePage();
    }
  };

  return (
    <div className="p-3 space-y-2 border-b border-gray-100">
      <ModelSelector />
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
  );
}
