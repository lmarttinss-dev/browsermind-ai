const API_BASE = "";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Server error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Health
  health: () => request<{ status: string }>("/health"),

  // Browser control
  status: () => request<{ active: boolean; url: string | null; title: string | null }>("/status"),
  launch: (headless = false, extensionPaths: string[] = [], userDataDir?: string) =>
    request("/launch", { method: "POST", body: JSON.stringify({ headless, extensionPaths, userDataDir }) }),
  close: () => request("/close", { method: "POST" }),
  navigate: (url: string) => request<{ success: boolean; url: string; title: string }>("/navigate", { method: "POST", body: JSON.stringify({ url }) }),
  screenshot: () => request<{ success: boolean; screenshot: string }>("/screenshot"),
  extract: () => request<{ success: boolean; data: { url: string; title: string; visibleText: string; headings: string[]; links: { text: string; href: string }[]; metaTags: Record<string, string> } }>("/extract"),
  extractProduct: () => request<{ success: boolean; data: { salePrice: number | null; commissionPercent: number | null; taxPercent: number | null; monthlySales: number | null; productName: string | null } }>("/extract/product"),

  // Actions
  executeAction: (action: BrowserAction) => request<ActionResult>("/action", { method: "POST", body: JSON.stringify(action) }),
  executeActions: (actions: BrowserAction[]) => request<{ success: boolean; results: ActionResult[] }>("/actions", { method: "POST", body: JSON.stringify({ actions }) }),

  // AI Proxy
  setKeys: (keys: Record<string, string>) => request<{ success: boolean; configured: string[] }>("/api/keys", { method: "POST", body: JSON.stringify({ keys }) }),
  getKeys: () => request<{ configured: string[] }>("/api/keys"),
  analyze: (params: { prompt: string; model: string; pageContent?: string; screenshot?: string }) =>
    request<{ success: boolean; response: string; actions?: BrowserAction[] }>("/api/analyze", { method: "POST", body: JSON.stringify(params) }),

  // AvantPro
  avantproAuth: (email: string) =>
    request<{ success: boolean; user?: { email: string; plan: string }; message?: string; error?: string }>("/avantpro/auth", { method: "POST", body: JSON.stringify({ email }) }),
  avantproStatus: () =>
    request<{ success: boolean; authenticated: boolean; email?: string; plan?: string }>("/avantpro/status"),
};

export interface BrowserAction {
  type: "click" | "type" | "scroll" | "navigate" | "select" | "wait" | "extract" | "screenshot" | "goBack" | "goForward" | "hover" | "evaluate";
  selector?: string;
  value?: string;
  description: string;
}

export interface ActionResult {
  success: boolean;
  action: BrowserAction;
  detail?: string;
  extractedData?: string;
  screenshot?: string;
}

export type ModelId = "gemini-flash-2.5" | "gemini-pro" | "gpt-4.1" | "claude-sonnet" | "deepseek";

export interface ModelOption {
  id: ModelId;
  name: string;
}

export const MODELS: ModelOption[] = [
  { id: "gemini-flash-2.5", name: "Gemini Flash 2.5" },
  { id: "gemini-pro", name: "Gemini Pro" },
  { id: "gpt-4.1", name: "GPT-4.1" },
  { id: "claude-sonnet", name: "Claude Sonnet" },
  { id: "deepseek", name: "DeepSeek" },
];
