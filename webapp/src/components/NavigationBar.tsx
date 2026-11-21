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
  const { browserActive, browserUrl, isLoading, launchBrowser, closeBrowser, navigateTo, takeScreenshot, checkStatus, serverOnline, error } = useStore();
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
    <>
    <div className="browser-toolbar">
      {/* Browser control */}
      {!browserActive ? (
        <button
          onClick={() => launchBrowser(true)}
          disabled={isLoading || !serverOnline}
          className="browser-start"
        >
          {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Power className="w-3.5 h-3.5" />}
          {isLoading ? "Iniciando..." : "Iniciar navegador"}
        </button>
      ) : (
        <>
          {/* Nav buttons */}
          <button aria-label="Voltar" title="Voltar" onClick={handleGoBack} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button aria-label="Avançar" title="Avançar" onClick={handleGoForward} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button aria-label="Atualizar prévia" title="Atualizar prévia" onClick={() => { takeScreenshot(); checkStatus(); }} className="p-1.5 text-gray-400 hover:text-white rounded transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* URL bar */}
          <div className="browser-address">
            <Globe className="w-3.5 h-3.5 text-gray-400 ml-2.5 shrink-0" />
            <input
              aria-label="Endereço da página" type="text"
              value={displayUrl}
              onChange={(e) => { setEditing(true); setUrlInput(e.target.value); }}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
              placeholder="Digite o endereço de um site..."
              className="min-w-0 flex-1 bg-transparent text-sm text-gray-200 placeholder:text-gray-500 px-2 py-1.5 focus:outline-none"
            />
            <button aria-label="Abrir endereço" title="Abrir endereço" onMouseDown={e => e.preventDefault()} onClick={handleNavigate}><ArrowRight size={16}/></button>
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

      {!browserActive && <span className="toolbar-hint"><Globe size={14}/> Sua próxima descoberta começa com uma página</span>}
    </div>
    {error && <p role="alert" className="rounded-lg border border-red-800 bg-red-950/40 px-4 py-3 text-xs text-red-300">{error}</p>}
    </>
  );
}
