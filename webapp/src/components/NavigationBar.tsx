import { useState } from "react";
import { useStore } from "@/store/useStore";
import {
  ArrowLeft,
  ArrowRight,
  RefreshCw,
  Globe,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";

export function NavigationBar() {
  const { browserActive, browserUrl, isLoading, launchBrowser, closeBrowser, navigateTo, takeScreenshot, checkStatus, extensionPaths } = useStore();
  const [urlInput, setUrlInput] = useState("");
  const [editing, setEditing] = useState(false);

  const displayUrl = editing ? urlInput : (browserUrl || "");

  const handleNavigate = () => {
    const url = urlInput.trim();
    if (!url) return;
    const fullUrl = /^https?:\/\//.test(url) ? url : `https://${url}`;
    navigateTo(fullUrl);
    setUrlInput("");
    setEditing(false);
  };

  const handleFocus = () => {
    setEditing(true);
    setUrlInput(browserUrl || "");
  };

  const handleBlur = () => {
    // Small delay to allow click on navigate
    setTimeout(() => setEditing(false), 200);
  };

  const handleGoBack = async () => {
    const { api } = await import("@/lib/api");
    await api.executeAction({ type: "goBack", description: "Voltar" });
    await checkStatus();
    await takeScreenshot();
  };

  const handleGoForward = async () => {
    const { api } = await import("@/lib/api");
    await api.executeAction({ type: "goForward", description: "Avançar" });
    await checkStatus();
    await takeScreenshot();
  };

  return (
    <div className="flex items-center gap-2 bg-gray-800 px-3 py-2 border-b border-gray-700">
      {/* Browser control */}
      {!browserActive ? (
        <button
          onClick={() => launchBrowser(true)}
          disabled={isLoading}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
          Iniciar Browser
        </button>
      ) : (
        <>
          {/* Nav buttons */}
          <button onClick={handleGoBack} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={handleGoForward} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => { takeScreenshot(); checkStatus(); }} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* URL bar */}
          <div className="flex-1 flex items-center bg-gray-700 rounded-md overflow-hidden">
            <Globe className="w-3.5 h-3.5 text-gray-400 ml-2.5 shrink-0" />
            <input
              type="text"
              value={displayUrl}
              onChange={(e) => { setEditing(true); setUrlInput(e.target.value); }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
              placeholder="Digite uma URL e pressione Enter..."
              className="flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-500 px-2 py-1.5 focus:outline-none"
            />
          </div>

          <button
            onClick={closeBrowser}
            className="p-1.5 text-red-400 hover:text-red-300 rounded transition-colors"
            title="Fechar browser"
          >
            <PowerOff className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  );
}
