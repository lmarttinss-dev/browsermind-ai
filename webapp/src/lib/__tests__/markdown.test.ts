import { describe, it, expect } from "vitest"
import { injectReportSummary, normalizeReportHeadings } from "@/lib/markdown"

const buildMarketReport = () => `# 🕵️ Análise de Oferta, Demanda e Concorrência — Mercado Livre
**Categoria:** Teste
**URL:** https://lista.mercadolivre.com.br/teste
**Data da análise:** 17 de Setembro de 2026

---

## 📊 Métricas da Categoria (AvantPro)

| Métrica | Valor |
|----------|---------|
| Vendedores | **59** |

### 📦 Perfil Logístico da Categoria

Conteúdo.

### 📊 Perfil de Conta e Catálogo

Conteúdo.

### 🚚 Análise de Frete da Categoria

Conteúdo.

# 🧭 Tarefa 1 — Análise da Demanda

Conteúdo.

# 🛡️ Tarefa 2 — Análise da Concorrência

Conteúdo.

# 📊 Tarefa 3 — Análise de Concentração de Mercado

Conteúdo.

# 🚪 Tarefa 4 — Oportunidade de Entrada

Conteúdo.

# 💰 Tarefa 5 — Potencial de Lucro

Conteúdo.

# 🎯 Tarefa 6 — Score de Oportunidade

Conteúdo.

# 🧭 Tarefa 7 — Estratégia Recomendada

Conteúdo.

# 📅 Tarefa 8 — Plano de Ataque de 30 Dias

Conteúdo.

# 🔍 Estratégia de SEO

Conteúdo.

# 🎨 Estratégia de Imagens

Conteúdo.

# 💲 Estratégia de Precificação

Conteúdo.

# 💲 Sugestão de Precificação para Venda

Conteúdo.

# 📋 Conclusão Executiva

Conteúdo.
`

describe("injectReportSummary", () => {
  it("deve gerar Sumário completo incluindo seções h1 (Tarefas, SEO, Conclusão)", () => {
    const result = injectReportSummary(buildMarketReport())

    expect(result).toContain("## 📑 Sumário")
    // As 17 seções obrigatórias do relatório de mercado
    for (let n = 1; n <= 17; n++) {
      expect(result).toContain(`#secao-${n}`)
    }
  })

  it("deve remover um Sumário existente gerado pela IA antes de reconstruir", () => {
    const withAiSummary = `# 🕵️ Análise de Oferta, Demanda e Concorrência — Mercado Livre

## 📑 Sumário

1. [📊 Métricas da Categoria (AvantPro)](http://localhost:5180/pipeline/abc#secao-1)
2. [📦 Perfil Logístico da Categoria](http://localhost:5180/pipeline/abc#secao-2)

---

## 📊 Métricas da Categoria (AvantPro)

| Métrica | Valor |
|----------|---------|
| Vendedores | **59** |

# 🧭 Tarefa 1 — Análise da Demanda

Conteúdo.
`
    const result = injectReportSummary(withAiSummary)

    expect(result).not.toContain("http://localhost:5180")
    expect(result).toContain("## 📑 Sumário")
    expect(result).toContain(`[📊 Métricas da Categoria (AvantPro)](#secao-1)`)
    expect(result).toContain(`#secao-5`)
  })
})

describe("normalizeReportHeadings", () => {
  it("deve normalizar seções principais para nível h2", () => {
    const result = normalizeReportHeadings(`# 🕵️ Análise de Oferta, Demanda e Concorrência — Mercado Livre

# 🧭 Tarefa 1 — Análise da Demanda

# 📋 Conclusão Executiva
`)

    expect(result).toContain("## 🧭 Tarefa 1 — Análise da Demanda")
    expect(result).toContain("## 📋 Conclusão Executiva")
    // Título do relatório permanece h1
    expect(result).toContain("# 🕵️ Análise de Oferta, Demanda e Concorrência — Mercado Livre")
  })

  it("deve manter subseções (Perfil Logístico/Conta/Frete) no nível h3", () => {
    const result = normalizeReportHeadings(`## 📊 Métricas da Categoria (AvantPro)

### 📦 Perfil Logístico da Categoria

### 🚚 Análise de Frete da Categoria
`)

    expect(result).toContain("## 📊 Métricas da Categoria (AvantPro)")
    expect(result).toContain("### 📦 Perfil Logístico da Categoria")
    expect(result).toContain("### 🚚 Análise de Frete da Categoria")
  })

  it("deve normalizar headings de nível variado para o nível canônico", () => {
    const result = normalizeReportHeadings(`# Tarefa 2 — Análise da Concorrência

### Estratégia de SEO
`)

    expect(result).toContain("## Tarefa 2 — Análise da Concorrência")
    expect(result).toContain("## Estratégia de SEO")
  })

  it("não deve alterar títulos que não são seções conhecidas", () => {
    const markdown = `#### 📊 Gráfico do Perfil Logístico

##### Crescimento Acelerado
`
    expect(normalizeReportHeadings(markdown)).toBe(markdown)
  })
})
