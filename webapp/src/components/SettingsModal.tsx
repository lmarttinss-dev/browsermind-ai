import { useState, useEffect } from "react";
import { useStore } from "@/store/useStore";
import { MODELS, type ModelId } from "@/lib/api";
import { X, Key, CheckCircle, AlertCircle, Loader2, Puzzle, Plus, Trash2, ShieldCheck, LogIn } from "lucide-react";

// Map model IDs to their provider key names
const MODEL_KEY_MAP: Record<string, string> = {
  "gemini-flash": "gemini",
  "gemini-pro": "gemini",
  "gpt-4.1": "openai",
  "claude-sonnet": "anthropic",
  "deepseek-chat": "deepseek",
};

const KEY_LABELS: Record<string, string> = {
  gemini: "Google Gemini",
  openai: "OpenAI",
  anthropic: "Anthropic (Claude)",
  deepseek: "DeepSeek",
};

export function SettingsModal() {
  const { showSettings, setShowSettings, saveApiKeys, loadConfiguredKeys, configuredKeys, extensionPaths, setExtensionPaths, userDataDir, setUserDataDir, avantproEmail, setAvantproEmail, avantproAuthenticated, avantproPlan, avantproLoading, authenticateAvantpro, checkAvantproStatus, browserActive } = useStore();
  const [keys, setKeys] = useState<Record<string, string>>({
    gemini: "",
    openai: "",
    anthropic: "",
    deepseek: "",
  });
  const [newExtPath, setNewExtPath] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (showSettings) {
      loadConfiguredKeys();
      if (browserActive) checkAvantproStatus();
    }
  }, [showSettings, loadConfiguredKeys, browserActive, checkAvantproStatus]);

  if (!showSettings) return null;

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    // Only send non-empty keys
    const filtered: Record<string, string> = {};
    for (const [k, v] of Object.entries(keys)) {
      if (v.trim()) filtered[k] = v.trim();
    }
    if (Object.keys(filtered).length > 0) {
      await saveApiKeys(filtered);
    }
    setSaving(false);
    setSaved(true);
    setKeys({ gemini: "", openai: "", anthropic: "", deepseek: "" });
    setTimeout(() => setSaved(false), 2000);
  };

  const uniqueProviders = Array.from(new Set(Object.values(MODEL_KEY_MAP)));

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center" onClick={() => setShowSettings(false)}>
      <div className="bg-white rounded-xl shadow-2xl w-[480px] max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-600" />
            <h2 className="font-semibold text-gray-800">Configurações de API</h2>
          </div>
          <button onClick={() => setShowSettings(false)} className="p-1 hover:bg-gray-100 rounded-md transition-colors">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <p className="text-sm text-gray-500">
            As chaves são armazenadas apenas na memória do servidor. Configure pelo menos uma chave para usar a análise de IA.
          </p>

          {/* Current status */}
          {configuredKeys.length > 0 && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <p className="text-xs font-medium text-emerald-700 mb-1">Chaves configuradas:</p>
              <div className="flex flex-wrap gap-1.5">
                {configuredKeys.map((k) => (
                  <span key={k} className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs px-2 py-0.5 rounded-full">
                    <CheckCircle className="w-3 h-3" /> {KEY_LABELS[k] || k}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key inputs */}
          <div className="space-y-3">
            {uniqueProviders.map((provider) => {
              const isConfigured = configuredKeys.includes(provider);
              return (
                <div key={provider}>
                  <label className="flex items-center gap-1.5 text-sm font-medium text-gray-700 mb-1">
                    {KEY_LABELS[provider]}
                    {isConfigured && <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />}
                  </label>
                  <input
                    type="password"
                    value={keys[provider]}
                    onChange={(e) => setKeys({ ...keys, [provider]: e.target.value })}
                    placeholder={isConfigured ? "••••••• (já configurada)" : "Cole sua API key aqui..."}
                    className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Modelos: {MODELS.filter(m => MODEL_KEY_MAP[m.id] === provider).map(m => m.name).join(", ")}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Chrome Extensions */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <Puzzle className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-semibold text-gray-700">Extensões do Chrome</h3>
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Adicione caminhos de extensões para carregar no browser Playwright. Requer modo headed.
              <br />
              <span className="text-gray-500">Ex: /mnt/c/Users/.../Extensions/&lt;id&gt;/&lt;version&gt;</span>
            </p>

            {extensionPaths.length > 0 && (
              <div className="space-y-1.5 mb-2">
                {extensionPaths.map((p, i) => (
                  <div key={i} className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5">
                    <Puzzle className="w-3.5 h-3.5 text-primary-500 shrink-0" />
                    <span className="flex-1 text-xs text-gray-600 font-mono truncate">{p}</span>
                    <button
                      onClick={() => setExtensionPaths(extensionPaths.filter((_, idx) => idx !== i))}
                      className="p-0.5 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <input
                type="text"
                value={newExtPath}
                onChange={(e) => setNewExtPath(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && newExtPath.trim()) {
                    setExtensionPaths([...extensionPaths, newExtPath.trim()]);
                    setNewExtPath("");
                  }
                }}
                placeholder="Caminho da extensão descompactada..."
                className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
              <button
                onClick={() => {
                  if (newExtPath.trim()) {
                    setExtensionPaths([...extensionPaths, newExtPath.trim()]);
                    setNewExtPath("");
                  }
                }}
                disabled={!newExtPath.trim()}
                className="flex items-center gap-1 bg-primary-100 hover:bg-primary-200 disabled:bg-gray-100 disabled:text-gray-400 text-primary-700 text-sm font-medium px-3 py-2 rounded-lg transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {extensionPaths.length > 0 && (
              <p className="text-[10px] text-amber-600 mt-1.5">
                ⚠ Extensões forçam modo headed. Feche e reinicie o browser para aplicar.
              </p>
            )}

            {/* User Data Dir */}
            <div className="mt-3">
              <label className="text-xs font-medium text-gray-600 mb-1 block">
                Perfil do Chrome (opcional)
              </label>
              <input
                type="text"
                value={userDataDir}
                onChange={(e) => setUserDataDir(e.target.value)}
                placeholder="/tmp/browsermind-profile"
                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
              />
              <p className="text-[10px] text-gray-400 mt-0.5">
                Para manter login das extensões, aponte para um perfil persistente. Deixe vazio para usar o padrão.
              </p>
            </div>
          </div>

          {/* AvantPro Authentication */}
          <div className="border-t border-gray-100 pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-semibold text-gray-700">AvantPro ML</h3>
              {avantproAuthenticated && (
                <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-medium">
                  {avantproPlan || "Autenticado"}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-400 mb-3">
              Autentique com seu email do AvantPro para acessar métricas de produtos do Mercado Livre.
            </p>

            {avantproAuthenticated ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-emerald-800">{avantproEmail}</p>
                  <p className="text-[10px] text-emerald-600">Plano: {avantproPlan} — Token injetado na extensão</p>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={avantproEmail}
                  onChange={(e) => setAvantproEmail(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && authenticateAvantpro()}
                  placeholder="seu@email.com"
                  className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={authenticateAvantpro}
                  disabled={avantproLoading || !avantproEmail.trim() || !browserActive}
                  className="flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  {avantproLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  Autenticar
                </button>
              </div>
            )}
            {!browserActive && !avantproAuthenticated && (
              <p className="text-[10px] text-amber-600 mt-1.5">
                ⚠ Inicie o browser com a extensão AvantPro carregada primeiro.
              </p>
            )}
          </div>

          {/* Save */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving || Object.values(keys).every(v => !v.trim())}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Key className="w-4 h-4" />}
              Salvar Chaves
            </button>
            {saved && (
              <span className="text-sm text-emerald-600 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" /> Salvo!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
