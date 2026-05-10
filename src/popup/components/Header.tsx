import { Brain } from "lucide-react";
import { useAppStore } from "@/store/useAppStore";

const tabs = [
  { id: "chat" as const, label: "Chat" },
  { id: "history" as const, label: "Histórico" },
  { id: "actions" as const, label: "Ações" },
  { id: "settings" as const, label: "Config" },
];

export function Header() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <div className="bg-gradient-to-r from-primary-600 to-primary-800 text-white">
      <div className="flex items-center gap-2 px-4 pt-3 pb-2">
        <Brain className="w-6 h-6" />
        <h1 className="text-lg font-bold tracking-tight">BrowserMind AI</h1>
      </div>
      <div className="flex gap-1 px-3 pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 text-xs font-medium rounded-t-lg transition-colors ${
              activeTab === tab.id
                ? "bg-white text-primary-700"
                : "text-white/70 hover:text-white hover:bg-white/10"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  );
}
