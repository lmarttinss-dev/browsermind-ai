import type { Supplier } from "./models/product.js"
import type { KitItem } from "./models/product.js"

/**
 * Limpa o preço mantendo apenas a moeda e o valor/faixa.
 * Ex: "US$ 0.50 - 0.80 / peça" → "US$ 0.50 - 0.80"
 */
export function sanitizePrice(value: string): string {
  if (!value) return ""
  const cleaned = value
    .replace(/\*+/g, "")
    .replace(/\s*\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const match = cleaned.match(/((?:US\$|USD|R\$|€|£|\$)\s*)?(\d[\d.,]*)(\s*[-–—~]\s*(\d[\d.,]*))?/)
  if (!match?.[2]) return cleaned
  const currency = match[1] || ""
  const range = match[4] ? ` - ${match[4]}` : ""
  return `${currency}${match[2]}${range}`.trim()
}

/**
 * Limpa o valor de MOQ mantendo apenas o número e a unidade,
 * com a unidade traduzida para pt-BR.
 * Ex: "50 pieces" → "50 peças"
 */
export function sanitizeMoq(value: string): string {
  if (!value) return ""
  const cleaned = value
    .replace(/\*+/g, "")
    .replace(/\s*\([^)]*\)/g, " ")
    .replace(/\s+/g, " ")
    .trim()
  const match = cleaned.match(/(\d[\d.,]*(?:\s*[-–—~]\s*\d[\d.,]*)?)\s*(pe[çc]as?|pieces?|pcs?\.?|unidades?|units?|un\.?|itens?|items?|conjuntos?)?/i)
  if (!match?.[1]) return cleaned
  const unit = translateMoqUnit(match[2])
  return (match[1] + (unit ? ` ${unit}` : "")).trim()
}

/** Traduz a unidade do MOQ para pt-BR (ex: "pieces" → "peças"). */
function translateMoqUnit(unit: string | undefined): string {
  if (!unit) return ""
  const u = unit.trim().toLowerCase().replace(/\.$/, "")
  if (u === "piece" || u === "pieces" || u === "pc" || u === "pcs" || u === "peça" || u === "peças" || u === "peca" || u === "pecas") return "peças"
  if (u === "unit" || u === "units" || u === "un" || u === "unidade" || u === "unidades") return "unidades"
  if (u === "item" || u === "items" || u === "iten" || u === "itens") return "itens"
  if (u === "conjunto" || u === "conjuntos") return "conjuntos"
  return unit
}

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
    const urlMatch = section.match(/\*\*Link[^:]*:\*\*\s*(?:\[.*?\]\()?\s*((?:https?:)?\/\/[^\s)>`]+)/i)
      || section.match(/\*\*Link[^:]*:\*\*.*?((?:https?:)?\/\/[^\s)>`]+alibaba\.com[^\s)>`]*)/i)
      || section.match(/\[.*?\]\(((?:https?:)?\/\/[^\s)]+alibaba\.com[^\s)]*)\)/i)
      || section.match(/(https?:\/\/(?:www\.)?alibaba\.com\/product-detail\/[^\s)>`]+)/i)
      || section.match(/(\/\/(?:www\.)?alibaba\.com\/product-detail\/[^\s)>`]+)/i)
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
      // Limpar artefatos de markdown: remove todos os backticks, asteriscos, aspas
      rawUrl = rawUrl.replace(/`/g, "").replace(/[*"'<>]/g, "").trim()
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
        unitPrice: sanitizePrice(priceMatch?.[1] || ""),
        moq: sanitizeMoq(moqMatch?.[1] || ""),
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

/**
 * Parseia relatório de análise individual de fornecedor
 * (formato gerado pelo endpoint POST /api/supplier/analyze)
 */
export function parseIndividualSupplierReport(report: string, supplierUrl: string): Omit<Supplier, "capturedAt"> {
  const nameMatch = report.match(/(?:Nome da empresa|Nome)[:\s]*\*?\*?\s*(.+)/im)
  const yearsMatch = report.match(/Anos de operação[:\s]*\*?\*?\s*(\d+)/im)
  const tradeMatch = report.match(/Trade Assurance[:\s]*\*?\*?\s*(Sim|Yes|sim|yes)/im)
    || report.match(/Trade Assurance[:\s]*\*?\*?\s*(?:US\$|USD)\s*[\d.,]+/im)
  const ratingMatch = report.match(/Rating\s*(?:geral)?[:\s]*\*?\*?\s*([\d.,]+)/im)
  const responseMatch = report.match(/Taxa de resposta[:\s]*\*?\*?\s*(.+)/im)
  const certMatch = report.match(/Certificações[^:]*[:\s]*\*?\*?\s*(.+)/im)

  // Classificação fábrica/trading
  const typeMatch = report.match(/Classificação\s*[:\s]*\*?\*?\s*(FACTORY|TRADING)/i)

  // Busca preço e MOQ na seção de produtos
  const priceMatch = report.match(/(?:Preço|Faixa de preço)[^:]*[:\s]*\*?\*?\s*(.+)/im)
  const moqMatch = report.match(/(?:MOQ|Pedido mínimo)[^:]*[:\s]*\*?\*?\s*(.+)/im)

  // Capacidades (OEM/ODM)
  const oemMatch = report.match(/OEM[^:]*[:\s]*\*?\*?\s*(Sim|Yes|Disponível)/im)
  const odmMatch = report.match(/ODM[^:]*[:\s]*\*?\*?\s*(Sim|Yes|Disponível)/im)
  const capabilities: string[] = []
  if (oemMatch) capabilities.push("OEM")
  if (odmMatch) capabilities.push("ODM")

  return {
    name: nameMatch?.[1]?.replace(/\*+/g, "").trim() || "Fornecedor analisado",
    url: supplierUrl,
    unitPrice: sanitizePrice(priceMatch?.[1] || ""),
    moq: sanitizeMoq(moqMatch?.[1] || ""),
    rating: parseFloat(ratingMatch?.[1]?.replace(",", ".") || "0") || 0,
    tradeAssurance: !!tradeMatch,
    yearsInBusiness: parseInt(yearsMatch?.[1] || "0") || 0,
    responseRate: responseMatch?.[1]?.replace(/\*+/g, "").trim() || "",
    capabilities: capabilities.join(" / ") || "",
    certifications: certMatch?.[1]?.replace(/\*+/g, "").trim() || "",
    supplierType: typeMatch?.[1]?.trim().toUpperCase() || "",
  }
}

/**
 * Extrai itens do kit a partir do relatório de análise da IA.
 * Detecta padrões como:
 * - Linhas de lista: - 2x Cabo HDMI, - 3x Fonte 12V
 * - Tabelas com colunas Item/Quantidade
 * - Seção "Itens do Kit" ou "O que está incluso"
 */
export function parseKitItemsFromReport(report: string): KitItem[] {
  const items: KitItem[] = []

  // Estratégia 1: Seção "Itens do Kit", "O que está incluso", "Conteúdo do kit", "Composição"
  const kitSection = report.match(/(?:Itens do Kit|O que está incluso|Conteúdo do [Kk]it|Composição do [Kk]it|Itens inclu[íi]dos)[:\s]*\n([\s\S]*?)(?=\n\n|\n##|\n---|$)/i)
  const sectionText = kitSection?.[1] || ""

  // Estratégia 2: Linhas de lista com padrão "quantidade x nome" ou "nome - qtd"
  const listPattern = /[-*•]\s*(?:(\d+)\s*x\s*)?(.+?)(?:\s*[-–(]\s*(\d+)\s*(?:unidades?|un|itens?|peças?|pcs?)?\s*[-–)])?\s*$/gim

  const textToSearch = sectionText || report
  let match: RegExpExecArray | null

  // Estratégia 3: Padrão "Item X: Nome" ou "X. Nome"
  const numberedPattern = /(?:Item\s*\d+|^\d+)[.:)]\s*(?:(\d+)\s*x\s*)?(.+?)(?:\s*[-–(]\s*(\d+)\s*(?:unidades?|un|itens?|peças?|pcs?)?\s*[-–)])?\s*$/gim

  // Tenta extrair com listPattern primeiro
  while ((match = listPattern.exec(textToSearch)) !== null) {
    const name = (match[2] || "").replace(/\*+/g, "").trim()
    const qtyFromPrefix = parseInt(match[1] || "0")
    const qtyFromSuffix = parseInt(match[3] || "0")
    const qty = qtyFromPrefix || qtyFromSuffix || 1

    if (name && name.length > 2 && !name.match(/^(https?:\/\/|www\.)/i)) {
      // Evitar duplicatas
      if (!items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
        items.push({ name, quantity: qty })
      }
    }
  }

  // Tenta com numberedPattern se não encontrou nada
  if (items.length === 0) {
    while ((match = numberedPattern.exec(textToSearch)) !== null) {
      const name = (match[2] || "").replace(/\*+/g, "").trim()
      const qtyFromPrefix = parseInt(match[1] || "0")
      const qtyFromSuffix = parseInt(match[3] || "0")
      const qty = qtyFromPrefix || qtyFromSuffix || 1

      if (name && name.length > 2 && !name.match(/^(https?:\/\/|www\.)/i)) {
        if (!items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
          items.push({ name, quantity: qty })
        }
      }
    }
  }

  // Estratégia 4: Tabela markdown com cabeçalho Item|Quantidade
  if (items.length === 0) {
    const tableSection = report.match(/\|.*Item.*\|.*(?:Qtd|Quantidade).*\|[\s\S]*?(?=\n\n|\n##|\n---|$)/i)
    if (tableSection) {
      const rows = tableSection[0].split("\n").filter(line => line.includes("|") && !line.includes("---") && !line.match(/(?:Item|Qtd|Quantidade)/i))
      for (const row of rows) {
        const cells = row.split("|").map(c => c.trim()).filter(Boolean)
        if (cells.length >= 2) {
          const name = cells[0].replace(/\*+/g, "").trim()
          const qty = parseInt(cells[1]?.replace(/\D/g, "") || "1")
          if (name && name.length > 2 && !name.match(/^(https?:\/\/|www\.)/i)) {
            if (!items.some(i => i.name.toLowerCase() === name.toLowerCase())) {
              items.push({ name, quantity: qty })
            }
          }
        }
      }
    }
  }

  return items
}
