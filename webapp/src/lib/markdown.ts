// Utilitários compartilhados de Markdown (âncoras de seção do relatório de análise de mercado)

/** Remove acentos, emojis e pontuação, e normaliza espaços para casar títulos de seção. */
function normalizeHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

// Mapeia as 17 seções obrigatórias do relatório de mercado para âncoras estáveis #secao-N.
// A ordem reflete a sequência exata definida no template analise-oferta-demanda-concorrencia.
const MARKET_SECTION_ANCHORS: Array<{ id: string; match: RegExp }> = [
  { id: "secao-1", match: /metricas da categoria/ },
  { id: "secao-2", match: /perfil logistico da categoria/ },
  { id: "secao-3", match: /perfil de conta e catalogo/ },
  { id: "secao-4", match: /analise de frete da categoria/ },
  { id: "secao-5", match: /\btarefa 1\b/ },
  { id: "secao-6", match: /\btarefa 2\b/ },
  { id: "secao-7", match: /\btarefa 3\b/ },
  { id: "secao-8", match: /\btarefa 4\b/ },
  { id: "secao-9", match: /\btarefa 5\b/ },
  { id: "secao-10", match: /\btarefa 6\b/ },
  { id: "secao-11", match: /\btarefa 7\b/ },
  { id: "secao-12", match: /\btarefa 8\b/ },
  { id: "secao-13", match: /estrategia de seo/ },
  { id: "secao-14", match: /estrategia de imagens/ },
  { id: "secao-15", match: /estrategia de precificacao/ },
  { id: "secao-16", match: /sugestao de precificacao/ },
  { id: "secao-17", match: /conclusao executiva/ },
]

// Mapeia as seções do relatório de análise de anúncio (catálogo ou independente)
// para âncoras estáveis #ad-*. Títulos comuns aos dois ramos usam a mesma âncora.
const AD_SECTION_ANCHORS: Array<{ id: string; match: RegExp }> = [
  { id: "ad-resumo-esteira", match: /resumo para esteira/ },
  { id: "ad-demanda-recente", match: /demanda recente/ },
  { id: "ad-resumo-diagnostico", match: /resumo do diagnostico/ },
  { id: "ad-dados-anuncio", match: /dados do anuncio/ },
  { id: "ad-caracteristicas", match: /caracteristicas do produto/ },
  { id: "ad-metricas-avantpro", match: /metricas do avantpro/ },
  { id: "ad-descricao-anuncio", match: /descricao do anuncio/ },
  { id: "ad-financeira", match: /analise financeira/ },
  { id: "ad-saude", match: /saude do anuncio/ },
  { id: "ad-visao-geral", match: /visao geral do catalogo/ },
  { id: "ad-descricao-catalogo", match: /descricao do catalogo/ },
  { id: "ad-metricas-catalogo", match: /metricas do catalogo/ },
  { id: "ad-diagnostico", match: /diagnostico rapido/ },
  { id: "ad-posicionamento", match: /posicionamento no catalogo/ },
  { id: "ad-precificacao", match: /precificacao no catalogo/ },
  { id: "ad-logistica", match: /logistica no catalogo/ },
  { id: "ad-reputacao", match: /comparativo de reputacao/ },
  { id: "ad-perguntas", match: /perguntas e respostas/ },
  { id: "ad-opinioes", match: /opinioes do produto/ },
  { id: "ad-insights", match: /insights para diferenciacao/ },
  { id: "ad-market-share", match: /market share/ },
  { id: "ad-buybox", match: /vencer a buy box/ },
  { id: "ad-pontos-negativos", match: /pontos negativos e riscos/ },
  { id: "ad-oportunidades", match: /oportunidades de melhoria/ },
  { id: "ad-score", match: /score final do (catalogo|anuncio)/ },
  { id: "ad-conclusao", match: /conclusao (e recomendacoes|produto de catalogo)/ },
]

function collectText(node: any): string {
  if (!node) return ""
  if (node.type === "text") return node.value || ""
  if (Array.isArray(node.children)) return node.children.map(collectText).join("")
  return ""
}

/**
 * Plugin rehype que adiciona ids de âncora (secao-N / ad-*) aos títulos
 * das seções dos relatórios de mercado e de análise de anúncio.
 * Permite que o Sumário use links de âncora que rolam até a seção.
 */
export function rehypeSectionIds() {
  return (tree: any) => {
    const walk = (node: any) => {
      if (node && node.type === "element" && /^h[1-6]$/.test(node.tagName || "")) {
        const normalized = normalizeHeading(collectText(node))
        for (const anchor of [...MARKET_SECTION_ANCHORS, ...AD_SECTION_ANCHORS]) {
          if (anchor.match.test(normalized)) {
            node.properties = node.properties || {}
            node.properties.id = anchor.id
            break
          }
        }
      }
      if (node && Array.isArray(node.children)) {
        for (const child of node.children) walk(child)
      }
    }
    walk(tree)
  }
}

/** Rola suavemente até uma âncora interna (#secao-N). */
export function scrollToAnchor(href: string): void {
  if (!href || !href.startsWith("#")) return
  const id = decodeURIComponent(href.slice(1))
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
