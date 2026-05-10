import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useAppStore } from "@/store/useAppStore";
import { AlertCircle, Loader2, Sparkles } from "lucide-react";

export function ResponseArea() {
  const { response, isLoading, error } = useAppStore();

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-gray-400">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
        <p className="text-sm">Analisando página...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
        <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
        <p className="text-sm text-red-700">{error}</p>
      </div>
    );
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 p-6 text-gray-300">
        <Sparkles className="w-10 h-10" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-400">BrowserMind AI</p>
          <p className="text-xs text-gray-300 mt-1">
            Escreva um prompt e analise a página atual
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-3">
      <div className="prose prose-sm prose-gray max-w-none prose-headings:text-gray-800 prose-p:text-gray-600 prose-a:text-primary-600 prose-code:text-primary-700 prose-code:bg-primary-50 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-td:border prose-td:border-gray-200 prose-td:px-2 prose-td:py-1 prose-th:border prose-th:border-gray-300 prose-th:px-2 prose-th:py-1 prose-th:bg-gray-50">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{response}</ReactMarkdown>
      </div>
    </div>
  );
}
