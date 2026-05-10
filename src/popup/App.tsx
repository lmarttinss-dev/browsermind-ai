import { useEffect } from "react";
import { useAppStore } from "@/store/useAppStore";
import { Header } from "./components/Header";
import { PromptInput } from "./components/PromptInput";
import { ResponseArea } from "./components/ResponseArea";
import { HistoryPanel } from "./components/HistoryPanel";
import { ActionConsole } from "./components/ActionConsole";
import { SettingsPanel } from "./components/SettingsPanel";
import { PlaywrightPanel } from "./components/PlaywrightPanel";

export default function App() {
  const { activeTab, loadHistory, loadApiKeys, checkPlaywrightStatus } = useAppStore();

  useEffect(() => {
    loadHistory();
    loadApiKeys();
    checkPlaywrightStatus();
  }, [loadHistory, loadApiKeys, checkPlaywrightStatus]);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header />

      {activeTab === "chat" && (
        <div className="flex flex-col flex-1 min-h-0">
          <PlaywrightPanel />
          <PromptInput />
          <ResponseArea />
        </div>
      )}

      {activeTab === "history" && <HistoryPanel />}

      {activeTab === "actions" && (
        <div className="flex flex-col flex-1 min-h-0">
          <PlaywrightPanel />
          <ActionConsole />
        </div>
      )}

      {activeTab === "settings" && <SettingsPanel />}
    </div>
  );
}
