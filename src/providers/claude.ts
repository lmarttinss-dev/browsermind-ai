import axios from "axios";
import { BaseProvider } from "./base";

export class ClaudeProvider extends BaseProvider {
  name = "Claude Sonnet";
  model = "claude-sonnet-4-20250514";

  async analyze(params: {
    prompt: string;
    pageContent: string;
    screenshot?: string;
  }): Promise<string> {
    const content: Array<{ type: string; text?: string; source?: { type: string; media_type: string; data: string } }> = [
      {
        type: "text",
        text: `Conteúdo da página:\n${this.truncateContent(params.pageContent)}\n\nPrompt: ${params.prompt}`,
      },
    ];

    if (params.screenshot) {
      content.unshift({
        type: "image",
        source: {
          type: "base64",
          media_type: "image/png",
          data: params.screenshot,
        },
      });
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: this.model,
        max_tokens: 16384,
        system: this.buildSystemPrompt(),
        messages: [{ role: "user", content }],
      },
      {
        headers: {
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      }
    );

    const text = response.data.content?.[0]?.text;
    if (!text) throw new Error("Resposta vazia do Claude");
    return text;
  }
}
