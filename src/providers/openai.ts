import axios from "axios";
import { BaseProvider } from "./base";

export class OpenAIProvider extends BaseProvider {
  name = "GPT-4.1";
  model = "gpt-4.1";

  async analyze(params: {
    prompt: string;
    pageContent: string;
    screenshot?: string;
  }): Promise<string> {
    const messages: Array<{
      role: string;
      content: string | Array<{ type: string; text?: string; image_url?: { url: string } }>;
    }> = [
      { role: "system", content: this.buildSystemPrompt() },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Conteúdo da página:\n${this.truncateContent(params.pageContent)}\n\nPrompt: ${params.prompt}`,
          },
          ...(params.screenshot
            ? [
                {
                  type: "image_url" as const,
                  image_url: { url: `data:image/png;base64,${params.screenshot}` },
                },
              ]
            : []),
        ],
      },
    ];

    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: this.model,
        messages,
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
    if (!text) throw new Error("Resposta vazia do OpenAI");
    return text;
  }
}
