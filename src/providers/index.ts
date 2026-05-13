import type { AIProvider, ModelId } from "@/types";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { ClaudeProvider } from "./claude";
import { DeepSeekProvider } from "./deepseek";

export function createProvider(modelId: ModelId, apiKeys: Record<string, string>): AIProvider {
  switch (modelId) {
    case "gemini-flash-2.5":
      return new GeminiProvider(apiKeys.google || "", "gemini-2.5-flash");
    case "gemini-pro-2.5":
      return new GeminiProvider(apiKeys.google || "", "gemini-2.5-pro");
    case "gemini-flash-3":
      return new GeminiProvider(apiKeys.google || "", "gemini-3-flash-preview");
    case "gemini-pro-3.1":
      return new GeminiProvider(apiKeys.google || "", "gemini-3.1-pro-preview");
    case "gpt-4.1":
      return new OpenAIProvider(apiKeys.openai || "");
    case "claude-sonnet":
      return new ClaudeProvider(apiKeys.anthropic || "");
    case "deepseek":
      return new DeepSeekProvider(apiKeys.deepseek || "");
    default:
      throw new Error(`Modelo não suportado: ${modelId}`);
  }
}

export { GeminiProvider, OpenAIProvider, ClaudeProvider, DeepSeekProvider };
