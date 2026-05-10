import { useEffect, useState } from "react";
import { useAppStore } from "@/store/useAppStore";
import {
  Globe,
  Power,
  PowerOff,
  Camera,
  ExternalLink,
  Loader2,
  ServerOff,
  Monitor,
} from "lucide-react";

export function PlaywrightPanel() {
  const {
    playwrightStatus,
    isLoading,
    checkPlaywrightStatus,
    launchPlaywright,
    closePlaywright,
    navigatePlaywright,
    screenshotPlaywright,
  } = useAppStore();

  const [navUrl, setNavUrl] = useState("");
  const [screenshot, setScreenshot] = useState<string | null>(null);

  useEffect(() => {
    checkPlaywrightStatus();
    const interval = setInterval(checkPlaywrightStatus, 5000);
    return () => clearInterval(interval);
  }, [checkPlaywrightStatus]);

  const handleNavigate = async () => {
    if (!navUrl.trim()) return;
    let url = navUrl.trim();
    if (!/^https?:\/\//.test(url)) url = `https://${url}`;
    await navigatePlaywright(url);
    setNavUrl("");
  };

  const handleScreenshot = async () => {
    const img = await screenshotPlaywright();
    setScreenshot(img);
  };

  if (!playwrightStatus.serverOnline) {
    return (
      <div className="p-3 mx-3 my-2 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-center gap-2 text-amber-700">
          <ServerOff className="w-4 h-4" />
          <span className="text-xs font-semibold">Servidor Playwright offline</span>
        </div>
        <p className="text-xs text-amber-600 mt-1">
          Inicie o servidor:{" "}
          <code className="bg-amber-100 px-1 py-0.5 rounded text-[10px]">
            cd server && npm run dev
          </code>
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 mx-3 my-2 bg-gray-50 border border-gray-200 rounded-lg space-y-2">
      {/* Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Monitor className="w-4 h-4 text-primary-500" />
          <span className="text-xs font-semibold text-gray-700">Playwright Browser</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              playwrightStatus.active ? "bg-emerald-400" : "bg-gray-300"
            }`}
          />
          <span className="text-[10px] text-gray-500">
            {playwrightStatus.active ? "Ativo" : "Inativo"}
          </span>
        </div>
      </div>

      {/* Current URL */}
      {playwrightStatus.active && playwrightStatus.url && (
        <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
          <Globe className="w-3 h-3 shrink-0" />
          <span className="truncate">{playwrightStatus.url}</span>
        </div>
      )}

      {/* Controls */}
      <div className="flex gap-1.5">
        {!playwrightStatus.active ? (
          <button
            onClick={() => launchPlaywright(false)}
            disabled={isLoading}
            className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors"
          >
            {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Power className="w-3 h-3" />}
            Iniciar
          </button>
        ) : (
          <button
            onClick={closePlaywright}
            className="flex items-center justify-center gap-1.5 bg-red-500 hover:bg-red-600 text-white text-xs font-medium py-1.5 px-3 rounded-md transition-colors"
          >
            <PowerOff className="w-3 h-3" />
            Fechar
          </button>
        )}

        {playwrightStatus.active && (
          <button
            onClick={handleScreenshot}
            className="flex items-center justify-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs font-medium py-1.5 px-3 rounded-md transition-colors"
          >
            <Camera className="w-3 h-3" />
            Screenshot
          </button>
        )}
      </div>

      {/* Navigate */}
      {playwrightStatus.active && (
        <div className="flex gap-1.5">
          <input
            type="text"
            value={navUrl}
            onChange={(e) => setNavUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
            placeholder="URL para navegar..."
            className="flex-1 bg-white border border-gray-200 rounded-md px-2 py-1.5 text-xs text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <button
            onClick={handleNavigate}
            disabled={isLoading || !navUrl.trim()}
            className="flex items-center justify-center gap-1 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 text-white text-xs font-medium py-1.5 px-2.5 rounded-md transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Screenshot preview */}
      {screenshot && (
        <div className="relative">
          <img
            src={`data:image/png;base64,${screenshot}`}
            alt="Screenshot"
            className="w-full rounded-md border border-gray-200"
          />
          <button
            onClick={() => setScreenshot(null)}
            className="absolute top-1 right-1 bg-black/50 text-white text-[10px] px-1.5 py-0.5 rounded"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
