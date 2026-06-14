import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

import express from "express";
import cors from "cors";
import axios from "axios";
import { playwrightManager, type BrowserAction } from "./playwright-manager.js";
import { connectDatabase } from "./db.js";
import { router as pipelineRouter } from "./routes/pipeline.js";
import { Product, NEGOTIATION_STATUSES, type Supplier, type NegotiationStatus } from "./models/product.js";
import { Comparison } from "./models/comparison.js";
import { parseSuppliersFromReport, parseIndividualSupplierReport, parseKitItemsFromReport } from "./parse-suppliers.js";

const app = express();
const PORT = Number(process.env.PORT) || 3210;

// In-memory API keys store (loaded from .env, can be overridden via /api/keys)
const apiKeys: Record<string, string> = {};

// Pré-carrega API keys do .env (se definidas)
if (process.env.GEMINI_API_KEY) apiKeys.gemini = process.env.GEMINI_API_KEY;
if (process.env.OPENAI_API_KEY) apiKeys.openai = process.env.OPENAI_API_KEY;
if (process.env.ANTHROPIC_API_KEY) apiKeys.anthropic = process.env.ANTHROPIC_API_KEY;
if (process.env.DEEPSEEK_API_KEY) apiKeys.deepseek = process.env.DEEPSEEK_API_KEY;

// AvantPro configuration
const AVANTPRO_CONFIG = {
  extensionId: "jdefnfmbnchmnjkcknaadaddgjbgephh",
  apiBase: "https://prod-ml.avantprocloud.com.br",
  productCode: "avantpro-ml",
};

app.use(cors({ origin: "*" }));
app.use(express.json({ limit: "10mb" }));

// Pipeline routes
app.use("/api/pipeline", pipelineRouter);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "browsermind-playwright" });
});

// Get browser status
app.get("/status", async (_req, res) => {
  try {
    const status = await playwrightManager.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// Launch browser
app.post("/launch", async (req, res) => {
  try {
    const { headless = false, extensionPaths = [], userDataDir } = req.body || {};
    await playwrightManager.launch(headless, extensionPaths, userDataDir);
    const mode = extensionPaths.length > 0 ? " (with extensions)" : "";
    res.json({ success: true, message: `Browser launched${mode}` });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Close browser
app.post("/close", async (_req, res) => {
  try {
    await playwrightManager.close();
    res.json({ success: true, message: "Browser closed" });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Navigate to URL
app.post("/navigate", async (req, res) => {
  try {
    const { url } = req.body;
    if (!url || typeof url !== "string") {
      res.status(400).json({ success: false, error: "URL is required" });
      return;
    }
    await playwrightManager.navigate(url);
    const title = await playwrightManager.getTitle();
    const currentUrl = await playwrightManager.getCurrentUrl();
    res.json({ success: true, url: currentUrl, title });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Take screenshot
app.get("/screenshot", async (_req, res) => {
  try {
    const screenshot = await playwrightManager.takeScreenshot();
    res.json({ success: true, screenshot });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Extract page content
app.get("/extract", async (_req, res) => {
  try {
    const content = await playwrightManager.extractPageContent();
    res.json({ success: true, data: content });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Execute single action
app.post("/action", async (req, res) => {
  try {
    const action = req.body as BrowserAction;
    if (!action || !action.type) {
      res.status(400).json({ success: false, error: "Action is required" });
      return;
    }
    const result = await playwrightManager.executeAction(action);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Execute multiple actions
app.post("/actions", async (req, res) => {
  try {
    const { actions } = req.body as { actions: BrowserAction[] };
    if (!Array.isArray(actions) || actions.length === 0) {
      res.status(400).json({ success: false, error: "Actions array is required" });
      return;
    }
    const results = await playwrightManager.executeActions(actions);
    res.json({ success: true, results });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// List all open pages/tabs
app.get("/pages", async (_req, res) => {
  try {
    const pages = await playwrightManager.listPages();
    res.json({ success: true, pages });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Switch to a specific page/tab
app.post("/pages/switch", async (req, res) => {
  try {
    const { index } = req.body as { index: number };
    await playwrightManager.switchToPage(index);
    res.json({ success: true, message: `Switched to page ${index}` });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

app.post("/extension/eval", async (req, res) => {
  try {
    const { extensionId, expression } = req.body as { extensionId: string; expression: string };
    const result = await playwrightManager.evaluateInServiceWorker(extensionId, expression);
    res.json({ success: true, result });
  } catch (error) {
    res.status(500).json({ success: false, error: String(error) });
  }
});

// AvantPro: authenticate and inject token into extension
app.post("/avantpro/auth", async (req, res) => {
  try {
    const { email } = req.body as { email: string };
    if (!email || typeof email !== "string") {
      res.status(400).json({ success: false, error: "Email é obrigatório" });
      return;
    }

    // Call AvantPro login API
    const loginRes = await axios.post(`${AVANTPRO_CONFIG.apiBase}/auth/login`, { email });
    const { token, user } = loginRes.data as {
      token: string;
      user: { planCode: string; productCode: string; email: string; globalUserId: string };
    };

    if (!token) {
      res.status(401).json({ success: false, error: "Email não encontrado no AvantPro" });
      return;
    }

    // Inject token into extension's chrome.storage.local via service worker
    const authData = JSON.stringify({
      version: 2,
      accessToken: token,
      loginAt: Date.now(),
      productCode: user.productCode || AVANTPRO_CONFIG.productCode,
      plan: user.planCode,
      email: user.email,
      globalUserId: user.globalUserId,
    });

    await playwrightManager.evaluateInServiceWorker(
      AVANTPRO_CONFIG.extensionId,
      `chrome.storage.local.set({ avantpro_auth: ${authData} }).then(() => "ok")`
    );

    res.json({
      success: true,
      user: { email: user.email, plan: user.planCode },
      message: `Autenticado como ${user.email} (plano: ${user.planCode})`,
    });
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.message || error.message
      : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

// AvantPro: check current auth status
app.get("/avantpro/status", async (_req, res) => {
  try {
    const result = await playwrightManager.evaluateInServiceWorker(
      AVANTPRO_CONFIG.extensionId,
      `chrome.storage.local.get("avantpro_auth").then(d => JSON.stringify(d.avantpro_auth || null))`
    );
    const auth = JSON.parse(result);
    if (auth?.accessToken) {
      res.json({ success: true, authenticated: true, email: auth.email, plan: auth.plan });
    } else {
      res.json({ success: true, authenticated: false });
    }
  } catch {
    res.json({ success: true, authenticated: false, error: "Extension not available" });
  }
});

// ==========================================
// AI Proxy - keeps API keys on server side
// ==========================================

app.post("/api/keys", (req, res) => {
  const { keys } = req.body as { keys: Record<string, string> };
  if (!keys || typeof keys !== "object") {
    res.status(400).json({ success: false, error: "Keys object is required" });
    return;
  }
  Object.assign(apiKeys, keys);
  res.json({ success: true, configured: Object.keys(apiKeys).filter((k) => apiKeys[k]) });
});

app.get("/api/keys", (_req, res) => {
  const configured = Object.entries(apiKeys)
    .filter(([, v]) => !!v)
    .map(([k]) => k);
  res.json({ configured });
});

// Retorna configurações públicas do server (modelo padrão, etc.)
app.get("/api/config", (_req, res) => {
  res.json({
    defaultModel: process.env.DEFAULT_MODEL || "gemini-flash-2.5",
  });
});

const SYSTEM_PROMPT = `Você é o BrowserMind AI, um assistente inteligente com capacidade de automação via Playwright.
Você recebe o conteúdo COMPLETO de uma página web extraído via DOM e deve analisar e responder ao prompt do usuário.

IMPORTANTE sobre o conteúdo recebido:
- O conteúdo que você recebe é extraído diretamente do DOM da página via JavaScript
- Isso INCLUI qualquer conteúdo injetado por extensões de navegador (como AvantPro, Niche Scout, etc.)
- Extensões adicionam elementos ao DOM da página, e esses elementos SÃO capturados na extração
- Portanto, se o conteúdo contiver dados de extensões (métricas, vendas, estoque, conversão, etc.), você DEVE usá-los para responder ao usuário
- NUNCA diga que não pode acessar dados de extensões — os dados já estão incluídos no conteúdo extraído

Diretrizes:
- Responda de forma clara, objetiva e em Markdown
- Extraia e organize TODAS as informações relevantes do conteúdo fornecido, incluindo dados de extensões
- Só gere ações JSON quando o usuário explicitamente pedir para EXECUTAR algo (clicar, navegar, digitar, etc.)
- Formato de ações (APENAS quando necessário executar algo):
  {"actions": [{"type": "click|type|scroll|navigate|select|wait|extract|screenshot|hover|goBack|goForward|evaluate", "selector": "CSS selector", "value": "valor opcional", "description": "descrição da ação"}]}
- Use APENAS seletores CSS válidos (ex: "h1", ".class", "#id", "a[href*='text']")
- NUNCA use :has-text(), :text(), ou qualquer pseudo-seletor não-CSS — eles NÃO funcionam
- Para clicar por texto, use o texto visível como selector (sem aspas nem pseudo-seletores)
- Para extrair texto de um elemento, use "extract" com selector CSS (ex: selector: "h1", selector: ".price", selector: "#title")
- Para obter a URL atual, título ou executar JavaScript, use "evaluate" com value contendo a expressão JS
- NUNCA use expressões JavaScript como document.URL, window.location etc. como selector — use "evaluate" em vez disso
- Se não puder executar uma ação, explique o motivo`;

app.post("/api/analyze", async (req, res) => {
  try {
    const { prompt, model, pageContent, screenshot, templateId } = req.body as {
      prompt: string;
      model: string;
      pageContent?: string;
      screenshot?: string;
      templateId?: string;
    };

    if (!prompt) {
      res.status(400).json({ success: false, error: "Prompt is required" });
      return;
    }

    // Auto-extract from Playwright if no content provided
    let content = pageContent || "";
    if (!content) {
      try {
        const status = await playwrightManager.getStatus();
        if (status.active) {
          // Aguarda dados do AvantPro carregarem (se extensão presente)
          let avantproResult = await playwrightManager.waitForAvantproData({ timeout: 20000 })

          // Se extensão não está autenticada, tenta re-autenticar automaticamente
          if (avantproResult === "not_authenticated") {
            console.log("🔄 AvantPro: tentando re-autenticação automática...")
            try {
              // Busca email salvo no chrome.storage da extensão
              const storedAuth = await playwrightManager.evaluateInServiceWorker(
                AVANTPRO_CONFIG.extensionId,
                `chrome.storage.local.get("avantpro_auth").then(d => JSON.stringify(d.avantpro_auth || null))`
              )
              const authData = JSON.parse(storedAuth)
              const email = authData?.email

              if (email) {
                // Re-autentica com o email salvo
                const loginRes = await axios.post(`${AVANTPRO_CONFIG.apiBase}/auth/login`, { email })
                const { token, user } = loginRes.data as {
                  token: string
                  user: { planCode: string; productCode: string; email: string; globalUserId: string }
                }

                if (token) {
                  const newAuthData = JSON.stringify({
                    version: 2,
                    accessToken: token,
                    loginAt: Date.now(),
                    productCode: user.productCode || AVANTPRO_CONFIG.productCode,
                    plan: user.planCode,
                    email: user.email,
                    globalUserId: user.globalUserId,
                  })

                  await playwrightManager.evaluateInServiceWorker(
                    AVANTPRO_CONFIG.extensionId,
                    `chrome.storage.local.set({ avantpro_auth: ${newAuthData} }).then(() => "ok")`
                  )

                  console.log(`✅ AvantPro: re-autenticado como ${user.email}`)

                  // Recarrega a página para a extensão buscar dados com o novo token
                  const page = await playwrightManager.getPage()
                  await page.reload({ waitUntil: "domcontentloaded", timeout: 15000 })

                  // Tenta novamente aguardar os dados
                  avantproResult = await playwrightManager.waitForAvantproData({ timeout: 20000 })
                }
              }
            } catch (authErr) {
              console.log("⚠️ AvantPro: falha na re-autenticação:", authErr instanceof Error ? authErr.message : authErr)
            }
          }

          const extracted = await playwrightManager.extractPageContent();
          content = [
            `URL: ${extracted.url}`,
            `Title: ${extracted.title}`,
            `\nHeadings:\n${extracted.headings.join("\n")}`,
            Object.keys(extracted.metaTags).length > 0
              ? `\nMeta:\n${Object.entries(extracted.metaTags).map(([k, v]) => `${k}: ${v}`).join("\n")}`
              : "",
            extracted.links.length > 0
              ? `\nLinks:\n${extracted.links.map(l => `[${l.text}](${l.href})`).join("\n")}`
              : "",
            `\nContent:\n${extracted.visibleText}`,
          ].filter(Boolean).join("\n");
        }
      } catch { /* ignore */ }
    }

    const userMessage = content
      ? `Conteúdo da página:\n${content.slice(0, 30000)}\n\nPrompt: ${prompt}`
      : prompt;

    let aiResponse: string;

    if (model === "gemini-flash-2.5" || model === "gemini-pro-2.5" || model === "gemini-flash-3" || model === "gemini-pro-3.1") {
      const geminiModelMap: Record<string, string> = {
        "gemini-flash-2.5": "gemini-2.5-flash",
        "gemini-pro-2.5": "gemini-2.5-pro",
        "gemini-flash-3": "gemini-3-flash-preview",
        "gemini-pro-3.1": "gemini-3.1-pro-preview",
      };
      const geminiModel = geminiModelMap[model];
      const key = apiKeys.gemini;
      if (!key) throw new Error("Chave Gemini não configurada. Configure em Settings.");

      const parts: Array<Record<string, unknown>> = [
        { text: SYSTEM_PROMPT },
        { text: userMessage },
      ];
      if (screenshot) {
        parts.push({ inline_data: { mime_type: "image/png", data: screenshot } });
      }

      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
        { contents: [{ parts }], generationConfig: { temperature: 0.7, maxOutputTokens: 16384 } }
      );
      aiResponse = r.data.candidates?.[0]?.content?.parts?.[0]?.text || "";

    } else if (model === "gpt-4.1") {
      const key = apiKeys.openai;
      if (!key) throw new Error("Chave OpenAI não configurada. Configure em Settings.");

      const msgContent: Array<Record<string, unknown>> = [{ type: "text", text: userMessage }];
      if (screenshot) {
        msgContent.push({ type: "image_url", image_url: { url: `data:image/png;base64,${screenshot}` } });
      }

      const r = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4.1",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: msgContent },
        ],
        max_tokens: 16384,
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` } });
      aiResponse = r.data.choices?.[0]?.message?.content || "";

    } else if (model === "claude-sonnet") {
      const key = apiKeys.anthropic;
      if (!key) throw new Error("Chave Anthropic não configurada. Configure em Settings.");

      const msgContent: Array<Record<string, unknown>> = [];
      if (screenshot) {
        msgContent.push({ type: "image", source: { type: "base64", media_type: "image/png", data: screenshot } });
      }
      msgContent.push({ type: "text", text: userMessage });

      const r = await axios.post("https://api.anthropic.com/v1/messages", {
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: msgContent }],
      }, { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } });
      aiResponse = r.data.content?.[0]?.text || "";

    } else if (model === "deepseek-flash" || model === "deepseek-pro") {
      const key = apiKeys.deepseek;
      if (!key) throw new Error("Chave DeepSeek não configurada. Configure em Settings.");
      const deepseekModel = model === "deepseek-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash";

      const r = await axios.post("https://api.deepseek.com/chat/completions", {
        model: deepseekModel,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 16384,
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` } });
      aiResponse = r.data.choices?.[0]?.message?.content || "";

    } else {
      throw new Error(`Modelo não suportado: ${model}`);
    }

    if (!aiResponse) throw new Error("Resposta vazia da IA");

    // Parse actions from response
    let actions = null;
    try {
      const jsonMatch = aiResponse.match(/\{[\s\S]*"actions"\s*:\s*\[[\s\S]*\][\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (Array.isArray(parsed.actions) && parsed.actions.length > 0) {
          actions = parsed.actions;
        }
      }
    } catch { /* ignore */ }

    // Auto-inserir produto na esteira apenas para o template "importação simplificada"
    let pipelineProductId = null;
    try {
      if (templateId === "importacao-simplificada" && content) {
        const titleMatch = aiResponse.match(/(?:Nome|Produto\/Nicho|Título)\s*:\s*(.+)/im)
        const priceMatch = aiResponse.match(/(?:Preço|preço\s*atual)\s*:\s*R?\$?\s*([\d.,]+)/im)
        const scoreMatch = aiResponse.match(/(?:Demanda|Score\s*Final)\s*:\s*(\d+(?:[.,]\d+)?)/im)
        const salesMatch = aiResponse.match(/Vendas\s*mensais[^:]*:\s*([\d.,]+)/im)
        const competitionMatch = aiResponse.match(/(?:Concorrência|Nível.*concorrência)\s*:\s*(Baixa|Média|Alta|Saturado)/im)
        const marginMatch = aiResponse.match(/(?:Margem|Potencial\s*de\s*margem)\s*:\s*(.+)/im)
        const categoryMatch = aiResponse.match(/Categoria\s*:\s*(.+)/im)
        const imageMatch = content.match(/og:image"\s*content="([^"]+)"/i) || content.match(/(https?:\/\/[^\s"]+\.(?:jpg|jpeg|png|webp))/i)

        const urlMatch = content.match(/^URL:\s*(.+)/m)
        const pageTitleMatch = content.match(/^Title:\s*(.+)/m)

        const productTitle = titleMatch?.[1]?.trim() || pageTitleMatch?.[1]?.trim() || "Produto analisado"
        const productUrl = urlMatch?.[1]?.trim().replace(/`/g, "").trim() || ""

        if (productUrl) {
          const lastProduct = await Product.findOne({ stage: "triagem" }).sort({ order: -1 })
          const order = lastProduct ? lastProduct.order + 1 : 0

          // Detecta se é um kit pelo título ou relatório
          const isKit = /\bkit\b/i.test(productTitle) || /\bkit\b/i.test(aiResponse)
          const kitItems = isKit ? parseKitItemsFromReport(aiResponse) : []

          const product = await Product.create({
            title: productTitle.slice(0, 200),
            url: productUrl,
            imageUrl: imageMatch?.[1] || "",
            price: parseFloat(priceMatch?.[1]?.replace(".", "").replace(",", ".") || "0"),
            category: categoryMatch?.[1]?.trim().slice(0, 100) || "",
            stage: "triagem",
            score: parseFloat(scoreMatch?.[1]?.replace(",", ".") || "0"),
            monthlySales: parseInt(salesMatch?.[1]?.replace(/\./g, "").replace(",", ".") || "0"),
            competitionLevel: competitionMatch?.[1] || "Média",
            potentialMargin: marginMatch?.[1]?.trim().slice(0, 100) || "",
            analysisReport: aiResponse,
            analyzedAt: new Date(),
            order,
            isKit,
            kitItems,
          })
          pipelineProductId = product._id
        }
      }
    } catch (pipelineErr) {
      console.log("⚠️ Pipeline: erro ao salvar produto:", pipelineErr instanceof Error ? pipelineErr.message : pipelineErr)
    }

    res.json({ success: true, response: aiResponse, actions, pipelineProductId });
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error instanceof Error ? error.message : String(error);
    res.status(500).json({ success: false, error: msg });
  }
});

// ==========================================
// Suppliers — Captura fornecedores da página atual do Playwright
// ==========================================

const handleCaptureSuppliers: import("express").RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" })
      return
    }

    const { report } = req.body || {}

    if (!report || typeof report !== "string") {
      res.status(400).json({ error: "Campo 'report' (relatório markdown) é obrigatório" })
      return
    }

    // Parsear fornecedores do relatório markdown
    const parsed = parseSuppliersFromReport(report)
    const suppliers = parsed.map(s => ({
      ...s,
      url: s.url.replace(/`/g, "").trim(),
      capturedAt: new Date(),
    }))

    // Append ao array existente (não sobrescreve)
    product.suppliers.push(...suppliers)
    // Salvar relatório de fornecedores
    product.set("supplierReport", report)
    await product.save()

    res.json({ success: true, suppliers: product.suppliers, supplierReport: report })
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: msg })
  }
}

const handleDeleteSupplier: import("express").RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" })
      return
    }

    const index = parseInt(req.params.index as string)
    if (isNaN(index) || index < 0 || index >= product.suppliers.length) {
      res.status(400).json({ error: "Índice inválido" })
      return
    }

    product.suppliers.splice(index, 1)
    await product.save()

    res.json({ success: true, suppliers: product.suppliers })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}

// ==========================================
// Suppliers — Atualizar status de negociação
// ==========================================

const handleUpdateSupplierStatus: import("express").RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" })
      return
    }

    const index = parseInt(req.params.index as string)
    if (isNaN(index) || index < 0 || index >= product.suppliers.length) {
      res.status(400).json({ error: "Índice inválido" })
      return
    }

    const { status } = req.body || {}
    if (!status || !NEGOTIATION_STATUSES.includes(status)) {
      res.status(400).json({ error: `Status inválido. Valores aceitos: ${NEGOTIATION_STATUSES.join(", ")}` })
      return
    }

    product.suppliers[index].negotiationStatus = status as NegotiationStatus
    if (status !== "aguardando_resposta" && !product.suppliers[index].negotiationStartedAt) {
      product.suppliers[index].negotiationStartedAt = new Date()
    }
    product.markModified("suppliers")
    await product.save()

    res.json({ success: true, suppliers: product.suppliers })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}

// ==========================================
// Suppliers — Adicionar cotação
// ==========================================

const handleAddSupplierQuote: import("express").RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" })
      return
    }

    const index = parseInt(req.params.index as string)
    if (isNaN(index) || index < 0 || index >= product.suppliers.length) {
      res.status(400).json({ error: "Índice inválido" })
      return
    }

    const { unitPrice, moq, totalProductCost, totalShippingCost, deliveryTime, paymentTerms, notes } = req.body || {}

    const quote = {
      unitPrice: unitPrice || "",
      moq: moq || "",
      totalProductCost: totalProductCost || "",
      totalShippingCost: totalShippingCost || "",
      deliveryTime: deliveryTime || "",
      paymentTerms: paymentTerms || "",
      notes: notes || "",
      quotedAt: new Date(),
    }

    product.suppliers[index].quotes.push(quote)
    product.suppliers[index].lastContactAt = new Date()

    // Auto-mudar status se ainda está aguardando
    if (product.suppliers[index].negotiationStatus === "aguardando_resposta") {
      product.suppliers[index].negotiationStatus = "cotacao_recebida"
    }
    if (!product.suppliers[index].negotiationStartedAt) {
      product.suppliers[index].negotiationStartedAt = new Date()
    }

    product.markModified("suppliers")
    await product.save()

    res.json({ success: true, suppliers: product.suppliers })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}

// ==========================================
// Suppliers — Remover cotação
// ==========================================

const handleRemoveSupplierQuote: import("express").RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" })
      return
    }

    const index = parseInt(req.params.index as string)
    if (isNaN(index) || index < 0 || index >= product.suppliers.length) {
      res.status(400).json({ error: "Índice de fornecedor inválido" })
      return
    }

    const quoteIndex = parseInt(req.params.quoteIndex as string)
    if (isNaN(quoteIndex) || quoteIndex < 0 || quoteIndex >= product.suppliers[index].quotes.length) {
      res.status(400).json({ error: "Índice de cotação inválido" })
      return
    }

    product.suppliers[index].quotes.splice(quoteIndex, 1)
    product.markModified("suppliers")
    await product.save()

    res.json({ success: true, suppliers: product.suppliers })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}

// ==========================================
// Suppliers — Editar cotação
// ==========================================

const handleEditSupplierQuote: import("express").RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" })
      return
    }

    const index = parseInt(req.params.index as string)
    if (isNaN(index) || index < 0 || index >= product.suppliers.length) {
      res.status(400).json({ error: "Índice de fornecedor inválido" })
      return
    }

    const quoteIndex = parseInt(req.params.quoteIndex as string)
    if (isNaN(quoteIndex) || quoteIndex < 0 || quoteIndex >= product.suppliers[index].quotes.length) {
      res.status(400).json({ error: "Índice de cotação inválido" })
      return
    }

    const { unitPrice, moq, totalProductCost, totalShippingCost, deliveryTime, paymentTerms, notes } = req.body || {}
    const quote = product.suppliers[index].quotes[quoteIndex]

    if (unitPrice !== undefined) quote.unitPrice = unitPrice
    if (moq !== undefined) quote.moq = moq
    if (totalProductCost !== undefined) quote.totalProductCost = totalProductCost
    if (totalShippingCost !== undefined) quote.totalShippingCost = totalShippingCost
    if (deliveryTime !== undefined) quote.deliveryTime = deliveryTime
    if (paymentTerms !== undefined) quote.paymentTerms = paymentTerms
    if (notes !== undefined) quote.notes = notes

    product.markModified("suppliers")
    await product.save()

    res.json({ success: true, suppliers: product.suppliers })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}

// ==========================================
// Compare — Compara produtos da triagem e sugere top 3
// ==========================================

const COMPARE_SYSTEM_PROMPT = `Você é um analista especializado em importação simplificada de produtos para revenda no Mercado Livre.
Sua tarefa é comparar múltiplos produtos e gerar um ranking dos TOP 3 mais promissores para importação.

Critérios de avaliação (use seu julgamento livre com base nos dados fornecidos):
- Score de demanda (0-10)
- Volume de vendas mensais
- Nível de concorrência (menor = melhor)
- Margem potencial
- Escalabilidade e facilidade operacional
- Potencial de diferenciação

IMPORTANTE: Sua resposta DEVE conter um bloco JSON delimitado por \`\`\`json ... \`\`\` com o ranking estruturado.
O JSON deve ter o formato:
{
  "ranking": [
    { "productId": "ID_DO_PRODUTO", "position": 1, "reason": "Motivo resumido" },
    { "productId": "ID_DO_PRODUTO", "position": 2, "reason": "Motivo resumido" },
    { "productId": "ID_DO_PRODUTO", "position": 3, "reason": "Motivo resumido" }
  ]
}

Após o bloco JSON, inclua um relatório em Markdown com:
1. Tabela comparativa de todos os produtos (métricas lado a lado)
2. Análise detalhada de cada produto do top 3 (pontos fortes e fracos)
3. Recomendação final explicando por que esses 3 se destacam`

const COMPARE_ANALISE_SYSTEM_PROMPT = `Você é um analista especializado em importação simplificada de produtos para revenda no Mercado Livre.
Sua tarefa é comparar produtos que já passaram pela triagem inicial e estão EM ANÁLISE, decidindo quais TOP 3 devem ser APROVADOS para importação real.

Neste estágio os produtos já têm dados de fornecedores do Alibaba. Sua análise deve focar em:
- **Margem real**: preço de venda (ML) vs custo unitário (Alibaba) + frete + impostos (~60% sobre custo)
- **Viabilidade do MOQ**: O pedido mínimo é compatível com um primeiro teste?
- **Confiabilidade do fornecedor**: rating, anos, Trade Assurance, taxa de resposta
- **Risco operacional**: produto frágil? Certificações necessárias? Problemas alfandegários?
- **Potencial de escala**: Se o teste der certo, dá para crescer?

IMPORTANTE: Sua resposta DEVE conter um bloco JSON delimitado por \`\`\`json ... \`\`\` com o ranking estruturado.
O JSON deve ter o formato:
{
  "ranking": [
    { "productId": "ID_DO_PRODUTO", "position": 1, "reason": "Motivo resumido" },
    { "productId": "ID_DO_PRODUTO", "position": 2, "reason": "Motivo resumido" },
    { "productId": "ID_DO_PRODUTO", "position": 3, "reason": "Motivo resumido" }
  ]
}

Após o bloco JSON, inclua um relatório em Markdown com:
1. Tabela comparativa incluindo custo estimado, margem bruta e risco
2. Análise detalhada de cada top 3 (viabilidade financeira e operacional)
3. Recomendação final com justificativa para aprovação`

const handleCompareProducts: import("express").RequestHandler = async (req, res) => {
  try {
    const { model, stage = "triagem", forceRefresh = false } = req.body as {
      model: string
      stage?: "triagem" | "analise"
      forceRefresh?: boolean
    }

    if (!model) {
      res.status(400).json({ error: "Campo 'model' é obrigatório" })
      return
    }

    if (stage !== "triagem" && stage !== "analise") {
      res.status(400).json({ error: "Stage deve ser 'triagem' ou 'analise'" })
      return
    }

    // Busca todos os produtos no stage solicitado
    const products = await Product.find({ stage }).sort({ order: 1 })

    if (products.length < 3) {
      const stageLabel = stage === "triagem" ? "triagem" : "em análise"
      res.status(400).json({ error: `É necessário pelo menos 3 produtos ${stageLabel} para comparar (encontrados: ${products.length})` })
      return
    }

    // Monta prompt com dados dos produtos (limita a 15 para não estourar tokens)
    const productsToCompare = products.slice(0, 15)

    // Gerar hash dos IDs para verificar se a composição mudou
    const productIds = productsToCompare.map(p => String(p._id)).sort()
    const crypto = await import("crypto")
    const productHash = crypto.createHash("md5").update(productIds.join(",")).digest("hex")

    // Verificar cache (se não forçou refresh)
    if (!forceRefresh) {
      const cached = await Comparison.findOne({ stage, productHash }).sort({ createdAt: -1 })
      if (cached) {
        res.json({
          success: true,
          comparison: {
            ranking: cached.ranking,
            report: cached.report,
            productsCompared: cached.productsCompared,
          },
          cached: true,
          cachedAt: cached.createdAt,
        })
        return
      }
    }

    let productsList: string
    if (stage === "analise") {
      // Inclui dados de fornecedores para decisão mais profunda
      productsList = productsToCompare.map((p, i) => {
        const supplierInfo = p.suppliers.length > 0
          ? p.suppliers.map((s, si) => `  - Fornecedor ${si + 1}: ${s.name} | Preço: ${s.unitPrice} | MOQ: ${s.moq} | Rating: ${s.rating}★ | ${s.yearsInBusiness} anos | Trade Assurance: ${s.tradeAssurance ? "Sim" : "Não"} | Resposta: ${s.responseRate}`).join("\n")
          : "  - Nenhum fornecedor capturado"

        return `
### Produto ${i + 1} (ID: ${p._id})
- **Título:** ${p.title}
- **Preço de venda (ML):** R$ ${p.price.toFixed(2).replace(".", ",")}
- **Score:** ${p.score}/10
- **Vendas mensais:** ${p.monthlySales}
- **Concorrência:** ${p.competitionLevel}
- **Margem potencial estimada:** ${p.potentialMargin || "Não informada"}
- **Categoria:** ${p.category || "Não informada"}
- **Fornecedores:**
${supplierInfo}
`
      }).join("\n")
    } else {
      productsList = productsToCompare.map((p, i) => `
### Produto ${i + 1} (ID: ${p._id})
- **Título:** ${p.title}
- **Preço:** R$ ${p.price.toFixed(2).replace(".", ",")}
- **Score:** ${p.score}/10
- **Vendas mensais:** ${p.monthlySales}
- **Concorrência:** ${p.competitionLevel}
- **Margem potencial:** ${p.potentialMargin || "Não informada"}
- **Categoria:** ${p.category || "Não informada"}
`).join("\n")
    }

    const actionLabel = stage === "analise"
      ? "aprovação para importação"
      : "importação simplificada"
    const userMessage = `Compare os ${productsToCompare.length} produtos abaixo e selecione os TOP 3 mais promissores para ${actionLabel}:\n${productsList}`

    const systemPrompt = stage === "analise" ? COMPARE_ANALISE_SYSTEM_PROMPT : COMPARE_SYSTEM_PROMPT

    // Chama IA usando a mesma lógica do /api/analyze
    let aiResponse: string

    if (model === "gemini-flash-2.5" || model === "gemini-pro-2.5" || model === "gemini-flash-3" || model === "gemini-pro-3.1") {
      const geminiModelMap: Record<string, string> = {
        "gemini-flash-2.5": "gemini-2.5-flash",
        "gemini-pro-2.5": "gemini-2.5-pro",
        "gemini-flash-3": "gemini-3-flash-preview",
        "gemini-pro-3.1": "gemini-3.1-pro-preview",
      }
      const geminiModel = geminiModelMap[model]
      const key = apiKeys.gemini
      if (!key) throw new Error("Chave Gemini não configurada. Configure em Settings.")

      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: systemPrompt }, { text: userMessage }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
        }
      )
      aiResponse = r.data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    } else if (model === "gpt-4.1") {
      const key = apiKeys.openai
      if (!key) throw new Error("Chave OpenAI não configurada. Configure em Settings.")

      const r = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4.1",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 8192,
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` } })
      aiResponse = r.data.choices?.[0]?.message?.content || ""

    } else if (model === "claude-sonnet") {
      const key = apiKeys.anthropic
      if (!key) throw new Error("Chave Anthropic não configurada. Configure em Settings.")

      const r = await axios.post("https://api.anthropic.com/v1/messages", {
        model: "claude-sonnet-4-20250514",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userMessage }],
      }, { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } })
      aiResponse = r.data.content?.[0]?.text || ""

    } else if (model === "deepseek-flash" || model === "deepseek-pro") {
      const key = apiKeys.deepseek
      if (!key) throw new Error("Chave DeepSeek não configurada. Configure em Settings.")
      const deepseekModel = model === "deepseek-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash"

      const r = await axios.post("https://api.deepseek.com/chat/completions", {
        model: deepseekModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 8192,
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` } })
      aiResponse = r.data.choices?.[0]?.message?.content || ""

    } else {
      throw new Error(`Modelo não suportado: ${model}`)
    }

    if (!aiResponse) throw new Error("Resposta vazia da IA")

    // Parsear ranking do JSON na resposta
    let ranking: Array<{ productId: string; position: number; reason: string }> = []
    try {
      const jsonMatch = aiResponse.match(/```json\s*([\s\S]*?)```/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1])
        if (Array.isArray(parsed.ranking)) {
          // Validar que os IDs existem nos produtos comparados
          const validIds = new Set(productsToCompare.map(p => String(p._id)))
          ranking = parsed.ranking
            .filter((r: { productId: string }) => validIds.has(r.productId))
            .slice(0, 3)
        }
      }
    } catch { /* parsing falhou, ranking fica vazio */ }

    // Remover bloco JSON do relatório para exibição limpa
    const report = aiResponse.replace(/```json\s*[\s\S]*?```\n?/, "").trim()

    // Salvar no cache (substituir anterior do mesmo stage+hash)
    await Comparison.findOneAndUpdate(
      { stage, productHash },
      { stage, productIds, productHash, ranking, report, productsCompared: productsToCompare.length, model },
      { upsert: true, new: true }
    )

    res.json({
      success: true,
      comparison: {
        ranking,
        report,
        productsCompared: productsToCompare.length,
      },
      cached: false,
    })
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error instanceof Error ? error.message : String(error)
    res.status(500).json({ error: msg })
  }
}

// ==========================================
// Supplier Analysis — Análise individual de fornecedor via URL
// ==========================================

const SUPPLIER_ANALYSIS_PROMPT = `Você é um analista especializado em importação da China via Alibaba.
Sua tarefa é analisar em detalhe um fornecedor específico com base no conteúdo da página dele no Alibaba.

Gere um relatório completo em Markdown com as seguintes seções:

## 📋 Dados Básicos

- Nome da empresa:
- País/Região:
- Anos de operação:
- Verified Supplier: Sim/Não
- Trade Assurance: valor protegido (se disponível)
- Funcionários: (número, se disponível)
- Área da fábrica: (se disponível)
- Principais mercados de exportação:

## ⭐ Reputação e Confiabilidade

- Rating geral: X/5
- Reviews de compradores: (quantidade e resumo dos comentários)
- Taxa de resposta:
- Tempo médio de resposta:
- On-time delivery rate:
- Disputas/reclamações: (se visível)
- Nível de confiança geral: (Baixo / Médio / Alto / Muito Alto)

## 📦 Produtos e Preços

Para cada produto listado (até 10 principais):
- Nome do produto
- Preço indicado (ou faixa de preço)
- MOQ (pedido mínimo)
- Capacidade de produção
- Certificações do produto (CE, ROHS, FCC, ISO, etc.)

## 🏭 Capacidades de Produção

- OEM disponível: Sim/Não
- ODM disponível: Sim/Não
- Customização: (detalhes)
- Capacidade produtiva mensal:
- Certificações da fábrica:
- Inspeções/auditorias: (se disponível)

## ⚠️ Pontos de Atenção

- Riscos identificados
- Red flags (se houver)
- Pontos fracos
- O que verificar antes de fechar negócio

## ✅ Conclusão

- Score geral do fornecedor: X/10
- Vale a pena negociar: Sim/Não
- Melhor para: (tipo de produto/situação)
- Recomendações de próximos passos
- Perguntas sugeridas para enviar ao fornecedor`

app.post("/api/supplier/analyze", async (req, res) => {
  try {
    const { url: rawUrl, model } = req.body as { url: string; model: string }
    const url = (rawUrl || "").replace(/`/g, "").trim()

    if (!url || typeof url !== "string") {
      res.status(400).json({ success: false, error: "URL do fornecedor é obrigatória" })
      return
    }

    if (!model || typeof model !== "string") {
      res.status(400).json({ success: false, error: "Modelo de IA é obrigatório" })
      return
    }

    // Validar que é uma URL do Alibaba
    const urlObj = new URL(url)
    if (!urlObj.hostname.includes("alibaba.com")) {
      res.status(400).json({ success: false, error: "URL deve ser do Alibaba (alibaba.com)" })
      return
    }

    // Navegar até a página do fornecedor e extrair conteúdo
    const status = await playwrightManager.getStatus()
    if (!status.active) {
      res.status(400).json({ success: false, error: "Browser não está ativo. Inicie o browser primeiro." })
      return
    }

    await playwrightManager.navigate(url)
    // Aguardar carregamento da página
    const page = await playwrightManager.getPage()
    await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {})

    const extracted = await playwrightManager.extractPageContent()
    const content = [
      `URL: ${extracted.url}`,
      `Title: ${extracted.title}`,
      `\nHeadings:\n${extracted.headings.join("\n")}`,
      Object.keys(extracted.metaTags).length > 0
        ? `\nMeta:\n${Object.entries(extracted.metaTags).map(([k, v]) => `${k}: ${v}`).join("\n")}`
        : "",
      extracted.links.length > 0
        ? `\nLinks:\n${extracted.links.map(l => `[${l.text}](${l.href})`).join("\n")}`
        : "",
      `\nContent:\n${extracted.visibleText}`,
    ].filter(Boolean).join("\n")

    const userMessage = `Conteúdo da página do fornecedor:\n${content.slice(0, 30000)}\n\nAnalise este fornecedor em detalhe.`

    // Chamar IA
    let aiResponse: string

    if (model === "gemini-flash-2.5" || model === "gemini-pro-2.5" || model === "gemini-flash-3" || model === "gemini-pro-3.1") {
      const geminiModelMap: Record<string, string> = {
        "gemini-flash-2.5": "gemini-2.5-flash",
        "gemini-pro-2.5": "gemini-2.5-pro",
        "gemini-flash-3": "gemini-3-flash-preview",
        "gemini-pro-3.1": "gemini-3.1-pro-preview",
      }
      const geminiModel = geminiModelMap[model]
      const key = apiKeys.gemini
      if (!key) throw new Error("Chave Gemini não configurada. Configure em Settings.")

      const r = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${key}`,
        {
          contents: [{ parts: [{ text: SUPPLIER_ANALYSIS_PROMPT }, { text: userMessage }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 16384 },
        }
      )
      aiResponse = r.data.candidates?.[0]?.content?.parts?.[0]?.text || ""

    } else if (model === "gpt-4.1") {
      const key = apiKeys.openai
      if (!key) throw new Error("Chave OpenAI não configurada. Configure em Settings.")

      const r = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4.1",
        messages: [
          { role: "system", content: SUPPLIER_ANALYSIS_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 16384,
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` } })
      aiResponse = r.data.choices?.[0]?.message?.content || ""

    } else if (model === "claude-sonnet") {
      const key = apiKeys.anthropic
      if (!key) throw new Error("Chave Anthropic não configurada. Configure em Settings.")

      const r = await axios.post("https://api.anthropic.com/v1/messages", {
        model: "claude-sonnet-4-20250514",
        max_tokens: 16384,
        system: SUPPLIER_ANALYSIS_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }, { headers: { "x-api-key": key, "anthropic-version": "2023-06-01" } })
      aiResponse = r.data.content?.[0]?.text || ""

    } else if (model === "deepseek-flash" || model === "deepseek-pro") {
      const key = apiKeys.deepseek
      if (!key) throw new Error("Chave DeepSeek não configurada. Configure em Settings.")
      const deepseekModel = model === "deepseek-pro" ? "deepseek-v4-pro" : "deepseek-v4-flash"

      const r = await axios.post("https://api.deepseek.com/chat/completions", {
        model: deepseekModel,
        messages: [
          { role: "system", content: SUPPLIER_ANALYSIS_PROMPT },
          { role: "user", content: userMessage },
        ],
        max_tokens: 16384,
        temperature: 0.7,
      }, { headers: { Authorization: `Bearer ${key}` } })
      aiResponse = r.data.choices?.[0]?.message?.content || ""

    } else {
      throw new Error(`Modelo não suportado: ${model}`)
    }

    if (!aiResponse) throw new Error("Resposta vazia da IA")

    res.json({
      success: true,
      report: aiResponse,
      supplierUrl: url,
      analyzedAt: new Date().toISOString(),
    })
  } catch (error) {
    const msg = axios.isAxiosError(error)
      ? error.response?.data?.error?.message || error.message
      : error instanceof Error ? error.message : String(error)
    res.status(500).json({ success: false, error: msg })
  }
})

// Vincular fornecedor individual (da análise individual) a um produto
const handleLinkSupplier: import("express").RequestHandler = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
    if (!product) {
      res.status(404).json({ error: "Produto não encontrado" })
      return
    }

    const { report, supplierUrl: rawSupplierUrl } = req.body || {}
    const supplierUrl = (rawSupplierUrl || "").replace(/`/g, "").trim()

    if (!report || typeof report !== "string") {
      res.status(400).json({ error: "Campo 'report' é obrigatório" })
      return
    }

    if (!supplierUrl || typeof supplierUrl !== "string") {
      res.status(400).json({ error: "Campo 'supplierUrl' é obrigatório" })
      return
    }

    const parsed = parseIndividualSupplierReport(report, supplierUrl)
    const supplier = { ...parsed, report, capturedAt: new Date() }

    product.suppliers.push(supplier as Supplier)
    await product.save()

    res.json({ success: true, suppliers: product.suppliers })
  } catch (error) {
    res.status(500).json({ error: String(error) })
  }
}

// Registrar rotas de suppliers e compare no pipeline router
pipelineRouter.post("/compare", handleCompareProducts)
pipelineRouter.post("/:id/suppliers", handleCaptureSuppliers)
pipelineRouter.post("/:id/suppliers/link", handleLinkSupplier)
pipelineRouter.delete("/:id/suppliers/:index", handleDeleteSupplier)
pipelineRouter.patch("/:id/suppliers/:index/status", handleUpdateSupplierStatus)
pipelineRouter.post("/:id/suppliers/:index/quotes", handleAddSupplierQuote)
pipelineRouter.delete("/:id/suppliers/:index/quotes/:quoteIndex", handleRemoveSupplierQuote)
pipelineRouter.patch("/:id/suppliers/:index/quotes/:quoteIndex", handleEditSupplierQuote)

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🔌 Shutting down...");
  await playwrightManager.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await playwrightManager.close();
  process.exit(0);
});

app.listen(PORT, async () => {
  await connectDatabase();
  const loadedKeys = Object.keys(apiKeys).filter(k => apiKeys[k]);
  if (loadedKeys.length > 0) {
    console.log(`🔑 API keys carregadas do .env: ${loadedKeys.join(", ")}`);
  }
  console.log(`🧠 BrowserMind Playwright Server running at http://localhost:${PORT}`);
  console.log(`📡 Endpoints:`);
  console.log(`   GET  /health      - Health check`);
  console.log(`   GET  /status      - Browser status`);
  console.log(`   POST /launch      - Launch browser`);
  console.log(`   POST /close       - Close browser`);
  console.log(`   POST /navigate    - Navigate to URL`);
  console.log(`   GET  /screenshot  - Take screenshot`);
  console.log(`   GET  /extract     - Extract page content`);
  console.log(`   POST /action      - Execute single action`);
  console.log(`   POST /actions     - Execute multiple actions`);
  console.log(`   POST /api/keys    - Set API keys`);
  console.log(`   GET  /api/keys    - Get configured keys`);
  console.log(`   POST /api/analyze - AI analyze (proxied)`);
});
