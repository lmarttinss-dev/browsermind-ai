import { describe, it, expect, vi, afterEach } from "vitest"
import { sanitizeFilename } from "@/lib/utils"

// Mock de data fixa para fallback previsível
const FIXED_DATE = "2026-05-13"
const dateFallback = `browsermind-${FIXED_DATE}`

describe("sanitizeFilename", () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  function mockDate() {
    vi.spyOn(Date.prototype, "toISOString").mockReturnValue(`${FIXED_DATE}T00:00:00.000Z`)
  }

  it("deve usar o título da página como nome do arquivo", () => {
    expect(sanitizeFilename("Camiseta Premium Algodão")).toBe("Camiseta-Premium-Algodão")
  })

  it("deve remover caracteres inválidos para nome de arquivo", () => {
    expect(sanitizeFilename('Produto "Especial" <2024>')).toBe("Produto-Especial-2024")
  })

  it("deve substituir espaços por hífens", () => {
    expect(sanitizeFilename("Produto   com   espaços")).toBe("Produto-com-espaços")
  })

  it("deve colapsar múltiplos hífens em um só", () => {
    expect(sanitizeFilename("Produto---Teste---ML")).toBe("Produto-Teste-ML")
  })

  it("deve remover hífens do início e fim", () => {
    expect(sanitizeFilename(" - Produto Teste - ")).toBe("Produto-Teste")
  })

  it("deve limitar a 100 caracteres", () => {
    const longTitle = "A".repeat(200)
    expect(sanitizeFilename(longTitle).length).toBeLessThanOrEqual(100)
  })

  it("deve usar fallback com data quando título é null", () => {
    mockDate()
    expect(sanitizeFilename(null)).toBe(dateFallback)
  })

  it("deve usar fallback com data quando título é string vazia", () => {
    mockDate()
    expect(sanitizeFilename("")).toBe(dateFallback)
  })

  it("deve usar fallback com data quando título tem apenas caracteres inválidos", () => {
    mockDate()
    expect(sanitizeFilename('<>:"/\\|?*')).toBe(dateFallback)
  })

  describe("títulos do Mercado Livre", () => {
    it("deve remover sufixo '| Mercado Livre' e extrair título do anúncio", () => {
      const title = "Camiseta Premium 100% Algodão - Tamanho M | Mercado Livre"
      expect(sanitizeFilename(title)).toBe("Camiseta-Premium-100%-Algodão-Tamanho-M")
    })

    it("deve remover sufixo '- Mercado Livre'", () => {
      const title = "Fone Bluetooth JBL - Mercado Livre"
      expect(sanitizeFilename(title)).toBe("Fone-Bluetooth-JBL")
    })

    it("deve remover sufixo '– MercadoLivre' (travessão)", () => {
      const title = "Mouse Gamer RGB – MercadoLivre"
      expect(sanitizeFilename(title)).toBe("Mouse-Gamer-RGB")
    })

    it("deve ser case-insensitive na detecção do sufixo", () => {
      const title = "Produto Teste | mercadolivre.com.br"
      expect(sanitizeFilename(title)).toBe("Produto-Teste")
    })
  })

  it("deve lidar com título contendo barras e dois pontos", () => {
    const title = "Kit 3/5 Peças: Toalha Premium"
    expect(sanitizeFilename(title)).toBe("Kit-35-Peças-Toalha-Premium")
  })
})
