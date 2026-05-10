import { useStore } from "@/store/useStore";
import { Monitor, Globe } from "lucide-react";

export function BrowserViewport() {
  const { browserActive, screenshot, browserUrl, browserTitle, serverOnline } = useStore();

  if (!serverOnline) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-gray-500 gap-4">
        <Monitor className="w-16 h-16 text-gray-700" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-400">Servidor Offline</p>
          <p className="text-sm text-gray-600 mt-1">
            Inicie o servidor com:{" "}
            <code className="bg-gray-800 px-2 py-0.5 rounded text-xs text-primary-400">
              cd server && npm run dev
            </code>
          </p>
        </div>
      </div>
    );
  }

  if (!browserActive) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-gray-500 gap-4">
        <Globe className="w-16 h-16 text-gray-700" />
        <div className="text-center">
          <p className="text-lg font-medium text-gray-400">Browser não iniciado</p>
          <p className="text-sm text-gray-600 mt-1">
            Clique em "Iniciar Browser" para começar
          </p>
        </div>
      </div>
    );
  }

  if (!screenshot) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-900 text-gray-500 gap-4">
        <Monitor className="w-12 h-12 text-gray-700 animate-pulse" />
        <p className="text-sm text-gray-500">Navegue para uma página para ver o preview</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-900 overflow-hidden">
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-1 bg-gray-800/50 border-b border-gray-700/50">
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        </div>
        <span className="text-[11px] text-gray-500 truncate flex-1">{browserTitle || browserUrl}</span>
      </div>

      {/* Screenshot */}
      <div className="flex-1 overflow-auto">
        <img
          src={`data:image/png;base64,${screenshot}`}
          alt="Browser screenshot"
          className="w-full"
          draggable={false}
        />
      </div>
    </div>
  );
}
