import { useAppStore } from "@/store/useAppStore";
import { Clock, ExternalLink, Trash2 } from "lucide-react";
import { MODELS } from "@/types";

export function HistoryPanel() {
  const { history, setPrompt, setResponse, setActiveTab } = useAppStore();

  const handleRestore = (entry: (typeof history)[0]) => {
    setPrompt(entry.prompt);
    setResponse(entry.response);
    setActiveTab("chat");
  };

  const handleClear = async () => {
    await chrome.storage.local.remove("history");
    useAppStore.setState({ history: [] });
  };

  if (history.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-gray-300">
        <Clock className="w-8 h-8" />
        <p className="text-sm text-gray-400">Nenhuma análise ainda</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-xs text-gray-500">{history.length} análises</span>
        <button
          onClick={handleClear}
          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Limpar
        </button>
      </div>
      <div className="divide-y divide-gray-100">
        {history.map((entry) => {
          const modelName = MODELS.find((m) => m.id === entry.model)?.name || entry.model;
          return (
            <button
              key={entry.id}
              onClick={() => handleRestore(entry)}
              className="w-full text-left p-3 hover:bg-gray-50 transition-colors group"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm text-gray-700 line-clamp-2 font-medium">
                  {entry.prompt}
                </p>
                <ExternalLink className="w-3 h-3 text-gray-300 group-hover:text-primary-500 shrink-0 mt-1" />
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-primary-500 font-medium">{modelName}</span>
                <span className="text-xs text-gray-300">•</span>
                <span className="text-xs text-gray-400">
                  {new Date(entry.timestamp).toLocaleString("pt-BR", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1 line-clamp-1 truncate">
                {entry.url}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
