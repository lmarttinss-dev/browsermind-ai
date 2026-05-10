import axios from "axios";
import { BaseProvider } from "./base";

export class DeepSeekProvider extends BaseProvider {
  name = "DeepSeek";
  model = "deepseek-chat";

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
        max_tokens: 8192,
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
