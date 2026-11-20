import { describe, expect, it } from "vitest"
import { updateAvantproShippingPrompt } from "../avantpro-shipping.js"
describe("frete em prompts antigos já abertos", () => {
  it("substitui somente a seção antiga e preserva as tarefas seguintes", () => {
    const prompt = "Antes\n### 🚚 Análise de Frete da Categoria\nDiagnóstico do Elemento de Frete nos Anúncios (poly-component__shipping-v2)\nFrete Pago = totalCards - freeShippingCount\n## Tarefa 1\nDemanda preservada"
    const result = updateAvantproShippingPrompt(prompt)
    expect(result).toContain("Frete por Anúncio e Vendedor")
    expect(result).toContain("## Tarefa 1\nDemanda preservada")
    expect(result).not.toContain("Diagnóstico do Elemento")
    expect(result).not.toContain("Frete Pago =")
  })
  it("atualiza as duas definições de seção e remove instruções inline antigas", () => {
    const legacy = "### 🚚 Análise de Frete da Categoria\nPills antigas\n"
    const result = updateAvantproShippingPrompt("- Em seguida, inclua a subseção Análise de Frete da Categoria usando pills\n" + legacy + "## Demanda\n" + legacy)
    expect(result).not.toContain("Pills antigas")
    expect(result).not.toContain("usando pills")
    expect(result.match(/Frete por Anúncio e Vendedor/g)).toHaveLength(2)
  })
})
