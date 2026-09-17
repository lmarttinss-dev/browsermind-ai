import { describe, it, expect, afterAll, beforeAll } from "vitest"
import { PlaywrightManager } from "../playwright-manager.js"
import http from "http"

// Simula página de produto ML com métricas AvantPro em:
// 1. DOM normal (light DOM)
// 2. Shadow DOM (padrão comum em extensões que isolam a UI)
// 3. Preço do ML em elemento padrão da página (fallback)
function createTestServer(): http.Server {
  return http.createServer((_req, res) => {
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" })
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>Produto Teste - Mercado Livre</title></head>
      <body>
        <h1>Produto Teste MLB123456</h1>
        <p>Descrição do produto</p>

        <div class="andes-money-amount__fraction">1.299</div>

        <div class="avantpro-panel" id="avantpro-metrics">
          <div class="avantpro-data">
            <span>Preço: R$ 69,00</span>
            <span>Score: 8.3/10</span>
            <span>Vendas mensais: 1.363/Mês</span>
            <span>Margem: 35-45%</span>
          </div>
        </div>

        <div id="shadow-host"></div>

        <script>
          const host = document.getElementById("shadow-host");
          const root = host.attachShadow({ mode: "open" });
          root.innerHTML =
            '<div class="avantpro-shadow">' +
            '<span>Ritmo atual: 223/mês</span>' +
            '<span>Estoque: 150</span>' +
            '</div>';
        </script>
      </body>
      </html>
    `)
  })
}

describe("extractPageContent - extração de métricas AvantPro", () => {
  let server: http.Server
  let port: number
  let manager: PlaywrightManager

  beforeAll(async () => {
    server = createTestServer()
    await new Promise<void>((resolve) => {
      server.listen(0, () => {
        const addr = server.address()
        port = typeof addr === "object" && addr ? addr.port : 0
        resolve()
      })
    })

    manager = new PlaywrightManager()
    await manager.launch(true)
    await manager.navigate(`http://localhost:${port}/produto-teste/p/MLB123456`)
  })

  afterAll(async () => {
    await manager.close()
    await new Promise<void>((resolve) => server.close(() => resolve()))
  })

  it("deve extrair métricas AvantPro do light DOM em avantproMetrics", async () => {
    const content = await manager.extractPageContent()
    expect(content.avantproMetrics).toContain("Preço: R$ 69,00")
    expect(content.avantproMetrics).toContain("Vendas mensais: 1.363/Mês")
    expect(content.avantproMetrics).toContain("Score: 8.3/10")
  })

  it("deve extrair métricas AvantPro de shadow DOM em avantproMetrics", async () => {
    const content = await manager.extractPageContent()
    expect(content.avantproMetrics).toContain("Ritmo atual: 223/mês")
    expect(content.avantproMetrics).toContain("Estoque: 150")
  })

  it("deve incluir o preço do ML como fallback em avantproMetrics", async () => {
    const content = await manager.extractPageContent()
    expect(content.avantproMetrics).toContain("Preço do anúncio: 1.299")
  })

  it("deve incluir texto de shadow DOM no visibleText", async () => {
    const content = await manager.extractPageContent()
    expect(content.visibleText).toContain("Ritmo atual: 223/mês")
  })
})
