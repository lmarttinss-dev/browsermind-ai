import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import fs from "fs";

export interface BrowserAction {
  type: "click" | "type" | "scroll" | "navigate" | "select" | "wait" | "extract" | "screenshot" | "goBack" | "goForward" | "hover" | "evaluate";
  selector?: string;
  value?: string;
  description: string;
}

export interface ActionResult {
  success: boolean;
  action: BrowserAction;
  detail?: string;
  extractedData?: string;
  screenshot?: string;
}

export class PlaywrightManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private persistent = false;

  async launch(headless = false, extensionPaths: string[] = [], userDataDir?: string): Promise<void> {
    if (this.browser || this.context) return;

    const baseArgs = [
      "--disable-blink-features=AutomationControlled",
      "--no-sandbox",
    ];

    if (extensionPaths.length > 0) {
      // Extensions require persistent context and headed mode
      // Use Xvfb/WSLg display (DISPLAY env must be set)
      const extArgs = [
        ...baseArgs,
        `--disable-extensions-except=${extensionPaths.join(",")}`,
        ...extensionPaths.map((p) => `--load-extension=${p}`),
      ];

      const profileDir = userDataDir || `${process.env.HOME || '/tmp'}/.browsermind-profile`;
      if (!fs.existsSync(profileDir)) {
        fs.mkdirSync(profileDir, { recursive: true });
      }

      console.log("🧩 Launching with extensions:", extensionPaths);
      console.log("📂 Profile:", profileDir);
      console.log("🖥️  DISPLAY:", process.env.DISPLAY || "(not set)");

      this.context = await chromium.launchPersistentContext(
        profileDir,
        {
          headless: false, // extensions require headed mode
          args: extArgs,
          viewport: { width: 1280, height: 800 },
          userAgent:
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
          ignoreDefaultArgs: ["--disable-extensions"],
        }
      );
      this.persistent = true;

      // Suprime erros de portas desconectadas das extensões Chrome (crx-client-port.js)
      const suppressExtensionErrors = (page: Page) => {
        page.on("pageerror", (err) => {
          if (err.message.includes("disconnected port")) return
          console.error("Page error:", err.message)
        })
      }
      this.context.pages().forEach(suppressExtensionErrors)
      this.context.on("page", suppressExtensionErrors)

      this.page = this.context.pages()[0] || await this.context.newPage();
    } else {
      this.browser = await chromium.launch({
        headless,
        args: baseArgs,
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 800 },
        userAgent:
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      });

      this.persistent = false;
      this.page = await this.context.newPage();
    }
  }

  async listPages(): Promise<{ index: number; url: string; title: string }[]> {
    if (!this.context) return [];
    const pages = this.context.pages();
    const result = [];
    for (let i = 0; i < pages.length; i++) {
      result.push({ index: i, url: pages[i].url(), title: await pages[i].title().catch(() => "") });
    }
    return result;
  }

  async switchToPage(index: number): Promise<void> {
    if (!this.context) throw new Error("No browser context");
    const pages = this.context.pages();
    if (index < 0 || index >= pages.length) throw new Error(`Invalid page index: ${index}`);
    this.page = pages[index];
    await this.page.bringToFront();
  }

  async evaluateInServiceWorker(extensionId: string, expression: string): Promise<string> {
    if (!this.context) throw new Error("Browser not launched");
    const workers = this.context.serviceWorkers();
    let sw = workers.find(w => w.url().includes(extensionId));
    if (!sw) {
      // Wait for service worker to appear
      sw = await this.context.waitForEvent("serviceworker", { 
        predicate: w => w.url().includes(extensionId),
        timeout: 10000 
      }).catch(() => null) as any;
    }
    if (!sw) throw new Error(`Service worker for ${extensionId} not found`);
    const result = await sw.evaluate(expression);
    return typeof result === "string" ? result : JSON.stringify(result);
  }

  async close(): Promise<void> {
    if (this.context) {
      await this.context.close().catch(() => {});
      this.context = null;
      this.page = null;
    }
    if (this.browser) {
      await this.browser.close().catch(() => {});
      this.browser = null;
    }
    this.persistent = false;
  }

  async getPage(): Promise<Page> {
    if (!this.page) {
      await this.launch();
    }
    return this.page!;
  }

  async navigate(url: string): Promise<void> {
    const page = await this.getPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
  }

  async getCurrentUrl(): Promise<string> {
    const page = await this.getPage();
    return page.url();
  }

  async getTitle(): Promise<string> {
    const page = await this.getPage();
    return page.title();
  }

  async takeScreenshot(): Promise<string> {
    const page = await this.getPage();
    const buffer = await page.screenshot({ type: "png", fullPage: false });
    return buffer.toString("base64");
  }

  // Aguarda dados do AvantPro carregarem no DOM (se a extensão estiver presente)
  // Retorna: "loaded" se dados carregaram, "not_authenticated" se extensão precisa de login, false se timeout/ausente
  async waitForAvantproData(options?: { timeout?: number }): Promise<"loaded" | "not_authenticated" | false> {
    const page = await this.getPage()
    const timeout = options?.timeout ?? 25000

    // Verifica se estamos em página de produto/anúncio do Mercado Livre
    const url = page.url()
    const isMlPage = /mercadolivre\.com\.br\/(.*\/p\/MLB|MLB[-\d])/.test(url)
      || /produto\.mercadolivre\.com\.br\/MLB/.test(url)
    if (!isMlPage) return false

    // Espera a extensão injetar qualquer elemento no DOM (classe, id, ou data attribute)
    const avantproSelector = "[class*=avantpro], [class*=Avantpro], [class*=AvantPro], [id*=avantpro], [id*=Avantpro], [data-avantpro]"
    try {
      await page.waitForSelector(avantproSelector, { timeout: 10000 })
    } catch {
      console.log("⏳ AvantPro: extensão não detectada no DOM")
      return false
    }

    console.log("✅ AvantPro: elementos detectados no DOM")

    // Verifica se a extensão está pedindo login/cadastro — busca no BODY inteiro
    const notAuthCheck = `(() => {
      const body = document.body.innerText || "";
      return /comece a usar o avantpro|faça login.*avantpro|cadastre-se.*avantpro|avantpro.*faça login|avantpro.*cadastre-se|avantpro.*sign in|avantpro.*log in|avantpro.*criar conta/i.test(body);
    })()`
    try {
      const notAuth = await page.evaluate(notAuthCheck)
      if (notAuth) {
        console.log("⚠️ AvantPro: extensão não autenticada (pedindo login/cadastro)")
        return "not_authenticated"
      }
    } catch { /* ignore */ }

    // Tenta abrir o painel de dados clicando no botão
    const buttonTexts = ["Informações Avantpro", "Informações AvantPro", "Dados Avantpro", "Dados AvantPro"]
    let clicked = false
    for (const text of buttonTexts) {
      try {
        const btn = page.getByText(text, { exact: false }).first()
        if (await btn.isVisible()) {
          await btn.click({ timeout: 5000 })
          console.log(`✅ AvantPro: clicou em "${text}"`)
          clicked = true
          break
        }
      } catch {
        // Tenta próximo texto
      }
    }

    // Após clicar, aguarda as requisições de rede da extensão terminarem
    if (clicked) {
      try {
        await page.waitForLoadState("networkidle", { timeout: 10000 })
        console.log("✅ AvantPro: rede estabilizou após clique")
      } catch {
        console.log("⏳ AvantPro: timeout esperando rede estabilizar, continuando...")
      }
    }

    // Polling: verifica o BODY INTEIRO para "Carregando dados Avantpro" e métricas
    // Isso é mais robusto do que verificar apenas elementos com classe avantpro
    const checkScript = `(() => {
      const body = document.body.innerText || "";
      const bodyLower = body.toLowerCase();

      // Verifica se extensão está pedindo login
      if (/comece a usar o avantpro|avantpro.*faça login|avantpro.*cadastre-se/i.test(body)) return "not_auth";

      // Verifica se ainda está carregando (texto específico do AvantPro)
      if (/carregando dados avantpro|carregando.*avantpro/i.test(body)) return "loading";

      // Verifica se dados do AvantPro estão presentes (métricas típicas)
      // Busca nos elementos avantpro especificamente
      const avantEls = document.querySelectorAll("${avantproSelector}");
      if (avantEls.length > 0) {
        const avantText = Array.from(avantEls).map(e => e.textContent || "").join(" ");
        if (/carregando/i.test(avantText)) return "loading";
        if (/\\d+[.,]\\d+|R\\$|vendas|visitas|faturamento|conversão|estoque|receita|lucro|margem/i.test(avantText)) return "ready";
      }

      // Fallback: verifica no body se existem padrões de dados AvantPro
      // (ex: tabelas de métricas, dados de vendas injetados pela extensão)
      if (/avantpro/i.test(body) && /vendas.*\\d|faturamento.*\\d|estoque.*\\d|visitas.*\\d|conversão.*\\d|receita.*\\d/i.test(body)) return "ready";

      return "waiting";
    })()`

    const pollInterval = 500
    const deadline = Date.now() + timeout
    while (Date.now() < deadline) {
      try {
        const status = await page.evaluate(checkScript) as string
        if (status === "ready") {
          // Espera extra de 500ms para garantir que a renderização completou
          await page.waitForTimeout(500)
          console.log("✅ AvantPro: dados carregados com sucesso")
          return "loaded"
        }
        if (status === "not_auth") {
          console.log("⚠️ AvantPro: extensão não autenticada (detectado durante polling)")
          return "not_authenticated"
        }
      } catch {
        // Página pode estar navegando, tenta novamente
      }
      const remaining = deadline - Date.now()
      if (remaining <= 0) break
      await page.waitForTimeout(Math.min(pollInterval, remaining))
    }

    console.log("⚠️ AvantPro: timeout aguardando dados carregarem")
    return false
  }

  async extractPageContent(): Promise<{
    url: string;
    title: string;
    visibleText: string;
    headings: string[];
    links: { text: string; href: string }[];
    metaTags: Record<string, string>;
  }> {
    const page = await this.getPage();

    const extractionScript = `
      (() => {
        const IGNORED = new Set([
          "SCRIPT", "STYLE", "NOSCRIPT", "SVG", "PATH", "IFRAME",
          "OBJECT", "EMBED", "LINK", "META", "HEAD",
        ]);

        const walkText = (node) => {
          if (node.nodeType === Node.TEXT_NODE) return (node.textContent || "").trim();
          if (node.nodeType !== Node.ELEMENT_NODE) return "";
          const el = node;
          if (IGNORED.has(el.tagName)) return "";
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") return "";
          const parts = [];
          for (const child of el.childNodes) {
            const t = walkText(child);
            if (t) parts.push(t);
          }
          const joined = parts.join(" ");
          if (["H1","H2","H3","H4","H5","H6","P","LI","TR","DIV","SECTION","ARTICLE"].includes(el.tagName)) {
            return joined + "\\n";
          }
          return joined;
        };

        const visibleText = walkText(document.body).replace(/\\n{3,}/g, "\\n\\n").replace(/ {2,}/g, " ").trim();

        const headings = [];
        document.querySelectorAll("h1,h2,h3,h4,h5,h6").forEach((h) => {
          const t = (h.textContent || "").trim();
          if (t) headings.push(h.tagName + ": " + t);
        });

        const links = [];
        const seen = new Set();
        const contentLinks = [];
        const navLinks = [];
        document.querySelectorAll("a[href]").forEach((a) => {
          const href = a.href || "";
          const text = (a.textContent || "").trim().replace(/\\s+/g, " ");
          if (!text || !href || href.startsWith("javascript:") || seen.has(href)) return;
          seen.add(href);
          const entry = { text: text.slice(0, 120), href };
          const isNav = a.closest("nav, header, footer, [role=navigation], [role=banner]");
          if (isNav) {
            navLinks.push(entry);
          } else {
            contentLinks.push(entry);
          }
        });
        links.push(...contentLinks, ...navLinks);

        const metaTags = {};
        document.querySelectorAll("meta[name], meta[property]").forEach((tag) => {
          const key = tag.getAttribute("name") || tag.getAttribute("property") || "";
          const val = tag.getAttribute("content") || "";
          if (key && val) metaTags[key] = val;
        });

        return {
          url: window.location.href,
          title: document.title,
          visibleText: visibleText.slice(0, 50000),
          headings: headings.slice(0, 50),
          links: links.slice(0, 100),
          metaTags,
        };
      })()
    `;

    return page.evaluate(extractionScript) as Promise<{
      url: string;
      title: string;
      visibleText: string;
      headings: string[];
      links: { text: string; href: string }[];
      metaTags: Record<string, string>;
    }>;
  }

  async executeAction(action: BrowserAction): Promise<ActionResult> {
    const page = await this.getPage();

    try {
      switch (action.type) {
        case "click": {
          if (!action.selector) throw new Error("Selector obrigatório para click");
          
          // Listen for popups before clicking
          let popup: import("playwright").Page | null = null;
          const popupPromise = page.waitForEvent("popup", { timeout: 5000 }).catch(() => null);
          
          // Determine if selector looks like CSS (starts with ., #, [, or tag names)
          const isCssSelector = /^[.#\[\w]/.test(action.selector) && 
            (action.selector.includes(".") || action.selector.includes("#") || 
             action.selector.includes("[") || action.selector.includes(">") ||
             action.selector.includes(" "));
          
          try {
            if (isCssSelector) {
              await page.locator(action.selector).first().click({ timeout: 5000 });
            } else {
              // Try text-based click first for plain text selectors
              await page.getByText(action.selector, { exact: false }).first().click({ timeout: 5000 });
            }
          } catch {
            // Fallback: try the opposite approach
            try {
              if (isCssSelector) {
                await page.getByText(action.selector, { exact: false }).first().click({ timeout: 5000 });
              } else {
                await page.click(action.selector, { timeout: 5000 });
              }
            } catch {
              // Last resort: getByRole button
              await page.getByRole("button", { name: action.selector }).first().click({ timeout: 5000 });
            }
          }
          
          // Check if a popup was opened
          popup = await popupPromise;
          if (popup) {
            await popup.waitForLoadState("domcontentloaded").catch(() => {});
            this.page = popup; // Switch to the popup
            return { success: true, action, detail: `Clicou em: ${action.selector} (popup aberto: ${popup.url()})` };
          }
          
          await page.waitForLoadState("domcontentloaded").catch(() => {});
          return { success: true, action, detail: `Clicou em: ${action.selector}` };
        }

        case "type": {
          if (!action.selector) throw new Error("Selector obrigatório para type");
          if (action.value === undefined) throw new Error("Value obrigatório para type");
          try {
            const locator = page.locator(action.selector).first();
            await locator.click({ timeout: 5000 });
            await locator.fill("", { timeout: 2000 }).catch(() => {});
            await locator.pressSequentially(action.value, { delay: 50 });
          } catch {
            const el = page.getByPlaceholder(action.selector).or(page.getByLabel(action.selector)).first();
            await el.click({ timeout: 5000 });
            await el.fill("", { timeout: 2000 }).catch(() => {});
            await el.pressSequentially(action.value, { delay: 50 });
          }
          return { success: true, action, detail: `Digitou "${action.value}" em ${action.selector}` };
        }

        case "scroll": {
          const amount = parseInt(action.value || "500", 10);
          if (action.selector) {
            try {
              await page.locator(action.selector).first().scrollIntoViewIfNeeded({ timeout: 5000 });
              return { success: true, action, detail: `Scrollou até ${action.selector}` };
            } catch {
              // fallback to generic scroll
            }
          }
          await page.mouse.wheel(0, amount);
          return { success: true, action, detail: `Scrollou ${amount}px` };
        }

        case "navigate": {
          if (!action.value) throw new Error("URL obrigatória para navigate");
          await page.goto(action.value, { waitUntil: "domcontentloaded", timeout: 30000 });
          return { success: true, action, detail: `Navegou para ${action.value}` };
        }

        case "select": {
          if (!action.selector) throw new Error("Selector obrigatório para select");
          if (action.value === undefined) throw new Error("Value obrigatório para select");
          await page.selectOption(action.selector, action.value, { timeout: 5000 });
          return { success: true, action, detail: `Selecionou "${action.value}" em ${action.selector}` };
        }

        case "wait": {
          const ms = Math.min(parseInt(action.value || "1000", 10), 30000);
          if (action.selector) {
            await page.waitForSelector(action.selector, { timeout: ms });
            return { success: true, action, detail: `Aguardou elemento ${action.selector}` };
          }
          await page.waitForTimeout(ms);
          return { success: true, action, detail: `Aguardou ${ms}ms` };
        }

        case "extract": {
          if (!action.selector) throw new Error("Selector obrigatório para extract");
          let text: string;
          // If selector looks like JS expression, evaluate it
          if (/^(document\.|window\.|location\.)/.test(action.selector)) {
            text = await page.evaluate((expr) => {
              try { return String(eval(expr)); } catch (e) { return String(e); }
            }, action.selector);
          } else {
            // Detecta pseudo-seletores inválidos e converte para busca por texto
            const hasInvalidPseudo = /:has-text\(|:text\(|:text-is\(|:text-matches\(/.test(action.selector);
            if (hasInvalidPseudo) {
              // Extrai o texto do pseudo-seletor inválido e busca via getByText
              const textMatch = action.selector.match(/:has-text\(['"]?(.+?)['"]?\)/);
              const searchText = textMatch ? textMatch[1] : action.selector;
              try {
                const el = page.getByText(searchText, { exact: false }).first();
                // Se o seletor original buscava um link, tenta pegar o href
                if (action.selector.startsWith("a") || action.selector.includes(" a")) {
                  text = await el.locator("xpath=ancestor-or-self::a").first().getAttribute("href", { timeout: 5000 }) || "";
                } else {
                  text = await el.innerText({ timeout: 5000 });
                }
              } catch {
                text = await page.getByText(searchText, { exact: false }).first().innerText({ timeout: 5000 });
              }
            } else {
              try {
                text = await page.locator(action.selector).first().innerText({ timeout: 5000 });
              } catch {
                text = await page.getByText(action.selector, { exact: false }).first().innerText({ timeout: 5000 });
              }
            }
          }
          return { success: true, action, detail: `Extraído de ${action.selector}`, extractedData: text.trim() };
        }

        case "screenshot": {
          const screenshot = await this.takeScreenshot();
          return { success: true, action, detail: "Screenshot capturado", screenshot };
        }

        case "hover": {
          if (!action.selector) throw new Error("Selector obrigatório para hover");
          try {
            await page.hover(action.selector, { timeout: 5000 });
          } catch {
            await page.getByText(action.selector, { exact: false }).first().hover({ timeout: 5000 });
          }
          return { success: true, action, detail: `Hover em: ${action.selector}` };
        }

        case "goBack": {
          await page.goBack({ waitUntil: "domcontentloaded" });
          return { success: true, action, detail: "Voltou página" };
        }

        case "goForward": {
          await page.goForward({ waitUntil: "domcontentloaded" });
          return { success: true, action, detail: "Avançou página" };
        }

        case "evaluate": {
          const expression = action.value || action.selector;
          if (!expression) throw new Error("Expressão JS obrigatória para evaluate");
          const result = await page.evaluate((expr) => {
            try { return String(eval(expr)); } catch (e) { return String(e); }
          }, expression);
          return { success: true, action, detail: `Resultado: ${result.slice(0, 500)}`, extractedData: result };
        }

        default:
          throw new Error(`Tipo de ação desconhecido: ${action.type}`);
      }
    } catch (error) {
      return {
        success: false,
        action,
        detail: error instanceof Error ? error.message : String(error),
      };
    }
  }

  async executeActions(actions: BrowserAction[]): Promise<ActionResult[]> {
    const results: ActionResult[] = [];
    for (const action of actions) {
      const result = await this.executeAction(action);
      results.push(result);
      if (!result.success) break;
      // Small pause between actions for stability
      const page = await this.getPage();
      await page.waitForTimeout(300);
    }
    return results;
  }

  isActive(): boolean {
    return (this.browser !== null || this.persistent) && this.page !== null;
  }

  async getStatus(): Promise<{
    active: boolean;
    url: string | null;
    title: string | null;
  }> {
    if (!this.isActive()) {
      return { active: false, url: null, title: null };
    }
    try {
      const page = await this.getPage();
      return {
        active: true,
        url: page.url(),
        title: await page.title(),
      };
    } catch {
      return { active: false, url: null, title: null };
    }
  }
}

export const playwrightManager = new PlaywrightManager();
