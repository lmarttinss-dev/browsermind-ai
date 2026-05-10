// BrowserMind AI - Playwright Client
// Communicates with the local Playwright server for browser automation

const PLAYWRIGHT_SERVER = "http://localhost:3210";

export interface BrowserAction {
  type: "click" | "type" | "scroll" | "navigate" | "select" | "wait" | "extract" | "screenshot" | "goBack" | "goForward" | "hover";
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

export interface PlaywrightStatus {
  active: boolean;
  url: string | null;
  title: string | null;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PLAYWRIGHT_SERVER}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Server error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const playwrightClient = {
  async health(): Promise<boolean> {
    try {
      await request<{ status: string }>("/health");
      return true;
    } catch {
      return false;
    }
  },

  async status(): Promise<PlaywrightStatus> {
    return request<PlaywrightStatus>("/status");
  },

  async launch(headless = false): Promise<void> {
    await request("/launch", {
      method: "POST",
      body: JSON.stringify({ headless }),
    });
  },

  async close(): Promise<void> {
    await request("/close", { method: "POST" });
  },

  async navigate(url: string): Promise<{ url: string; title: string }> {
    return request("/navigate", {
      method: "POST",
      body: JSON.stringify({ url }),
    });
  },

  async screenshot(): Promise<string> {
    const res = await request<{ screenshot: string }>("/screenshot");
    return res.screenshot;
  },

  async extractContent(): Promise<{
    url: string;
    title: string;
    visibleText: string;
    headings: string[];
    links: { text: string; href: string }[];
    metaTags: Record<string, string>;
  }> {
    const res = await request<{ data: ReturnType<typeof playwrightClient.extractContent> extends Promise<infer T> ? T : never }>("/extract");
    return res.data;
  },

  async executeAction(action: BrowserAction): Promise<ActionResult> {
    return request<ActionResult>("/action", {
      method: "POST",
      body: JSON.stringify(action),
    });
  },

  async executeActions(actions: BrowserAction[]): Promise<ActionResult[]> {
    const res = await request<{ results: ActionResult[] }>("/actions", {
      method: "POST",
      body: JSON.stringify({ actions }),
    });
    return res.results;
  },
};
