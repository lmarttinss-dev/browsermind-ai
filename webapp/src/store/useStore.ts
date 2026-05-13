import { create } from "zustand";
import { api, type BrowserAction, type ModelId, type ActionResult } from "@/lib/api";

export interface ActionLog {
  id: string;
  timestamp: number;
  action: string;
  selector?: string;
  status: "pending" | "success" | "error";
  detail?: string;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  prompt: string;
  model: ModelId;
  url: string;
  response: string;
}

interface AppState {
  // UI
  prompt: string;
  selectedModel: ModelId;
  response: string;
  isLoading: boolean;
  error: string | null;
  showSettings: boolean;

  // Browser
  serverOnline: boolean;
  browserActive: boolean;
  browserUrl: string | null;
  browserTitle: string | null;
  screenshot: string | null;
  autoRefreshScreenshot: boolean;
  extensionPaths: string[];
  userDataDir: string;

  // Data
  history: HistoryEntry[];
  actionLogs: ActionLog[];
  pendingActions: BrowserAction[];
  configuredKeys: string[];

  // Calculator
  showCalculator: boolean;
  setShowCalculator: (show: boolean) => void;

  // AvantPro
  avantproEmail: string;
  avantproPlan: string | null;
  avantproAuthenticated: boolean;
  avantproLoading: boolean;

  // Setters
  setPrompt: (prompt: string) => void;
  setSelectedModel: (model: ModelId) => void;
  setShowSettings: (show: boolean) => void;
  setAutoRefreshScreenshot: (v: boolean) => void;
  setExtensionPaths: (paths: string[]) => void;
  setUserDataDir: (dir: string) => void;

  // Async
  checkStatus: () => Promise<void>;
  launchBrowser: (headless?: boolean) => Promise<void>;
  closeBrowser: () => Promise<void>;
  navigateTo: (url: string) => Promise<void>;
  takeScreenshot: () => Promise<void>;
  analyzePage: () => Promise<void>;
  executeActions: (actions?: BrowserAction[]) => Promise<void>;
  saveApiKeys: (keys: Record<string, string>) => Promise<void>;
  loadConfiguredKeys: () => Promise<void>;
  clearHistory: () => void;
  clearActionLogs: () => void;
  restoreEntry: (entry: HistoryEntry) => void;
  setAvantproEmail: (email: string) => void;
  authenticateAvantpro: () => Promise<void>;
  checkAvantproStatus: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  prompt: "",
  selectedModel: "gemini-flash-2.5",
  response: "",
  isLoading: false,
  error: null,
  showSettings: false,

  serverOnline: false,
  browserActive: false,
  browserUrl: null,
  browserTitle: null,
  screenshot: null,
  autoRefreshScreenshot: true,
  extensionPaths: ["/mnt/c/Users/Leandro Martins/AppData/Local/Google/Chrome/User Data/Default/Extensions/jdefnfmbnchmnjkcknaadaddgjbgephh/7.0.3_0"],
  userDataDir: "~/.browsermind-profile",

  history: [],
  actionLogs: [],
  pendingActions: [],
  configuredKeys: [],

  showCalculator: false,

  avantproEmail: "",
  avantproPlan: null,
  avantproAuthenticated: false,
  avantproLoading: false,

  setPrompt: (prompt) => set({ prompt }),
  setSelectedModel: (selectedModel) => set({ selectedModel }),
  setShowSettings: (showSettings) => set({ showSettings }),
  setAutoRefreshScreenshot: (autoRefreshScreenshot) => set({ autoRefreshScreenshot }),
  setShowCalculator: (showCalculator) => set({ showCalculator }),
  setExtensionPaths: (extensionPaths) => set({ extensionPaths }),
  setUserDataDir: (userDataDir) => set({ userDataDir }),

  checkStatus: async () => {
    try {
      await api.health();
      const status = await api.status();
      set({
        serverOnline: true,
        browserActive: status.active,
        browserUrl: status.url,
        browserTitle: status.title,
      });
    } catch {
      set({ serverOnline: false, browserActive: false, browserUrl: null, browserTitle: null });
    }
  },

  launchBrowser: async (headless = true) => {
    set({ isLoading: true, error: null });
    try {
      const { extensionPaths, userDataDir } = get();
      await api.launch(headless, extensionPaths, userDataDir || undefined);
      await get().checkStatus();
      // Auto-check AvantPro auth if extensions loaded
      if (extensionPaths.length > 0) {
        setTimeout(() => get().checkAvantproStatus(), 3000);
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro ao iniciar browser" });
    } finally {
      set({ isLoading: false });
    }
  },

  closeBrowser: async () => {
    try {
      await api.close();
      set({ browserActive: false, browserUrl: null, browserTitle: null, screenshot: null });
    } catch { /* ignore */ }
  },

  navigateTo: async (url: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.navigate(url);
      set({ browserUrl: res.url, browserTitle: res.title, browserActive: true });
      if (get().autoRefreshScreenshot) {
        await get().takeScreenshot();
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro ao navegar" });
    } finally {
      set({ isLoading: false });
    }
  },

  takeScreenshot: async () => {
    try {
      const res = await api.screenshot();
      if (res.success) set({ screenshot: res.screenshot });
    } catch { /* ignore */ }
  },

  analyzePage: async () => {
    const { prompt, selectedModel } = get();
    if (!prompt.trim()) {
      set({ error: "Digite um prompt" });
      return;
    }

    set({ isLoading: true, error: null, response: "", pendingActions: [] });

    try {
      const res = await api.analyze({ prompt, model: selectedModel });

      if (res.success) {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          prompt,
          model: selectedModel,
          url: get().browserUrl || "",
          response: res.response,
        };

        set((s) => ({
          response: res.response,
          pendingActions: res.actions || [],
          history: [entry, ...s.history].slice(0, 50),
        }));
      } else {
        set({ error: "Erro na análise" });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro desconhecido" });
    } finally {
      set({ isLoading: false });
    }
  },

  executeActions: async (actions) => {
    const toExecute = actions || get().pendingActions;
    if (toExecute.length === 0) return;

    set({ isLoading: true, error: null });

    const logs: ActionLog[] = toExecute.map((a) => ({
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      action: a.description,
      selector: a.selector,
      status: "pending" as const,
    }));

    set((s) => ({ actionLogs: [...s.actionLogs, ...logs] }));

    try {
      const res = await api.executeActions(toExecute);
      if (res.success) {
        set((s) => {
          const updated = [...s.actionLogs];
          res.results.forEach((r: ActionResult, i: number) => {
            const idx = updated.length - logs.length + i;
            if (updated[idx]) {
              updated[idx] = { ...updated[idx], status: r.success ? "success" : "error", detail: r.detail };
            }
          });
          return { actionLogs: updated, pendingActions: [] };
        });

        // Refresh screenshot after actions
        if (get().autoRefreshScreenshot) {
          await new Promise((r) => setTimeout(r, 500));
          await get().takeScreenshot();
          await get().checkStatus();
        }
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro ao executar ações" });
    } finally {
      set({ isLoading: false });
    }
  },

  saveApiKeys: async (keys) => {
    try {
      const res = await api.setKeys(keys);
      set({ configuredKeys: res.configured, showSettings: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro ao salvar chaves" });
    }
  },

  loadConfiguredKeys: async () => {
    try {
      const res = await api.getKeys();
      set({ configuredKeys: res.configured });
    } catch { /* ignore */ }
  },

  clearHistory: () => set({ history: [] }),
  clearActionLogs: () => set({ actionLogs: [] }),

  restoreEntry: (entry) => {
    set({ prompt: entry.prompt, response: entry.response, selectedModel: entry.model });
  },

  setAvantproEmail: (avantproEmail) => set({ avantproEmail }),

  authenticateAvantpro: async () => {
    const { avantproEmail } = get();
    if (!avantproEmail.trim()) {
      set({ error: "Digite o email do AvantPro" });
      return;
    }
    set({ avantproLoading: true, error: null });
    try {
      const res = await api.avantproAuth(avantproEmail.trim());
      if (res.success && res.user) {
        set({
          avantproAuthenticated: true,
          avantproPlan: res.user.plan,
          avantproEmail: res.user.email,
        });
      } else {
        set({ error: res.error || "Falha na autenticação AvantPro" });
      }
    } catch (err) {
      set({ error: err instanceof Error ? err.message : "Erro ao autenticar AvantPro" });
    } finally {
      set({ avantproLoading: false });
    }
  },

  checkAvantproStatus: async () => {
    try {
      const res = await api.avantproStatus();
      if (res.authenticated) {
        set({ avantproAuthenticated: true, avantproEmail: res.email || "", avantproPlan: res.plan || null });
      } else {
        set({ avantproAuthenticated: false, avantproPlan: null });
      }
    } catch {
      set({ avantproAuthenticated: false });
    }
  },
}));
