import axios from "axios";
import { BaseProvider } from "./base";

export class GeminiProvider extends BaseProvider {
  name: string;
  model: string;

  constructor(apiKey: string, model: "gemini-2.5-flash" | "gemini-2.5-pro" | "gemini-3-flash-preview" | "gemini-3.1-pro-preview" = "gemini-2.5-flash") {
    super(apiKey);
    this.model = model;
    const nameMap: Record<string, string> = {
      "gemini-2.5-flash": "Gemini 2.5 Flash",
      "gemini-2.5-pro": "Gemini 2.5 Pro",
      "gemini-3-flash-preview": "Gemini 3 Flash",
      "gemini-3.1-pro-preview": "Gemini 3.1 Pro",
    };
    this.name = nameMap[model] || model;
  }

  async analyze(params: {
    prompt: string;
    pageContent: string;
    screenshot?: string;
  }): Promise<string> {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const parts: Array<{ text: string } | { inline_data: { mime_type: string; data: string } }> = [
      { text: this.buildSystemPrompt() },
      { text: `Conteúdo da página:\n${this.truncateContent(params.pageContent)}` },
      { text: `Prompt do usuário: ${params.prompt}` },
    ];

    if (params.screenshot) {
      parts.push({
        inline_data: {
          mime_type: "image/png",
          data: params.screenshot,
        },
      });
    }

    const response = await axios.post(url, {
      contents: [{ parts }],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 16384,
      },
    });

    const candidate = response.data.candidates?.[0];
    if (!candidate?.content?.parts?.[0]?.text) {
      throw new Error("Resposta vazia do Gemini");
    }

    return candidate.content.parts[0].text;
  }
}
