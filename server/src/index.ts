import express from "express";
import cors from "cors";
import axios from "axios";
import { playwrightManager, type BrowserAction } from "./playwright-manager.js";
import { connectDatabase } from "./db.js";
import { router as pipelineRouter } from "./routes/pipeline.js";
import { Product, type Supplier } from "./models/product.js";
import { parseSuppliersFromReport } from "./parse-suppliers.js";

const app = express();
const PORT = 3210;

// In-memory API keys store (set via /api/keys)
const apiKeys: Record<string, string> = {};

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
    const { prompt, model, pageContent, screenshot } = req.body as {
      prompt: string;
      model: string;
      pageContent?: string;
      screenshot?: string;
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

    } else if (model === "deepseek") {
      const key = apiKeys.deepseek;
      if (!key) throw new Error("Chave DeepSeek não configurada. Configure em Settings.");

      const r = await axios.post("https://api.deepseek.com/chat/completions", {
        model: "deepseek-chat",
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

    // Auto-inserir produto na esteira se a análise contém dados de viabilidade
    let pipelineProductId = null;
    try {
      const hasViabilityData = /score\s*final|demanda|concorr[eê]ncia|margem|vendas\s*(mensais|por\s*dia)/i.test(aiResponse)
      if (hasViabilityData && content) {
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
        const productUrl = urlMatch?.[1]?.trim() || ""

        if (productUrl) {
          const lastProduct = await Product.findOne({ stage: "triagem" }).sort({ order: -1 })
          const order = lastProduct ? lastProduct.order + 1 : 0

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
    const suppliers = parsed.map(s => ({ ...s, capturedAt: new Date() }))

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

// Registrar rotas de suppliers no pipeline router
pipelineRouter.post("/:id/suppliers", handleCaptureSuppliers)
pipelineRouter.delete("/:id/suppliers/:index", handleDeleteSupplier)

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
