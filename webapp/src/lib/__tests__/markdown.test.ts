import { describe, it, expect } from "vitest"
import { injectReportSummary } from "@/lib/markdown"

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
