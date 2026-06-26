// BrowserMind AI - Background Service Worker
// Handles communication between popup, content scripts, and Playwright server

import { createProvider } from "@/providers";
import type { ModelId, AnalysisEntry, BrowserAction } from "@/types";

const PLAYWRIGHT_SERVER = "http://localhost:3210";

// Message types
interface AnalyzeMessage {
  type: "ANALYZE";
  prompt: string;
  model: ModelId;
  apiKeys: Record<string, string>;
}

interface ExecuteMessage {
  type: "EXECUTE";
  actions: BrowserAction[];
}

interface ExtractMessage {
  type: "GET_PAGE_DATA";
}

interface PlaywrightLaunchMessage {
  type: "PLAYWRIGHT_LAUNCH";
  headless?: boolean;
}

interface PlaywrightCloseMessage {
  type: "PLAYWRIGHT_CLOSE";
}

interface PlaywrightStatusMessage {
  type: "PLAYWRIGHT_STATUS";
}

interface PlaywrightNavigateMessage {
  type: "PLAYWRIGHT_NAVIGATE";
  url: string;
}

interface PlaywrightScreenshotMessage {
  type: "PLAYWRIGHT_SCREENSHOT";
}

type Message =
  | AnalyzeMessage
  | ExecuteMessage
  | ExtractMessage
  | PlaywrightLaunchMessage
  | PlaywrightCloseMessage
  | PlaywrightStatusMessage
  | PlaywrightNavigateMessage
  | PlaywrightScreenshotMessage;

// --- Playwright Server Communication ---

async function playwrightRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${PLAYWRIGHT_SERVER}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error || `Playwright server error: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

async function isPlaywrightAvailable(): Promise<boolean> {
  try {
    await playwrightRequest<{ status: string }>("/health");
    return true;
  } catch {
    return false;
  }
}

// --- Content Script Communication (for extraction from active tab) ---

async function getActiveTab(): Promise<chrome.tabs.Tab> {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.id) throw new Error("No active tab found");
  return tab;
}

// Inline extraction function injected directly into the page
function extractPageInline() {
  const IGNORED = new Set([
    "SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "IFRAME",
    "OBJECT", "EMBED", "LINK", "META", "HEAD",
  ]);

  function walkText(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) return (node.textContent || "").trim();
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const el = node as Element;
    if (IGNORED.has(el.tagName)) return "";
    try {
      const style = window.getComputedStyle(el);
      if (style.display === "none" || style.visibility === "hidden" || style.opacity === "0") return "";
    } catch { /* ignore */ }
    const parts: string[] = [];
    for (const child of el.childNodes) {
      const t = walkText(child);
      if (t) parts.push(t);
    }
    const joined = parts.join(" ");
    if (["H1", "H2", "H3", "H4", "H5", "H6", "P", "LI", "TR", "DIV", "SECTION", "ARTICLE"].includes(el.tagName)) {
      return joined + "\n";
    }
    return joined;
  }

  const visibleText = walkText(document.body).replace(/\n{3,}/g, "\n\n").replace(/ {2,}/g, " ").trim();

  const headings: string[] = [];
  document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
    const t = (h.textContent || "").trim();
    if (t) headings.push(`${h.tagName}: ${t}`);
  });

  const links: { text: string; href: string }[] = [];
  const seen = new Set<string>();
  document.querySelectorAll("a[href]").forEach((a) => {
    const href = a.getAttribute("href") || "";
    const text = (a.textContent || "").trim();
    if (text && href && !seen.has(href)) {
      seen.add(href);
      links.push({ text: text.slice(0, 100), href });
    }
  });

  const metaTags: Record<string, string> = {};
  document.querySelectorAll("meta[name], meta[property]").forEach((tag) => {
    const key = tag.getAttribute("name") || tag.getAttribute("property") || "";
    const val = tag.getAttribute("content") || "";
    if (key && val) metaTags[key] = val;
  });

  const tables: string[][] = [];
  document.querySelectorAll("table").forEach((table) => {
    table.querySelectorAll("tr").forEach((tr) => {
      const row: string[] = [];
      tr.querySelectorAll("td, th").forEach((cell) => {
        row.push((cell.textContent || "").trim());
      });
      if (row.length > 0) tables.push(row);
    });
  });

  const structuredData: unknown[] = [];
  document.querySelectorAll('script[type="application/ld+json"]').forEach((s) => {
    try { structuredData.push(JSON.parse(s.textContent || "")); } catch { /* ignore */ }
  });

  return {
    url: window.location.href,
    title: document.title,
    visibleText: visibleText.slice(0, 50000),
    selectedText: window.getSelection()?.toString()?.trim() || "",
    headings: headings.slice(0, 50),
    links: links.slice(0, 100),
    metaTags,
    tables: tables.slice(0, 200),
    structuredData,
  };
}

async function extractPageDataFromTab(tabId: number) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: extractPageInline,
  });
  if (results && results[0]?.result) {
    return results[0].result;
  }
  throw new Error("Failed to extract page data");
}

// Extract page data: prefer Playwright browser if active, fallback to active tab
async function extractPageData(): Promise<Record<string, unknown>> {
  const pwAvailable = await isPlaywrightAvailable();
  if (pwAvailable) {
    try {
      const status = await playwrightRequest<{ active: boolean }>("/status");
      if (status.active) {
        const res = await playwrightRequest<{ success: boolean; data: Record<string, unknown> }>("/extract");
        if (res.success) return res.data;
      }
    } catch {
      // fallback to tab
    }
  }

  const tab = await getActiveTab();
  if (!tab.id) throw new Error("No active tab");
  return (await extractPageDataFromTab(tab.id)) as Record<string, unknown>;
}

// Execute actions via Playwright server
async function executeBrowserActions(actions: BrowserAction[]) {
  const res = await playwrightRequest<{ success: boolean; results: unknown[] }>("/actions", {
    method: "POST",
    body: JSON.stringify({ actions }),
  });
  return res.results;
}

// Parse AI response for actions
function parseActionsFromResponse(response: string): BrowserAction[] | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*"actions"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
      return parsed.actions as BrowserAction[];
    }
  } catch {
    // No valid actions found
  }
  return null;
}

// --- Message Handlers ---

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  const handlers: Record<string, (msg: Message) => Promise<unknown>> = {
    ANALYZE: (m) => handleAnalyze(m as AnalyzeMessage),
    EXECUTE: (m) => handleExecute(m as ExecuteMessage),
    GET_PAGE_DATA: () => handleGetPageData(),
    PLAYWRIGHT_LAUNCH: (m) => handlePlaywrightLaunch(m as PlaywrightLaunchMessage),
    PLAYWRIGHT_CLOSE: () => handlePlaywrightClose(),
    PLAYWRIGHT_STATUS: () => handlePlaywrightStatus(),
    PLAYWRIGHT_NAVIGATE: (m) => handlePlaywrightNavigate(m as PlaywrightNavigateMessage),
    PLAYWRIGHT_SCREENSHOT: () => handlePlaywrightScreenshot(),
  };

  const handler = handlers[message.type];
  if (handler) {
    handler(message)
      .then(sendResponse)
      .catch((err) => sendResponse({ success: false, error: String(err) }));
    return true;
  }
});

async function handleAnalyze(message: AnalyzeMessage) {
  const pageData = await extractPageData();

  const contentParts = [
    `URL: ${pageData.url}`,
    `Title: ${pageData.title}`,
    pageData.selectedText ? `\nSelected Text:\n${pageData.selectedText}` : "",
    `\nHeadings:\n${(pageData.headings as string[] || []).join("\n")}`,
    `\nMain Content:\n${pageData.visibleText}`,
    (pageData.tables as string[][] || []).length > 0
      ? `\nTables:\n${(pageData.tables as string[][]).map((row) => row.join(" | ")).join("\n")}`
      : "",
    Object.keys((pageData.metaTags as Record<string, string>) || {}).length > 0
      ? `\nMeta Tags:\n${Object.entries(pageData.metaTags as Record<string, string>)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\n")}`
      : "",
  ]
    .filter(Boolean)
    .join("\n");

  const provider = createProvider(message.model, message.apiKeys);
  const response = await provider.analyze({
    prompt: message.prompt,
    pageContent: contentParts,
  });

  const actions = parseActionsFromResponse(response);

  const entry: AnalysisEntry = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    prompt: message.prompt,
    model: message.model,
    url: String(pageData.url),
    response,
  };

  const storage = await chrome.storage.local.get("history");
  const history: AnalysisEntry[] = storage.history || [];
  history.unshift(entry);
  await chrome.storage.local.set({ history: history.slice(0, 50) });

  return { success: true, response, actions, entry };
}

async function handleExecute(message: ExecuteMessage) {
  const pwAvailable = await isPlaywrightAvailable();
  if (!pwAvailable) {
    return { success: false, error: "Servidor Playwright não está rodando. Inicie com: cd server && npm run dev" };
  }

  const results = await executeBrowserActions(message.actions);
  return { success: true, results };
}

async function handleGetPageData() {
  const data = await extractPageData();
  return { success: true, data };
}

async function handlePlaywrightLaunch(message: PlaywrightLaunchMessage) {
  return playwrightRequest("/launch", {
    method: "POST",
    body: JSON.stringify({ headless: message.headless ?? false }),
  });
}

async function handlePlaywrightClose() {
  return playwrightRequest("/close", { method: "POST" });
}

async function handlePlaywrightStatus() {
  try {
    const available = await isPlaywrightAvailable();
    if (!available) {
      return { success: true, serverOnline: false, active: false, url: null, title: null };
    }
    const status = await playwrightRequest<{ active: boolean; url: string | null; title: string | null }>("/status");
    return { success: true, serverOnline: true, ...status };
  } catch {
    return { success: true, serverOnline: false, active: false, url: null, title: null };
  }
}

async function handlePlaywrightNavigate(message: PlaywrightNavigateMessage) {
  return playwrightRequest("/navigate", {
    method: "POST",
    body: JSON.stringify({ url: message.url }),
  });
}

async function handlePlaywrightScreenshot() {
  return playwrightRequest("/screenshot");
}
