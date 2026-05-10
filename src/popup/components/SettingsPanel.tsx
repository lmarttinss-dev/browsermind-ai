import { useAppStore } from "@/store/useAppStore";
import { Key, Save } from "lucide-react";
import { useState } from "react";

const providers = [
  { key: "google" as const, label: "Google (Gemini)", placeholder: "AIza..." },
  { key: "openai" as const, label: "OpenAI (GPT)", placeholder: "sk-..." },
  { key: "anthropic" as const, label: "Anthropic (Claude)", placeholder: "sk-ant-..." },
  { key: "deepseek" as const, label: "DeepSeek", placeholder: "sk-..." },
];

export function SettingsPanel() {
  const { apiKeys, setApiKey, saveApiKeys } = useAppStore();
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    await saveApiKeys();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-4">
      <div className="flex items-center gap-2 text-gray-600">
        <Key className="w-4 h-4" />
        <h2 className="text-sm font-semibold">Chaves de API</h2>
      </div>

      <div className="space-y-3">
        {providers.map((provider) => (
          <div key={provider.key}>
            <label className="text-xs font-medium text-gray-500 block mb-1">
              {provider.label}
            </label>
            <input
              type="password"
              value={apiKeys[provider.key]}
              onChange={(e) => setApiKey(provider.key, e.target.value)}
              placeholder={provider.placeholder}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        ))}
      </div>

      <button
        onClick={handleSave}
        className={`w-full flex items-center justify-center gap-2 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
          saved
            ? "bg-emerald-100 text-emerald-700"
            : "bg-primary-600 hover:bg-primary-700 text-white"
        }`}
      >
        <Save className="w-4 h-4" />
        {saved ? "Salvo!" : "Salvar Chaves"}
      </button>

      <p className="text-xs text-gray-400 leading-relaxed">
        As chaves são armazenadas localmente no seu navegador e nunca são
        compartilhadas. Cada provedor requer sua própria chave de API.
      </p>
    </div>
  );
}
