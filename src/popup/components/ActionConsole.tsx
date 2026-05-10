import { useAppStore } from "@/store/useAppStore";
import { Terminal, CheckCircle2, XCircle, Clock, Trash2 } from "lucide-react";

export function ActionConsole() {
  const { actionLogs, clearActionLogs } = useAppStore();

  if (actionLogs.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-6 text-gray-300">
        <Terminal className="w-8 h-8" />
        <p className="text-sm text-gray-400">Nenhuma ação executada</p>
        <p className="text-xs text-gray-300">
          As ações do agente aparecerão aqui
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-100">
        <span className="text-xs text-gray-500">{actionLogs.length} ações</span>
        <button
          onClick={clearActionLogs}
          className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 transition-colors"
        >
          <Trash2 className="w-3 h-3" />
          Limpar
        </button>
      </div>
      <div className="p-2 space-y-1.5">
        {actionLogs.map((log) => {
          const StatusIcon =
            log.status === "success"
              ? CheckCircle2
              : log.status === "error"
                ? XCircle
                : Clock;
          const statusColor =
            log.status === "success"
              ? "text-emerald-500"
              : log.status === "error"
                ? "text-red-500"
                : "text-amber-500";

          return (
            <div
              key={log.id}
              className="flex items-start gap-2 p-2 bg-gray-50 rounded-lg text-xs"
            >
              <StatusIcon className={`w-4 h-4 shrink-0 mt-0.5 ${statusColor}`} />
              <div className="min-w-0 flex-1">
                <p className="text-gray-700 font-medium">{log.action}</p>
                {log.selector && (
                  <p className="text-gray-400 font-mono truncate mt-0.5">
                    {log.selector}
                  </p>
                )}
                {log.detail && (
                  <p className={`mt-0.5 ${log.status === "error" ? "text-red-500" : "text-gray-500"}`}>
                    {log.detail}
                  </p>
                )}
              </div>
              <span className="text-gray-300 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
