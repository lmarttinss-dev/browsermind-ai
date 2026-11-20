import { describe, expect, it } from "vitest"
import { injectReportSummary, repairMermaidFences } from "../markdown"

describe("Mermaid fences in generated reports", () => {
  const valid = '```mermaid\nxychart\n    title "Distribuição de Preços"\n    x-axis ["Entrada", "Premium"]\n    bar [22, 11]\n```'
  it("removes the truncated prefix and keeps the complete chart and following text", () => {
    const broken = '```mermaid\nxychart\n    title "Distrib' + valid
    expect(repairMermaidFences('Antes\n' + broken + '\n## Conclusão\nDepois')).toBe('Antes\n' + valid + '\n## Conclusão\nDepois')
    expect(injectReportSummary(broken)).toBe(valid)
  })
  it("preserves valid separate diagrams", () => {
    const report = valid + '\n\nTexto\n\n' + valid
    expect(repairMermaidFences(report)).toBe(report)
  })
})
