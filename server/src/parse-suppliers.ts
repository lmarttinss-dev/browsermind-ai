import type { Supplier } from "./models/product.js"

export function parseSuppliersFromReport(report: string): Omit<Supplier, "capturedAt">[] {
  const suppliers: Omit<Supplier, "capturedAt">[] = []
  // Dividir por seções de fornecedor (### 🥇 1º —, ### 🥈 2º —, ### 1º —, etc.)
  const sections = report.split(/###\s*(?:(?:🥇|🥈|🥉)\s*(?:[\d]+[ºª]\s*)?|[\d]+[ºª]\s*)(?:—|-)?\s*/)
  for (const section of sections.slice(1)) {
    const nameMatch = section.match(/^(.+?)(?:\n|$)/)
    // Captura URL com múltiplas estratégias (ordem de prioridade):
    // 1. Campo **Link...:** com URL direta ou markdown link
    // 2. Qualquer markdown link [text](url) contendo alibaba.com
    // 3. Qualquer URL alibaba.com/product-detail/ na seção
    // 4. Qualquer URL começando com // seguido de alibaba.com
    const urlMatch = section.match(/\*\*Link[^:]*:\*\*\s*(?:\[.*?\]\()?\s*((?:https?:)?\/\/[^\s)>]+)/i)
      || section.match(/\*\*Link[^:]*:\*\*.*?((?:https?:)?\/\/[^\s)>]+alibaba\.com[^\s)>]*)/i)
      || section.match(/\[.*?\]\(((?:https?:)?\/\/[^\s)]+alibaba\.com[^\s)]*)\)/i)
      || section.match(/(https?:\/\/(?:www\.)?alibaba\.com\/product-detail\/[^\s)>]+)/i)
      || section.match(/(\/\/(?:www\.)?alibaba\.com\/product-detail\/[^\s)>]+)/i)
    const priceMatch = section.match(/\*\*Preço indicado:\*\*\s*(.+)/i)
    const moqMatch = section.match(/\*\*MOQ[^:]*:\*\*\s*(.+)/i)
    const ratingMatch = section.match(/\*\*Rating:\*\*\s*([\d.,]+)/i)
    const tradeMatch = section.match(/\*\*Trade Assurance:\*\*\s*(Sim|Yes)/i)
    const yearsMatch = section.match(/\*\*Anos de operação:\*\*\s*(\d+)/i)
    const responseMatch = section.match(/\*\*Taxa de resposta:\*\*\s*(.+)/i)
    const capMatch = section.match(/\*\*Capacidades:\*\*\s*(.+)/i)
    const certMatch = section.match(/\*\*Certificações:\*\*\s*(.+)/i)

    if (nameMatch) {
      let rawUrl = (urlMatch?.[1] || "").trim()
      // Normalizar URL: adicionar protocolo se necessário e remover query params
      if (rawUrl.startsWith("//")) rawUrl = `https:${rawUrl}`
      rawUrl = rawUrl.split("?")[0]

      // Limpar nome: remover bold (**) e markdown links [text](url)
      const cleanName = nameMatch[1]
        .replace(/\*+/g, "")
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
        .trim()

      suppliers.push({
        name: cleanName,
        url: rawUrl,
        unitPrice: priceMatch?.[1]?.trim() || "",
        moq: moqMatch?.[1]?.trim() || "",
        rating: parseFloat(ratingMatch?.[1]?.replace(",", ".") || "0") || 0,
        tradeAssurance: !!tradeMatch,
        yearsInBusiness: parseInt(yearsMatch?.[1] || "0") || 0,
        responseRate: responseMatch?.[1]?.trim() || "",
        capabilities: capMatch?.[1]?.trim() || "",
        certifications: certMatch?.[1]?.trim() || "",
      })
    }
  }
  return suppliers
}
