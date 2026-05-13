import { describe, it, expect, afterAll } from "vitest"
import { chromium, type Page } from "playwright"
import http from "http"

// Simula página de produto ML com elementos AvantPro que carregam com delay
function createTestServer(loadDelayMs = 3000): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB123456</h1>
        <p>Descrição do produto</p>
        <div class="avantpro-panel" id="avantpro-metrics">
          <span>Carregando dados Avantpro...</span>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById("avantpro-metrics").innerHTML =
              '<div class="avantpro-data">' +
              '<span>Vendas: 1.234</span>' +
              '<span>Faturamento: R$ 45.678,90</span>' +
              '<span>Visitas: 5.000</span>' +
              '<span>Conversão: 2,5%</span>' +
              '<span>Estoque: 150</span>' +
              '</div>';
          }, ${loadDelayMs});
        </script>
      </body>
      </html>
    `)
  })
}

// Simula cenário onde o "Carregando" está num div SEM classe avantpro
// (reproduz bug real: check só olhava [class*=avantpro] mas texto estava em outro elemento)
function createSplitDomServer(loadDelayMs = 3000): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB123456</h1>
        <div class="avantpro-btn"><button>Informações Avantpro</button></div>
        <div class="extension-loading-area" id="ext-data">
          <span>Carregando dados Avantpro...</span>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById("ext-data").innerHTML =
              '<div class="avantpro-metrics-loaded">' +
              '<span>Vendas: 2.500</span>' +
              '<span>Faturamento: R$ 89.000,00</span>' +
              '<span>Estoque: 300</span>' +
              '</div>';
          }, ${loadDelayMs});
        </script>
      </body>
      </html>
    `)
  })
}

// Simula página onde dados nunca carregam
function createStuckServer(): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB999999</h1>
        <div class="avantpro-panel">
          <span>Carregando dados Avantpro...</span>
        </div>
      </body>
      </html>
    `)
  })
}

// Simula página onde dados aparecem após clicar no botão
function createButtonClickServer(loadDelayMs = 2000): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB456789</h1>
        <div class="avantpro-panel" id="avantpro-panel">
          <button id="avantpro-btn">Informações Avantpro</button>
          <div id="avantpro-data" style="display:none;">
            <span>Carregando dados Avantpro...</span>
          </div>
        </div>
        <script>
          document.getElementById("avantpro-btn").addEventListener("click", () => {
            document.getElementById("avantpro-data").style.display = "block";
            setTimeout(() => {
              document.getElementById("avantpro-data").innerHTML =
                '<div class="avantpro-metrics">' +
                '<span>Vendas: 800</span>' +
                '<span>Faturamento: R$ 32.000,00</span>' +
                '<span>Estoque: 50</span>' +
                '</div>';
            }, ${loadDelayMs});
          });
        </script>
      </body>
      </html>
    `)
  })
}

// Simula página que começa carregando e depois mostra tela de login
function createDelayedNotAuthServer(loadDelayMs = 2000): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB333333</h1>
        <div class="avantpro-panel" id="avantpro-metrics">
          <span>Carregando dados Avantpro...</span>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById("avantpro-metrics").innerHTML =
              '<div class="avantpro-cta">' +
              '<h3>Comece a usar o Avantpro!</h3>' +
              '<p>Faça login para ver métricas.</p>' +
              '<button>Cadastre-se</button>' +
              '</div>';
          }, ${loadDelayMs});
        </script>
      </body>
      </html>
    `)
  })
}

// Simula página com case diferente nos seletores (AvantPro com PascalCase)
function createPascalCaseServer(loadDelayMs = 1500): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB222222</h1>
        <div class="AvantPro-container" id="AvantPro-data">
          <span>Carregando dados Avantpro...</span>
        </div>
        <script>
          setTimeout(() => {
            document.getElementById("AvantPro-data").innerHTML =
              '<div class="AvantPro-metrics">' +
              '<span>Receita: R$ 120.000,00</span>' +
              '<span>Margem: 15%</span>' +
              '<span>Lucro: R$ 18.000,00</span>' +
              '</div>';
          }, ${loadDelayMs});
        </script>
      </body>
      </html>
    `)
  })
}

// Simula página sem AvantPro
function createNoAvantproServer(): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste</title></head>
      <body>
        <h1>Produto sem AvantPro</h1>
        <p>Conteúdo normal da página</p>
      </body>
      </html>
    `)
  })
}

// Simula página com AvantPro não autenticado (pedindo login)
function createNotAuthServer(): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB888888</h1>
        <div class="avantpro-panel">
          <div class="avantpro-cta">
            <h3>Comece a usar o Avantpro!</h3>
            <p>Faça login para ver métricas de vendas, estoque e concorrência.</p>
            <button>Cadastre-se</button>
          </div>
        </div>
      </body>
      </html>
    `)
  })
}

// Reimplementação alinhada com PlaywrightManager.waitForAvantproData
// Verifica BODY inteiro, não apenas elementos com classe avantpro
async function waitForAvantproData(page: Page, options?: { timeout?: number }): Promise<"loaded" | "not_authenticated" | false> {
  const timeout = options?.timeout ?? 25000
  const url = page.url()
  const isMlPage = /mercadolivre\.com\.br\/(.*\/p\/MLB|MLB[-\d])/.test(url)
    || /produto\.mercadolivre\.com\.br\/MLB/.test(url)
    || /localhost.*MLB/.test(url)
  if (!isMlPage) return false

  const avantproSelector = "[class*=avantpro], [class*=Avantpro], [class*=AvantPro], [id*=avantpro], [id*=Avantpro], [data-avantpro]"
  try {
    await page.waitForSelector(avantproSelector, { timeout: 10000 })
  } catch {
    return false
  }

  // Verifica se extensão pede login — busca no BODY inteiro
  const notAuthCheck = `(() => {
    const body = document.body.innerText || "";
    return /comece a usar o avantpro|faça login.*avantpro|cadastre-se.*avantpro|avantpro.*faça login|avantpro.*cadastre-se/i.test(body);
  })()`
  try {
    const notAuth = await page.evaluate(notAuthCheck)
    if (notAuth) return "not_authenticated"
  } catch { /* ignore */ }

  // Tenta clicar no botão
  const buttonTexts = ["Informações Avantpro", "Informações AvantPro", "Dados Avantpro", "Dados AvantPro"]
  for (const text of buttonTexts) {
    try {
      const btn = page.getByText(text, { exact: false }).first()
      if (await btn.isVisible()) {
        await btn.click({ timeout: 5000 })
        break
      }
    } catch { /* next */ }
  }

  // Polling: verifica BODY INTEIRO para "Carregando dados Avantpro" e métricas
  const checkScript = `(() => {
    const body = document.body.innerText || "";
    if (/comece a usar o avantpro|avantpro.*faça login|avantpro.*cadastre-se/i.test(body)) return "not_auth";
    if (/carregando dados avantpro|carregando.*avantpro/i.test(body)) return "loading";
    const avantEls = document.querySelectorAll("${avantproSelector}");
    if (avantEls.length > 0) {
      const avantText = Array.from(avantEls).map(e => e.textContent || "").join(" ");
      if (/carregando/i.test(avantText)) return "loading";
      if (/\\d+[.,]\\d+|R\\$|vendas|visitas|faturamento|conversão|estoque|receita|lucro|margem/i.test(avantText)) return "ready";
    }
    if (/avantpro/i.test(body) && /vendas.*\\d|faturamento.*\\d|estoque.*\\d|visitas.*\\d|conversão.*\\d|receita.*\\d/i.test(body)) return "ready";
    return "waiting";
  })()`

  const pollInterval = 500
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    try {
      const status = await page.evaluate(checkScript) as string
      if (status === "ready") {
        await page.waitForTimeout(500)
        return "loaded"
      }
      if (status === "not_auth") return "not_authenticated"
    } catch { /* ignore */ }
    const remaining = deadline - Date.now()
    if (remaining <= 0) break
    await page.waitForTimeout(Math.min(pollInterval, remaining))
  }
  return false
}

describe("AvantPro - Aguarda dados carregarem", () => {
  const servers: http.Server[] = []

  function startServer(server: http.Server): Promise<number> {
    return new Promise((resolve) => {
      server.listen(0, () => {
        const addr = server.address()
        const port = typeof addr === "object" && addr ? addr.port : 0
        servers.push(server)
        resolve(port)
      })
    })
  }

  afterAll(async () => {
    for (const s of servers) {
      await new Promise<void>((resolve) => s.close(() => resolve()))
    }
  })

  it("deve aguardar dados carregarem e extrair métricas (delay 3s)", async () => {
    const server = createTestServer(3000)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB123456`)

    const initialText = await page.locator(".avantpro-panel").textContent()
    expect(initialText).toContain("Carregando")

    const loaded = await waitForAvantproData(page, { timeout: 10000 })
    expect(loaded).toBe("loaded")

    const finalText = await page.locator("[class*=avantpro]").first().textContent()
    expect(finalText).not.toContain("Carregando")
    expect(finalText).toContain("Vendas")
    expect(finalText).toContain("R$")

    await browser.close()
  }, 30000)

  it("deve detectar dados mesmo com DOM dividido (texto fora de [class*=avantpro])", async () => {
    const server = createSplitDomServer(2000)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB654321`)

    // Inicialmente "Carregando dados Avantpro..." está num div sem classe avantpro
    const bodyInitial = await page.locator("body").textContent()
    expect(bodyInitial).toContain("Carregando dados Avantpro")

    const loaded = await waitForAvantproData(page, { timeout: 10000 })
    expect(loaded).toBe("loaded")

    // Dados carregados aparecem num div com classe avantpro-metrics-loaded
    const bodyFinal = await page.locator("body").textContent()
    expect(bodyFinal).not.toContain("Carregando dados Avantpro")
    expect(bodyFinal).toContain("Vendas")
    expect(bodyFinal).toContain("Estoque")

    await browser.close()
  }, 30000)

  it("deve retornar false quando dados nunca carregam (timeout)", async () => {
    const server = createStuckServer()
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB999999`)

    const start = Date.now()
    const loaded = await waitForAvantproData(page, { timeout: 5000 })
    const elapsed = Date.now() - start
    expect(loaded).toBe(false)
    expect(elapsed).toBeLessThan(15000)

    const text = await page.locator(".avantpro-panel").textContent()
    expect(text).toContain("Carregando")

    await browser.close()
  }, 60000)

  it("deve retornar false em página sem AvantPro", async () => {
    const server = createNoAvantproServer()
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB555555`)

    const loaded = await waitForAvantproData(page, { timeout: 5000 })
    expect(loaded).toBe(false)

    await browser.close()
  }, 20000)

  it("deve retornar false em URL que não é produto ML", async () => {
    const server = createTestServer(1000)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/pagina-qualquer`)

    const loaded = await waitForAvantproData(page, { timeout: 3000 })
    expect(loaded).toBe(false)

    await browser.close()
  }, 10000)

  it("deve lidar com delay longo da extensão (7s)", async () => {
    const server = createTestServer(7000)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB777777`)

    const loaded = await waitForAvantproData(page, { timeout: 15000 })
    expect(loaded).toBe("loaded")

    const finalText = await page.locator("[class*=avantpro]").first().textContent()
    expect(finalText).not.toContain("Carregando")
    expect(finalText).toContain("Estoque")

    await browser.close()
  }, 30000)

  it("deve retornar not_authenticated quando extensão pede login", async () => {
    const server = createNotAuthServer()
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB888888`)

    const result = await waitForAvantproData(page, { timeout: 5000 })
    expect(result).toBe("not_authenticated")

    const text = await page.locator(".avantpro-panel").textContent()
    expect(text).toContain("Comece a usar")

    await browser.close()
  }, 15000)

  it("deve funcionar com URL de anúncio ML (MLB-xxx)", async () => {
    const server = createTestServer(2000)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/MLB-12345678-titulo-do-produto`)

    const loaded = await waitForAvantproData(page, { timeout: 10000 })
    expect(loaded).toBe("loaded")

    await browser.close()
  }, 30000)

  it("deve carregar dados após clicar no botão Informações Avantpro", async () => {
    const server = createButtonClickServer(1500)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB456789`)

    const loaded = await waitForAvantproData(page, { timeout: 10000 })
    expect(loaded).toBe("loaded")

    const bodyText = await page.locator("body").textContent()
    expect(bodyText).toContain("Vendas")
    expect(bodyText).toContain("R$")

    await browser.close()
  }, 30000)

  it("deve retornar not_authenticated quando login aparece durante polling", async () => {
    const server = createDelayedNotAuthServer(1500)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB333333`)

    // Inicialmente está "Carregando"
    const initialText = await page.locator(".avantpro-panel").textContent()
    expect(initialText).toContain("Carregando")

    const result = await waitForAvantproData(page, { timeout: 10000 })
    expect(result).toBe("not_authenticated")

    await browser.close()
  }, 20000)

  it("deve detectar elementos com PascalCase e métricas alternativas (receita, margem, lucro)", async () => {
    const server = createPascalCaseServer(1000)
    const port = await startServer(server)
    const browser = await chromium.launch({ headless: true })
    const page = await (await browser.newContext()).newPage()

    await page.goto(`http://localhost:${port}/produto-teste/p/MLB222222`)

    const loaded = await waitForAvantproData(page, { timeout: 10000 })
    expect(loaded).toBe("loaded")

    const bodyText = await page.locator("body").textContent()
    expect(bodyText).toContain("Receita")
    expect(bodyText).toContain("Margem")
    expect(bodyText).toContain("Lucro")

    await browser.close()
  }, 20000)
})
