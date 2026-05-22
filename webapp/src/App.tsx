import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { useStore } from "@/store/useStore";
import { NavigationBar } from "@/components/NavigationBar";
import { BrowserViewport } from "@/components/BrowserViewport";
import { ChatPanel } from "@/components/ChatPanel";
import { ActionConsole } from "@/components/ActionConsole";
import { SettingsModal } from "@/components/SettingsModal";
import { PipelinePage } from "@/pages/PipelinePage";
import { ProductDetailPage } from "@/pages/ProductDetailPage";

function MainView() {
  return (
    <>
      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Browser viewport + action console */}
        <div className="flex-1 flex flex-col">
          <BrowserViewport />
          <ActionConsole />
        </div>

        {/* Right: Chat panel */}
        <ChatPanel />
      </div>

      {/* Settings modal */}
      <SettingsModal />
    </>
  );
}

export default function App() {
  const { checkStatus, serverOnline } = useStore();

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

      <Routes>
        <Route path="/" element={<MainView />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/pipeline/:id" element={<ProductDetailPage />} />
      </Routes>

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
