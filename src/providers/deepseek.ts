import axios from "axios";
import { BaseProvider } from "./base";

export class DeepSeekProvider extends BaseProvider {
  name: string;
  model: string;

  constructor(apiKey: string, model: "deepseek-v4-flash" | "deepseek-v4-pro" = "deepseek-v4-flash") {
    super(apiKey);
    this.model = model;
    this.name = model === "deepseek-v4-pro" ? "DeepSeek V4 Pro" : "DeepSeek V4 Flash";
  }

  async analyze(params: {
    prompt: string;
    pageContent: string;
    screenshot?: string;
  }): Promise<string> {
    const response = await axios.post(
      "https://api.deepseek.com/chat/completions",
      {
        model: this.model,
        messages: [
          { role: "system", content: this.buildSystemPrompt() },
          {
            role: "user",
            content: `Conteúdo da página:\n${this.truncateContent(params.pageContent)}\n\nPrompt: ${params.prompt}`,
          },
        ],
        max_tokens: 16384,
        temperature: 0.7,
      },
      {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.choices?.[0]?.message?.content;
    if (!text) throw new Error("Resposta vazia do DeepSeek");
    return text;
  }
}
