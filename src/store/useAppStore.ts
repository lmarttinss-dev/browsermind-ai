import { create } from "zustand";
import type { ModelId, AnalysisEntry, ActionLog, BrowserAction, PlaywrightStatus } from "@/types";

interface ApiKeys {
  google: string;
  openai: string;
  anthropic: string;
  deepseek: string;
}

interface AppState {
  // UI State
  prompt: string;
  selectedModel: ModelId;
  response: string;
  isLoading: boolean;
  error: string | null;
  activeTab: "chat" | "history" | "actions" | "settings";

  // Playwright State
  playwrightStatus: PlaywrightStatus & { serverOnline: boolean };

  // Data
  history: AnalysisEntry[];
  actionLogs: ActionLog[];
  pendingActions: BrowserAction[];
  apiKeys: ApiKeys;

  // Actions
  setPrompt: (prompt: string) => void;
  setSelectedModel: (model: ModelId) => void;
  setResponse: (response: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setActiveTab: (tab: "chat" | "history" | "actions" | "settings") => void;
  setHistory: (history: AnalysisEntry[]) => void;
  addActionLog: (log: ActionLog) => void;
  clearActionLogs: () => void;
  setPendingActions: (actions: BrowserAction[]) => void;
  setApiKey: (provider: keyof ApiKeys, key: string) => void;
  setApiKeys: (keys: ApiKeys) => void;

  // Async actions
  analyzePage: () => Promise<void>;
  executeActions: (actions?: BrowserAction[]) => Promise<void>;
  loadHistory: () => Promise<void>;
  loadApiKeys: () => Promise<void>;
  saveApiKeys: () => Promise<void>;

  // Playwright actions
  checkPlaywrightStatus: () => Promise<void>;
  launchPlaywright: (headless?: boolean) => Promise<void>;
  closePlaywright: () => Promise<void>;
  navigatePlaywright: (url: string) => Promise<void>;
  screenshotPlaywright: () => Promise<string | null>;
}

export const useAppStore = create<AppState>((set, get) => ({
  prompt: "",
  selectedModel: "gemini-flash-2.5",
  response: "",
  isLoading: false,
  error: null,
  activeTab: "chat",
  playwrightStatus: { serverOnline: false, active: false, url: null, title: null },
  history: [],
  actionLogs: [],
  pendingActions: [],
  apiKeys: {
    google: "",
    openai: "",
    anthropic: "",
    deepseek: "",
  },

  setPrompt: (prompt) => set({ prompt }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setResponse: (response) => set({ response }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setHistory: (history) => set({ history }),
  addActionLog: (log) =>
    set((state) => ({ actionLogs: [...state.actionLogs, log] })),
  clearActionLogs: () => set({ actionLogs: [] }),
  setPendingActions: (pendingActions) => set({ pendingActions }),
  setApiKey: (provider, key) =>
    set((state) => ({ apiKeys: { ...state.apiKeys, [provider]: key } })),
  setApiKeys: (apiKeys) => set({ apiKeys }),

  analyzePage: async () => {
    const { prompt, selectedModel, apiKeys } = get();
    if (!prompt.trim()) {
      set({ error: "Digite um prompt para analisar a página" });
      return;
    }

    set({ isLoading: true, error: null, response: "", pendingActions: [] });

    try {
      const result = await chrome.runtime.sendMessage({
        type: "ANALYZE",
        prompt,
        model: selectedModel,
        apiKeys,
      });

      if (result.success) {
        set({ response: result.response });

        if (result.actions) {
          set({ pendingActions: result.actions });
        }

        if (result.entry) {
          set((state) => ({
            history: [result.entry, ...state.history].slice(0, 50),
          }));
        }
      } else {
        set({ error: result.error || "Erro ao analisar a página" });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erro desconhecido",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  executeActions: async (actions) => {
    const actionsToExecute = actions || get().pendingActions;
    if (actionsToExecute.length === 0) return;

    set({ isLoading: true, error: null });

    // Add pending logs
    const logs: ActionLog[] = actionsToExecute.map((action) => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: action.description,
      selector: action.selector,
      status: "pending" as const,
    }));

    logs.forEach((log) => get().addActionLog(log));

    try {
      const result = await chrome.runtime.sendMessage({
        type: "EXECUTE",
        actions: actionsToExecute,
      });

      if (result.success && Array.isArray(result.results)) {
        // Update logs with results
        set((state) => {
          const updatedLogs = [...state.actionLogs];
          result.results.forEach(
            (
              r: { success: boolean; detail?: string },
              i: number
            ) => {
              const logIndex = updatedLogs.length - logs.length + i;
              if (updatedLogs[logIndex]) {
                updatedLogs[logIndex] = {
                  ...updatedLogs[logIndex],
                  status: r.success ? "success" : "error",
                  detail: r.detail,
                };
              }
            }
          );
          return { actionLogs: updatedLogs, pendingActions: [] };
        });
      } else {
        set({ error: result.error || "Erro ao executar ações" });
      }
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Erro ao executar ações",
      });
    } finally {
      set({ isLoading: false });
    }
  },

  loadHistory: async () => {
    try {
      const storage = await chrome.storage.local.get("history");
      set({ history: storage.history || [] });
    } catch {
      // ignore
    }
  },

  loadApiKeys: async () => {
    try {
      const storage = await chrome.storage.local.get("apiKeys");
      if (storage.apiKeys) {
        set({ apiKeys: storage.apiKeys });
      }
    } catch {
      // ignore
    }
  },

  saveApiKeys: async () => {
    try {
      await chrome.storage.local.set({ apiKeys: get().apiKeys });
    } catch {
      // ignore
    }
  },

  checkPlaywrightStatus: async () => {
    try {
      const result = await chrome.runtime.sendMessage({ type: "PLAYWRIGHT_STATUS" });
      if (result.success) {
        set({
          playwrightStatus: {
            serverOnline: result.serverOnline,
            active: result.active,
            url: result.url,
            title: result.title,
          },
        });
      }
    } catch {
      set({ playwrightStatus: { serverOnline: false, active: false, url: null, title: null } });
    }
  },

  launchPlaywright: async (headless = false) => {
    set({ isLoading: true, error: null });
    try {
      await chrome.runtime.sendMessage({ type: "PLAYWRIGHT_LAUNCH", headless });
      await get().checkPlaywrightStatus();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro ao iniciar Playwright" });
    } finally {
      set({ isLoading: false });
    }
  },

  closePlaywright: async () => {
    try {
      await chrome.runtime.sendMessage({ type: "PLAYWRIGHT_CLOSE" });
      set({ playwrightStatus: { serverOnline: true, active: false, url: null, title: null } });
    } catch {
      // ignore
    }
  },

  navigatePlaywright: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      await chrome.runtime.sendMessage({ type: "PLAYWRIGHT_NAVIGATE", url });
      await get().checkPlaywrightStatus();
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro ao navegar" });
    } finally {
      set({ isLoading: false });
    }
  },

  screenshotPlaywright: async () => {
    try {
      const result = await chrome.runtime.sendMessage({ type: "PLAYWRIGHT_SCREENSHOT" });
      if (result.success) return result.screenshot as string;
      return null;
    } catch {
      return null;
    }
  },
}));
