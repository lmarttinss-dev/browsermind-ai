import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { NavigationBar } from "@/components/NavigationBar";
import { BrowserViewport } from "@/components/BrowserViewport";
import { ChatPanel } from "@/components/ChatPanel";
import { SupplierSearch } from "@/components/SupplierSearch";
import { ActionConsole } from "@/components/ActionConsole";
import { SettingsModal } from "@/components/SettingsModal";

export default function App() {
  const { checkStatus, serverOnline, rightPanelTab, setRightPanelTab, setShowSettings } = useStore();

  // Poll server status
  useEffect(() => {
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100">
      {/* Top bar */}
      <NavigationBar />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Browser viewport + action console */}
        <div className="flex-1 flex flex-col">
          <BrowserViewport />
          <ActionConsole />
        </div>

        {/* Right: Panel with tabs */}
        <div className="w-[420px] min-w-[380px] flex flex-col bg-white border-l border-gray-200">
          {/* Panel header with tabs */}
          <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
            <div className="flex items-center justify-between px-4 py-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">🧠</span>
                <h1 className="text-sm font-bold tracking-tight">BrowserMind AI</h1>
              </div>
              <button
                onClick={() => setShowSettings(true)}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors"
                title="Configurações"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </button>
            </div>
            <div className="flex px-2 pb-1 gap-1">
              <button
                onClick={() => setRightPanelTab("chat")}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                  rightPanelTab === "chat"
                    ? "bg-white text-primary-700"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                💬 Chat
              </button>
              <button
                onClick={() => setRightPanelTab("suppliers")}
                className={`px-3 py-1.5 text-xs font-medium rounded-t-md transition-colors ${
                  rightPanelTab === "suppliers"
                    ? "bg-white text-primary-700"
                    : "text-white/70 hover:text-white hover:bg-white/10"
                }`}
              >
                🏭 Fornecedores
              </button>
            </div>
          </div>

          {/* Panel content */}
          {rightPanelTab === "chat" && <ChatPanel />}
          {rightPanelTab === "suppliers" && <SupplierSearch />}
        </div>
      </div>

      {/* Settings modal */}
      <SettingsModal />

      {/* Server status indicator */}
      <div className="absolute bottom-2 left-2">
        <div className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full ${
          serverOnline
            ? "bg-emerald-900/50 text-emerald-400"
            : "bg-red-900/50 text-red-400"
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${serverOnline ? "bg-emerald-400" : "bg-red-400"} animate-pulse`} />
          {serverOnline ? "Server Online" : "Server Offline"}
        </div>
      </div>
    </div>
  );
}
