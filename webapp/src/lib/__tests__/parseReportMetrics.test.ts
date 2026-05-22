import { describe, it, expect } from "vitest"
import { parseReportMetrics } from "@/lib/utils"

describe("parseReportMetrics", () => {
  describe("Preço", () => {
    it("deve extrair preço simples R$ 29,90", () => {
      const report = "- Preço atual: R$ 29,90"
      expect(parseReportMetrics(report).price).toBe(29.9)
    })

    it("deve extrair preço com milhar R$ 1.299,00", () => {
      const report = "- Preço atual: R$ 1.299,00"
      expect(parseReportMetrics(report).price).toBe(1299)
    })

    it("deve extrair preço com bold markdown **Preço atual:** R$ 49,90", () => {
      const report = "- **Preço atual:** R$ 49,90"
      expect(parseReportMetrics(report).price).toBe(49.9)
    })

    it("deve extrair preço sem R$", () => {
      const report = "- Preço: 199,90"
      expect(parseReportMetrics(report).price).toBe(199.9)
    })

    it("deve extrair preço com milhar e bold R$ 2.499,00", () => {
      const report = "**Preço atual:** R$ 2.499,00"
      expect(parseReportMetrics(report).price).toBe(2499)
    })

    it("deve retornar 0 se não encontrar preço", () => {
      const report = "Nenhuma informação de preço aqui"
      expect(parseReportMetrics(report).price).toBe(0)
    })
  })

  describe("Score", () => {
    it("deve extrair Score Final: 8", () => {
      const report = "- Score Final: 8"
      expect(parseReportMetrics(report).score).toBe(8)
    })

    it("deve extrair Score Final com decimal: 7,5", () => {
      const report = "- Score Final: 7,5"
      expect(parseReportMetrics(report).score).toBe(7.5)
    })

    it("deve extrair Score Final com bold markdown", () => {
      const report = "- **Score Final:** 8.5"
      expect(parseReportMetrics(report).score).toBe(8.5)
    })

    it("deve extrair Demanda como fallback", () => {
      const report = "- Demanda: 9"
      expect(parseReportMetrics(report).score).toBe(9)
    })

    it("deve retornar 0 se não encontrar score", () => {
      const report = "Texto genérico sem score"
      expect(parseReportMetrics(report).score).toBe(0)
    })
  })

  describe("Vendas mensais", () => {
    it("deve extrair vendas mensais: 1.200", () => {
      const report = "- Vendas mensais estimadas: 1.200"
      expect(parseReportMetrics(report).monthlySales).toBe(1200)
    })

    it("deve extrair vendas mensais com bold markdown", () => {
      const report = "- **Vendas mensais estimadas:** 1.200"
      expect(parseReportMetrics(report).monthlySales).toBe(1200)
    })

    it("deve extrair vendas mensais sem milhar: 500", () => {
      const report = "- Vendas mensais estimadas: 500"
      expect(parseReportMetrics(report).monthlySales).toBe(500)
    })

    it("deve extrair vendas mensais com milhar grande: 12.500", () => {
      const report = "- Vendas mensais: 12.500"
      expect(parseReportMetrics(report).monthlySales).toBe(12500)
    })

    it("deve retornar 0 se não encontrar vendas", () => {
      const report = "Texto sem dados de vendas"
      expect(parseReportMetrics(report).monthlySales).toBe(0)
    })
  })

  describe("Margem", () => {
    it("deve extrair Potencial de margem: 35-45%", () => {
      const report = "- Potencial de margem: 35-45%"
      expect(parseReportMetrics(report).potentialMargin).toBe("35-45%")
    })

    it("deve extrair Margem com bold markdown", () => {
      const report = "- **Potencial de margem:** 40%"
      expect(parseReportMetrics(report).potentialMargin).toBe("40%")
    })

    it("deve extrair Margem simples", () => {
      const report = "- Margem: 30-40%"
      expect(parseReportMetrics(report).potentialMargin).toBe("30-40%")
    })

    it("deve retornar string vazia se não encontrar margem", () => {
      const report = "Texto sem dados de margem"
      expect(parseReportMetrics(report).potentialMargin).toBe("")
    })
  })

  describe("Relatório completo (Resumo para Esteira)", () => {
    const fullReport = `## 📋 Resumo para Esteira

> Este bloco é obrigatório e usado para alimentar o Kanban automaticamente.

- Nome: Película Protetora Galaxy S24 Ultra
- Categoria: Celulares > Películas
- Preço atual: R$ 29,90
- Vendas mensais estimadas: 1.200
- Concorrência: Baixa
- Potencial de margem: 35-45%
- Score Final: 8

---

## 📦 Informações do Produto

Resto do relatório...`

    it("deve extrair todas as métricas do relatório completo", () => {
      const metrics = parseReportMetrics(fullReport)
      expect(metrics.price).toBe(29.9)
      expect(metrics.score).toBe(8)
      expect(metrics.monthlySales).toBe(1200)
      expect(metrics.potentialMargin).toBe("35-45%")
    })
  })

  describe("Relatório com bold markdown", () => {
    const boldReport = `## 📋 Resumo para Esteira

- **Nome:** Kit Ferramentas Pro 200 peças
- **Categoria:** Ferramentas > Kits
- **Preço atual:** R$ 1.299,00
- **Vendas mensais estimadas:** 3.500
- **Concorrência:** Alta
- **Potencial de margem:** 25-30%
- **Score Final:** 6,5`

    it("deve extrair todas as métricas com bold markdown", () => {
      const metrics = parseReportMetrics(boldReport)
      expect(metrics.price).toBe(1299)
      expect(metrics.score).toBe(6.5)
      expect(metrics.monthlySales).toBe(3500)
      expect(metrics.potentialMargin).toBe("25-30%")
    })
  })

  describe("Relatório vazio ou inválido", () => {
    it("deve retornar zeros para string vazia", () => {
      const metrics = parseReportMetrics("")
      expect(metrics.price).toBe(0)
      expect(metrics.score).toBe(0)
      expect(metrics.monthlySales).toBe(0)
      expect(metrics.potentialMargin).toBe("")
    })
  })
})
