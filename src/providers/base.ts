import type { AIProvider } from "@/types";

export abstract class BaseProvider implements AIProvider {
  abstract name: string;
  abstract model: string;

  protected apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  abstract analyze(params: {
    prompt: string;
    pageContent: string;
    screenshot?: string;
  }): Promise<string>;

  protected buildSystemPrompt(): string {
    return `Você é o BrowserMind AI, um assistente inteligente integrado ao navegador com capacidade de automação via Playwright.
Você recebe o conteúdo de uma página web e deve analisar e responder ao prompt do usuário.

Diretrizes:
- Responda de forma clara, objetiva e em Markdown
- Extraia e organize informações relevantes
- Quando solicitado a executar ações, responda com um JSON de ações no formato:
  {"actions": [{"type": "click|type|scroll|navigate|select|wait|extract|screenshot|hover|goBack|goForward", "selector": "CSS selector", "value": "valor opcional", "description": "descrição da ação"}]}
- As ações são executadas via Playwright, então use seletores CSS padrão
- Para clicar por texto, use o texto visível como selector (ex: "Entrar", "Comprar")
- Para preencher campos, use seletores como "input[name=email]" ou "#search"
- Se não puder executar uma ação, explique o motivo
- Priorize informações visíveis e relevantes da página`;
  }

  protected truncateContent(content: string, maxLength = 30000): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength) + "\n\n[... conteúdo truncado ...]";
  }
}
