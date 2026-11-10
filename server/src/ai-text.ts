import axios from "axios";
import { postDeepSeek } from "./deepseek-client.js";

// Shared provider dispatch; keys remain server-side, including keys changed in Settings.
export async function generateText(model: string, userMessage: string, options: {
  keys: Record<string, string>; system: string; screenshot?: string; marketAnalysis?: boolean; temperature?: number;
}): Promise<string> {
    const screenshot = options.screenshot;
    let aiResponse: string;

    if (model === "gemini-flash-2.5" || model === "gemini-pro-2.5" || model === "gemini-flash-3" || model === "gemini-pro-3.1") {
      const geminiModelMap: Record<string, string> = {
        "gemini-flash-2.5": "gemini-2.5-flash",
        "gemini-pro-2.5": "gemini-2.5-pro",
        "gemini-flash-3": "gemini-3-flash-preview",
        "gemini-pro-3.1": "gemini-3.1-pro-preview",
      };
      const geminiModel = geminiModelMap[model];
      const key = options.keys.gemini;
      if (!key) throw new Error("Chave Gemini não configurada. Configure em Settings.");

      const parts: Array<Record<string, unknown>> = [
        { text: options.system },
        { text: userMessage },
      ];
      if (screenshot) {
        parts.push({ inline_data: { mime_type: "image/png", data: screenshot } });
      }

      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
        { contents: [{ parts }], generationConfig: { temperature: options.temperature ?? 0.7, maxOutputTokens: options.marketAnalysis ? 65536 : 16384 } }
      );
      aiResponse = r.data.candidates?.[0]?.content?.parts?.[0]?.text || "";
      if (options.marketAnalysis && r.data.candidates?.[0]?.finishReason === "MAX_TOKENS") {
        console.log("⚠️ Gemini: relatório pode ter sido truncado (finishReason=MAX_TOKENS)")
      }

    } else if (model === "gpt-4.1") {
      const key = options.keys.openai;
      if (!key) throw new Error("Chave OpenAI não configurada. Configure em Settings.");

      const msgContent: Array<Record<string, unknown>> = [{ type: "text", text: userMessage }];
      if (screenshot) {
        msgContent.push({ type: "image_url", image_url: { url: `data:image/png;base64,${screenshot}` } });
      }

      const r = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4.1",
        messages: [
          { role: "system", content: options.system },
          { role: "user", content: msgContent },
        ],
        max_tokens: options.marketAnalysis ? 32768 : 16384,
        temperature: options.temperature ?? 0.7,
      }, { headers: { Authorization: `Bearer ${key}` } });
      aiResponse = r.data.choices?.[0]?.message?.content || "";
      if (options.marketAnalysis && r.data.choices?.[0]?.finish_reason === "length") {
        console.log("⚠️ OpenAI: relatório pode ter sido truncado (finish_reason=length)")
      }

    } else if (model === "claude-sonnet") {
      const key = options.keys.anthropic;
      if (!key) throw new Error("Chave Anthropic não configurada. Configure em Settings.");

      const msgContent: Array<Record<string, unknown>> = [];
      if (screenshot) {
        msgContent.push({ type: "image", source: { type: "base64", media_type: "image/png", data: screenshot } });
      }
      msgContent.push({ type: "text", text: userMessage });

      const r = await axios.post("https://api.anthropic.com/v1/messages", {
        model: "claude-sonnet-4-20250514",
        max_tokens: options.marketAnalysis ? 64000 : 16384,
        system: options.system,
        messages: [{ role: "user", content: msgContent }],
      }, { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
      aiResponse = r.data.content?.[0]?.text || "";
      if (options.marketAnalysis && r.data.stop_reason === "max_tokens") {
        console.log("⚠️ Claude: relatório pode ter sido truncado (stop_reason=max_tokens)")
      }

    } else if (model === "deepseek-flash" || model === "deepseek-pro") {
      const key = options.keys.deepseek;
      if (!key) throw new Error("Chave DeepSeek não configurada. Configure em Settings.");
      const deepseekModel = model === "deepseek-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash";

      // DeepSeek tem teto de saída menor que os demais modelos. Quando a resposta
      // atinge o limite (finish_reason=length), faz chamadas de continuação para
      // que o relatório não seja cortado no meio.
      const messages: Array<{ role: string; content: string }> = [
        { role: "system", content: options.system },
        { role: "user", content: userMessage },
      ];
      aiResponse = "";
      let lastFinishReason = "";
      for (let round = 0; round < 4; round++) {
        const r = await postDeepSeek({
          model: deepseekModel,
          messages,
          max_tokens: 16384,
          temperature: options.temperature ?? 0.7,
        }, key);
        const chunk = r.data.choices?.[0]?.message?.content || "";
        lastFinishReason = r.data.choices?.[0]?.finish_reason || "";
        aiResponse += chunk;
        if (lastFinishReason !== "length") break;
        messages.push({ role: "assistant", content: chunk });
        messages.push({ role: "user", content: "Continue exatamente de onde você parou. Não repita o conteúdo já gerado." });
      }
      if (lastFinishReason === "length") {
        console.log("⚠️ DeepSeek: relatório ainda truncado após 4 chamadas (finish_reason=length)")
      }

    } else {
      throw new Error(`Modelo não suportado: ${model}`);
    }

    if (!aiResponse) throw new Error("Resposta vazia da IA");
    return aiResponse;
}
