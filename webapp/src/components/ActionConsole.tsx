import { useStore } from "@/store/useStore";
import { Terminal, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";

export function ActionConsole() {
  const { actionLogs, clearActionLogs } = useStore();

  if (actionLogs.length === 0) return null;

  return (
    <div className="border-t border-gray-700 bg-gray-900 max-h-48 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-1.5 sticky top-0 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center gap-1.5 text-gray-400">
          <Terminal className="w-3.5 h-3.5" />
          <span className="text-[10px] font-medium uppercase tracking-wider">Ações ({actionLogs.length})</span>
        </div>
        <button
          onClick={clearActionLogs}
          className="text-[10px] text-red-400 hover:text-red-300 flex items-center gap-0.5"
        >
          <Trash2 className="w-2.5 h-2.5" /> Limpar
        </button>
      </div>
      <div className="p-2 space-y-1">
        {actionLogs.map((log) => {
          const Icon = log.status === "success" ? CheckCircle2 : log.status === "error" ? XCircle : Clock;
          const color = log.status === "success" ? "text-emerald-400" : log.status === "error" ? "text-red-400" : "text-amber-400";
          return (
            <div key={log.id} className="flex items-start gap-2 text-xs px-1">
              <Icon className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${color}`} />
              <div className="min-w-0 flex-1">
                <span className="text-gray-300">{log.action}</span>
                {log.selector && <span className="text-gray-600 ml-1 font-mono text-[10px]">{log.selector}</span>}
                {log.detail && (
                  <span className={`ml-1 ${log.status === "error" ? "text-red-400" : "text-gray-500"}`}> — {log.detail}</span>
                )}
              </div>
              <span className="text-gray-700 text-[10px] shrink-0">
                {new Date(log.timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
