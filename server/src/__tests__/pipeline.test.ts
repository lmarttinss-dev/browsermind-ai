import { describe, it, expect } from "vitest"
import { PIPELINE_STAGES, COMPETITION_LEVELS } from "../models/product"

describe("Pipeline Product Model", () => {
  describe("Constantes", () => {
    it("deve ter 5 stages na ordem correta", () => {
      expect(PIPELINE_STAGES).toEqual(["triagem", "analise", "aprovado", "importando", "concluido"])
      expect(PIPELINE_STAGES).toHaveLength(5)
    })

    it("deve ter 4 níveis de concorrência", () => {
      expect(COMPETITION_LEVELS).toEqual(["Baixa", "Média", "Alta", "Saturado"])
      expect(COMPETITION_LEVELS).toHaveLength(4)
    })
  })

  describe("Validações de stage", () => {
    it("deve aceitar todos os stages válidos", () => {
      const validStages = ["triagem", "analise", "aprovado", "importando", "concluido"]
      validStages.forEach(stage => {
        expect(PIPELINE_STAGES).toContain(stage)
      })
    })

    it("não deve conter stages inválidos", () => {
      const invalidStages = ["pendente", "cancelado", "arquivado"]
      invalidStages.forEach(stage => {
        expect(PIPELINE_STAGES).not.toContain(stage)
      })
    })
  })

  describe("Validações de competition level", () => {
    it("deve aceitar todos os níveis válidos", () => {
      const validLevels = ["Baixa", "Média", "Alta", "Saturado"]
      validLevels.forEach(level => {
        expect(COMPETITION_LEVELS).toContain(level)
      })
    })
  })
})

describe("Auto-inserção: regex de detecção de viabilidade", () => {
  const viabilityRegex = /score\s*final|demanda|concorr[eê]ncia|margem|vendas\s*(mensais|por\s*dia)/i

  it("deve detectar 'Score Final' no texto", () => {
    expect(viabilityRegex.test("Score Final: 8.5")).toBe(true)
  })

  it("deve detectar 'demanda' no texto", () => {
    expect(viabilityRegex.test("Nível de demanda: Alta")).toBe(true)
  })

  it("deve detectar 'concorrência' no texto", () => {
    expect(viabilityRegex.test("Concorrência: Baixa")).toBe(true)
  })

  it("deve detectar 'concorrencia' sem acento", () => {
    expect(viabilityRegex.test("Nivel de concorrencia")).toBe(true)
  })

  it("deve detectar 'margem' no texto", () => {
    expect(viabilityRegex.test("Margem potencial: 45%")).toBe(true)
  })

  it("deve detectar 'vendas mensais' no texto", () => {
    expect(viabilityRegex.test("Vendas mensais estimadas: 500")).toBe(true)
  })

  it("deve detectar 'vendas por dia' no texto", () => {
    expect(viabilityRegex.test("Vendas por dia: 15")).toBe(true)
  })

  it("não deve detectar em texto genérico sem dados de viabilidade", () => {
    expect(viabilityRegex.test("Olá, como posso ajudar?")).toBe(false)
    expect(viabilityRegex.test("A página não contém informações relevantes")).toBe(false)
  })
})

describe("Auto-inserção: parsing de dados do produto", () => {
  const sampleResponse = `## 📦 Informações do Produto

- Nome: Película Protetora Galaxy S24 Ultra
- URL: https://www.mercadolivre.com.br/produto-123
- Categoria: Celulares > Películas
- Preço atual: R$ 29,90

## 📊 Métricas

- Vendas mensais estimadas: 1.200
- Demanda: 8
- Concorrência: Baixa
- Margem: 45% estimada

## 📈 Score Final

- Demanda: 8
- Margem: 7`

  it("deve extrair o título do produto", () => {
    const titleMatch = sampleResponse.match(/(?:Nome|Produto\/Nicho|Título)\s*:\s*(.+)/im)
    expect(titleMatch?.[1]?.trim()).toBe("Película Protetora Galaxy S24 Ultra")
  })

  it("deve extrair o preço", () => {
    const priceMatch = sampleResponse.match(/(?:Preço|preço\s*atual)[:\s]*R?\$?\s*([\d.,]+)/i)
    const price = parseFloat(priceMatch?.[1]?.replace(".", "").replace(",", ".") || "0")
    expect(price).toBe(29.9)
  })

  it("deve extrair vendas mensais", () => {
    const salesMatch = sampleResponse.match(/Vendas\s*mensais[^:]*:\s*([\d.,]+)/im)
    const sales = parseInt(salesMatch?.[1]?.replace(/\./g, "") || "0")
    expect(sales).toBe(1200)
  })

  it("deve extrair nível de concorrência", () => {
    const competitionMatch = sampleResponse.match(/(?:Concorrência|Nível.*concorrência)[:\s]*(Baixa|Média|Alta|Saturado)/i)
    expect(competitionMatch?.[1]).toBe("Baixa")
  })

  it("deve extrair categoria", () => {
    const categoryMatch = sampleResponse.match(/(?:Categoria)[:\s]*(.+)/i)
    expect(categoryMatch?.[1]?.trim()).toBe("Celulares > Películas")
  })

  it("deve extrair score de demanda", () => {
    const scoreMatch = sampleResponse.match(/(?:Demanda|Score\s*Final)[:\s]*(\d+(?:[.,]\d+)?)/i)
    expect(parseFloat(scoreMatch?.[1] || "0")).toBe(8)
  })

  describe("Parsing de preço com diferentes formatos", () => {
    const parsePrice = (text: string) => {
      const match = text.match(/(?:Preço|preço\s*atual)\s*:\s*R?\$?\s*([\d.,]+)/im)
      return parseFloat(match?.[1]?.replace(".", "").replace(",", ".") || "0")
    }

    it("deve parsear R$ 29,90", () => {
      expect(parsePrice("Preço atual: R$ 29,90")).toBe(29.9)
    })

    it("deve parsear R$ 1.299,00", () => {
      expect(parsePrice("Preço: R$ 1.299,00")).toBe(1299.0)
    })

    it("deve parsear R$ 49,90 (formato BR)", () => {
      expect(parsePrice("Preço: R$ 49,90")).toBe(49.9)
    })

    it("deve retornar 0 se não encontrar preço", () => {
      expect(parsePrice("Sem preço nesta linha")).toBe(0)
    })
  })
})

describe("Extração de URL e título do conteúdo da página", () => {
  const pageContent = `URL: https://www.mercadolivre.com.br/pelicula-galaxy-s24/p/MLB123
Title: Película Galaxy S24 Ultra Hydrogel

Headings:
Película Protetora Galaxy S24 Ultra

Content:
Proteção total para seu celular...`

  it("deve extrair URL do conteúdo", () => {
    const urlMatch = pageContent.match(/^URL:\s*(.+)/m)
    expect(urlMatch?.[1]?.trim()).toBe("https://www.mercadolivre.com.br/pelicula-galaxy-s24/p/MLB123")
  })

  it("deve extrair título da página", () => {
    const titleMatch = pageContent.match(/^Title:\s*(.+)/m)
    expect(titleMatch?.[1]?.trim()).toBe("Película Galaxy S24 Ultra Hydrogel")
  })

  it("deve extrair imagem de meta og:image", () => {
    const contentWithImage = `og:image" content="https://http2.mlstatic.com/D_123-F.jpg"`
    const imageMatch = contentWithImage.match(/og:image"\s*content="([^"]+)"/i)
    expect(imageMatch?.[1]).toBe("https://http2.mlstatic.com/D_123-F.jpg")
  })

  it("deve extrair imagem de URL direta (fallback)", () => {
    const contentWithUrl = `Imagem: https://example.com/product.jpg outro texto`
    const imageMatch = contentWithUrl.match(/(https?:\/\/[^\s"]+\.(?:jpg|jpeg|png|webp))/i)
    expect(imageMatch?.[1]).toBe("https://example.com/product.jpg")
  })
})
