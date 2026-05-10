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
  | "gemini-pro"
  | "gpt-4.1"
  | "claude-sonnet"
  | "deepseek";

export interface ModelOption {
  id: ModelId;
  name: string;
  provider: string;
}

export const MODELS: ModelOption[] = [
  { id: "gemini-flash-2.5", name: "Gemini Flash 2.5", provider: "google" },
  { id: "gemini-pro", name: "Gemini Pro", provider: "google" },
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
