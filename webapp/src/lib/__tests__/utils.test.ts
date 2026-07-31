import { describe, it, expect, vi, afterEach } from "vitest"
import { sanitizeFilename, parseCurrency, parseMoq, maskReal, formatBrl, calculateProductCost, formatTotal, calculateUnitCost } from "@/lib/utils"

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

// ---------------------------------------------------------------------------
// Currency / formatting helpers (padrão brasileiro)
// ---------------------------------------------------------------------------

describe("parseCurrency", () => {
  it("deve extrair valor de string no formato brasileiro", () => {
    expect(parseCurrency("R$ 1.234,56")).toBe(1234.56)
  })

  it("deve extrair valor de string sem símbolo", () => {
    expect(parseCurrency("1.234,56")).toBe(1234.56)
  })

  it("deve tratar vírgula como decimal", () => {
    expect(parseCurrency("99,90")).toBe(99.90)
  })

  it("deve retornar null para string vazia", () => {
    expect(parseCurrency("")).toBeNull()
  })

  it("deve retornar null para string sem números", () => {
    expect(parseCurrency("abc")).toBeNull()
  })

  it("deve lidar com valor inteiro", () => {
    expect(parseCurrency("R$ 500")).toBe(500)
  })

  it("deve lidar com centavos sem milhar", () => {
    expect(parseCurrency("R$ 12,50")).toBe(12.50)
  })

  it("deve lidar com milhões formatados", () => {
    expect(parseCurrency("R$ 1.000.000,00")).toBe(1000000.00)
  })
})

describe("parseMoq", () => {
  it("deve extrair número de string com texto", () => {
    expect(parseMoq("100 unidades")).toBe(100)
  })

  it("deve extrair número com separador de milhar", () => {
    expect(parseMoq("1.000 peças")).toBe(1000)
  })

  it("deve retornar null para string vazia", () => {
    expect(parseMoq("")).toBeNull()
  })

  it("deve retornar null para string sem números", () => {
    expect(parseMoq("abc")).toBeNull()
  })

  it("deve extrair apenas número de string mista", () => {
    expect(parseMoq("mín. 50 unid.")).toBe(50)
  })
})

describe("maskReal", () => {
  it("deve formatar dígitos como moeda brasileira", () => {
    expect(maskReal("123456")).toBe("R$ 1.234,56")
  })

  it("deve formatar valor pequeno", () => {
    expect(maskReal("50")).toBe("R$ 0,50")
  })

  it("deve formatar valor com centavos zero", () => {
    expect(maskReal("1000")).toBe("R$ 10,00")
  })

  it("deve retornar vazio para string vazia", () => {
    expect(maskReal("")).toBe("")
  })

  it("deve remover caracteres não numéricos antes de formatar", () => {
    expect(maskReal("abc1.234def")).toBe("R$ 12,34")
  })

  it("deve formatar valor grande com milhares", () => {
    expect(maskReal("123456789")).toBe("R$ 1.234.567,89")
  })
})

describe("formatBrl", () => {
  it("deve formatar número como moeda brasileira", () => {
    expect(formatBrl(1234.56)).toBe("R$ 1.234,56")
  })

  it("deve formatar valor inteiro com centavos", () => {
    expect(formatBrl(500)).toBe("R$ 500,00")
  })

  it("deve formatar valor com centavos", () => {
    expect(formatBrl(99.9)).toBe("R$ 99,90")
  })

  it("deve formatar milhão", () => {
    expect(formatBrl(1000000)).toBe("R$ 1.000.000,00")
  })

  it("deve formatar zero", () => {
    expect(formatBrl(0)).toBe("R$ 0,00")
  })
})

describe("calculateProductCost", () => {
  it("deve calcular custo total do produto (preço × MOQ)", () => {
    expect(calculateProductCost("R$ 5,00", "100 unidades")).toBe("R$ 500,00")
  })

  it("deve retornar vazio se preço estiver ausente", () => {
    expect(calculateProductCost("", "100")).toBe("")
  })

  it("deve retornar vazio se MOQ estiver ausente", () => {
    expect(calculateProductCost("R$ 5,00", "")).toBe("")
  })

  it("deve calcular com valores grandes", () => {
    expect(calculateProductCost("R$ 12,50", "1000")).toBe("R$ 12.500,00")
  })
})

describe("formatTotal", () => {
  it("deve somar dois valores e formatar", () => {
    expect(formatTotal("R$ 500,00", "R$ 200,00")).toBe("R$ 700,00")
  })

  it("deve retornar null se ambos forem inválidos", () => {
    expect(formatTotal("", "")).toBeNull()
  })

  it("deve somar mesmo com um valor ausente", () => {
    expect(formatTotal("R$ 500,00", "")).toBe("R$ 500,00")
  })

  it("deve somar com o segundo valor ausente", () => {
    expect(formatTotal("", "R$ 300,00")).toBe("R$ 300,00")
  })

  it("deve somar valores com centavos", () => {
    expect(formatTotal("R$ 123,45", "R$ 76,55")).toBe("R$ 200,00")
  })
})

describe("calculateUnitCost", () => {
  it("deve calcular custo unitário com frete", () => {
    // (500 + 200) / 100 = 7.00
    expect(calculateUnitCost("R$ 500,00", "R$ 200,00", "100")).toBe("R$ 7,00")
  })

  it("deve retornar null se MOQ for zero", () => {
    expect(calculateUnitCost("R$ 500,00", "R$ 200,00", "0")).toBeNull()
  })

  it("deve retornar null se MOQ estiver ausente", () => {
    expect(calculateUnitCost("R$ 500,00", "R$ 200,00", "")).toBeNull()
  })

  it("deve retornar null se custos estiverem ausentes", () => {
    expect(calculateUnitCost("", "", "100")).toBeNull()
  })

  it("deve calcular apenas com custo do produto", () => {
    expect(calculateUnitCost("R$ 300,00", "", "50")).toBe("R$ 6,00")
  })

  it("deve calcular apenas com frete", () => {
    expect(calculateUnitCost("", "R$ 200,00", "100")).toBe("R$ 2,00")
  })

  it("deve calcular com valores grandes e centavos", () => {
    expect(calculateUnitCost("R$ 1.234,56", "R$ 765,44", "200")).toBe("R$ 10,00")
  })
})
