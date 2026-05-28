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

  // Actions
  executeAction: (action: BrowserAction) => request<ActionResult>("/action", { method: "POST", body: JSON.stringify(action) }),
  executeActions: (actions: BrowserAction[]) => request<{ success: boolean; results: ActionResult[] }>("/actions", { method: "POST", body: JSON.stringify({ actions }) }),

  // Config
  getConfig: () => request<{ defaultModel: string }>("/api/config"),

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

  // Pipeline
  getPipelineProducts: () =>
    request<{ success: boolean; products: Record<string, PipelineProduct[]> }>("/api/pipeline"),
  getPipelineProduct: (id: string) =>
    request<{ success: boolean; product: PipelineProduct }>(`/api/pipeline/${id}`),
  createPipelineProduct: (data: Partial<PipelineProduct>) =>
    request<{ success: boolean; product: PipelineProduct }>("/api/pipeline", { method: "POST", body: JSON.stringify(data) }),
  updatePipelineProduct: (id: string, data: Partial<PipelineProduct>) =>
    request<{ success: boolean; product: PipelineProduct }>(`/api/pipeline/${id}`, { method: "PATCH", body: JSON.stringify(data) }),
  movePipelineProduct: (id: string, stage: string, order: number) =>
    request<{ success: boolean; product: PipelineProduct }>(`/api/pipeline/${id}/move`, { method: "PATCH", body: JSON.stringify({ stage, order }) }),
  deletePipelineProduct: (id: string) =>
    request<{ success: boolean }>(`/api/pipeline/${id}`, { method: "DELETE" }),

  // Suppliers
  captureSuppliers: (productId: string, report: string) =>
    request<{ success: boolean; suppliers: Supplier[]; supplierReport: string }>(`/api/pipeline/${productId}/suppliers`, {
      method: "POST",
      body: JSON.stringify({ report }),
    }),
  removeSupplier: (productId: string, index: number) =>
    request<{ success: boolean; suppliers: Supplier[] }>(`/api/pipeline/${productId}/suppliers/${index}`, {
      method: "DELETE",
    }),

  // Compare
  comparePipelineProducts: (model: string, stage: PipelineStage = "triagem", forceRefresh = false) =>
    request<ComparisonResponse>("/api/pipeline/compare", {
      method: "POST",
      body: JSON.stringify({ model, stage, forceRefresh }),
    }),
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

export type PipelineStage = "triagem" | "analise" | "aprovado" | "importando" | "concluido";
export type CompetitionLevel = "Baixa" | "Média" | "Alta" | "Saturado";

export type Supplier = {
  name: string;
  url: string;
  unitPrice: string;
  moq: string;
  rating: number;
  tradeAssurance: boolean;
  yearsInBusiness: number;
  responseRate: string;
  capabilities: string;
  certifications: string;
  capturedAt: string;
};

export type PipelineProduct = {
  _id: string;
  title: string;
  url: string;
  imageUrl: string;
  price: number;
  category: string;
  stage: PipelineStage;
  score: number;
  monthlySales: number;
  competitionLevel: CompetitionLevel;
  potentialMargin: string;
  analysisReport: string;
  analyzedAt: string;
  order: number;
  suppliers: Supplier[];
  supplierReport: string;
  createdAt: string;
  updatedAt: string;
};

export type ComparisonRanking = {
  productId: string;
  position: number;
  reason: string;
};

export type ComparisonResult = {
  ranking: ComparisonRanking[];
  report: string;
  productsCompared: number;
};

export type ComparisonResponse = {
  success: boolean;
  comparison: ComparisonResult;
  cached: boolean;
  cachedAt?: string;
};

export type ModelId = "gemini-flash-2.5" | "gemini-pro-2.5" | "gemini-flash-3" | "gemini-pro-3.1" | "gpt-4.1" | "claude-sonnet" | "deepseek";

export interface ModelOption {
  id: ModelId;
  name: string;
}

export const MODELS: ModelOption[] = [
  { id: "gemini-flash-2.5", name: "Gemini 2.5 Flash" },
  { id: "gemini-pro-2.5", name: "Gemini 2.5 Pro" },
  { id: "gemini-flash-3", name: "Gemini 3 Flash" },
  { id: "gemini-pro-3.1", name: "Gemini 3.1 Pro" },
  { id: "gpt-4.1", name: "GPT-4.1" },
  { id: "claude-sonnet", name: "Claude Sonnet" },
  { id: "deepseek", name: "DeepSeek" },
];
