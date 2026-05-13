export interface PageData {
  url: string;
  title: string;
  visibleText: string;
  simplifiedHtml: string;
  metaTags: Record<string, string>;
  structuredData: unknown[];
  selectedText: string;
  headings: string[];
  links: { text: string; href: string }[];
  images: { alt: string; src: string }[];
  tables: string[][];
}

export interface AIProvider {
  name: string;
  model: string;
  analyze(params: {
    prompt: string;
    pageContent: string;
    screenshot?: string;
  }): Promise<string>;
}

export type ModelId =
  | "gemini-flash-2.5"
  | "gemini-pro-2.5"
  | "gemini-flash-3"
  | "gemini-pro-3.1"
  | "gpt-4.1"
  | "claude-sonnet"
  | "deepseek";

export interface ModelOption {
  id: ModelId;
  name: string;
  provider: string;
}

export const MODELS: ModelOption[] = [
  { id: "gemini-flash-2.5", name: "Gemini 2.5 Flash", provider: "google" },
  { id: "gemini-pro-2.5", name: "Gemini 2.5 Pro", provider: "google" },
  { id: "gemini-flash-3", name: "Gemini 3 Flash", provider: "google" },
  { id: "gemini-pro-3.1", name: "Gemini 3.1 Pro", provider: "google" },
  { id: "gpt-4.1", name: "GPT-4.1", provider: "openai" },
  { id: "claude-sonnet", name: "Claude Sonnet", provider: "anthropic" },
  { id: "deepseek", name: "DeepSeek", provider: "deepseek" },
];

export interface AnalysisEntry {
  id: string;
  timestamp: number;
  prompt: string;
  model: ModelId;
  url: string;
  response: string;
}

export interface ActionLog {
  id: string;
  timestamp: number;
  action: string;
  selector?: string;
  status: "pending" | "success" | "error";
  detail?: string;
}

export interface BrowserAction {
  type: "click" | "type" | "scroll" | "navigate" | "select" | "wait" | "extract" | "screenshot" | "goBack" | "goForward" | "hover";
  selector?: string;
  value?: string;
  description: string;
}

export interface PlaywrightStatus {
  active: boolean;
  url: string | null;
  title: string | null;
}
