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

// Âncora estável para uma seção conhecida dos relatórios.
// `label` é o rótulo canônico exibido no Sumário (quando presente, substitui o
// título gerado pela IA, garantindo itens de Sumário idênticos entre execuções).
type SectionAnchor = { id: string; match: RegExp; label?: string }

// Mapeia as 17 seções obrigatórias do relatório de mercado para âncoras estáveis #secao-N.
// A ordem reflete a sequência exata definida no template analise-oferta-demanda-concorrencia.
const MARKET_SECTION_ANCHORS: Array<SectionAnchor> = [
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
const AD_SECTION_ANCHORS: Array<SectionAnchor> = [
  { id: "ad-resumo-esteira", match: /resumo para esteira/, label: "📋 Resumo para Esteira" },
  { id: "ad-demanda-recente", match: /demanda recente/, label: "📈 Demanda Recente (Velocidade de Vendas)" },
  { id: "ad-resumo-diagnostico", match: /resumo do diagnostico/, label: "📋 Resumo do Diagnóstico" },
  { id: "ad-dados-anuncio", match: /dados do anuncio/, label: "📦 Dados do Anúncio" },
  { id: "ad-caracteristicas", match: /caracteristicas do produto/, label: "📦 Características do Produto" },
  { id: "ad-metricas-avantpro", match: /metricas do avantpro/, label: "📊 Métricas do AvantPro" },
  { id: "ad-descricao-anuncio", match: /descricao do anuncio/, label: "📝 Descrição do Anúncio" },
  { id: "ad-financeira", match: /analise financeira/, label: "💰 Análise Financeira" },
  { id: "ad-saude", match: /saude do anuncio/, label: "🏥 Saúde do Anúncio" },
  { id: "ad-visao-geral", match: /visao geral do catalogo/, label: "📚 Visão Geral do Catálogo" },
  { id: "ad-descricao-catalogo", match: /descricao do catalogo/, label: "📝 Descrição do Catálogo" },
  { id: "ad-metricas-catalogo", match: /metricas do catalogo/, label: "📊 Métricas do Catálogo (AvantPro)" },
  { id: "ad-diagnostico", match: /diagnostico rapido/, label: "🔎 Diagnóstico Rápido do Catálogo" },
  { id: "ad-posicionamento", match: /posicionamento no catalogo/, label: "🏆 Posicionamento no Catálogo" },
  { id: "ad-precificacao", match: /precificacao no catalogo/, label: "💰 Análise de Precificação no Catálogo" },
  { id: "ad-logistica", match: /logistica no catalogo/, label: "🚚 Comparativo de Logística no Catálogo" },
  { id: "ad-reputacao", match: /comparativo de reputacao/, label: "⭐ Comparativo de Reputação" },
  { id: "ad-perguntas", match: /perguntas e respostas/, label: "💬 Perguntas e Respostas" },
  { id: "ad-opinioes", match: /opinioes do produto/, label: "⭐ Opiniões do Produto" },
  { id: "ad-insights", match: /insights para diferenciacao/, label: "🎯 Insights para Diferenciação" },
  { id: "ad-market-share", match: /market share/, label: "📊 Market Share Estimado no Catálogo" },
  { id: "ad-buybox", match: /vencer a buy box/, label: "🎯 Estratégia para Vencer a Buy Box" },
  { id: "ad-pontos-negativos", match: /pontos negativos e riscos/, label: "🚨 Pontos Negativos e Riscos" },
  { id: "ad-oportunidades", match: /oportunidades de melhoria/, label: "💡 Oportunidades de Melhoria" },
  { id: "ad-score", match: /score final do (catalogo|anuncio)/, label: "📈 Score Final" },
  { id: "ad-conclusao", match: /conclusao (e recomendacoes|produto de catalogo)/, label: "✅ Conclusão" },
]

function collectText(node: any): string {
  if (!node) return ""
  if (node.type === "text") return node.value || ""
  if (Array.isArray(node.children)) return node.children.map(collectText).join("")
  return ""
}

/**
 * Nível canônico (1-6) de cada seção conhecida.
 * No relatório de mercado, Perfil Logístico, Perfil de Conta e Catálogo e
 * Análise de Frete são subseções de "Métricas da Categoria" (nível 3).
 * Todas as demais seções (Tarefas, SEO, Imagens, Precificação, Conclusão) são
 * nível 2. Seções do relatório de anúncio também são nível 2.
 */
function canonicalHeadingLevel(anchorId: string): number {
  if (anchorId.startsWith("ad-")) return 2
  if (anchorId === "secao-2" || anchorId === "secao-3" || anchorId === "secao-4") return 3
  return 2
}

/**
 * Reescreve os níveis de título das seções conhecidas para a hierarquia
 * canônica, eliminando a oscilação entre execuções (a IA varia entre #, ## e ###).
 * Títulos que não casam com nenhuma seção conhecida permanecem inalterados.
 */
export function normalizeReportHeadings(markdown: string): string {
  if (!markdown) return markdown
  const anchors = [...MARKET_SECTION_ANCHORS, ...AD_SECTION_ANCHORS]
  return markdown
    .split("\n")
    .map((line) => {
      const m = /^(#{1,6})\s+(.+)$/.exec(line)
      if (!m) return line
      const title = m[2].trim()
      const normalized = normalizeHeading(title)
      for (const anchor of anchors) {
        if (anchor.match.test(normalized)) {
          return `${"#".repeat(canonicalHeadingLevel(anchor.id))} ${title}`
        }
      }
      return line
    })
    .join("\n")
}

/**
 * Reconstrói o Sumário do relatório a partir dos títulos de seção realmente
 * presentes no markdown, substituindo qualquer Sumário gerado pela IA (que pode
 * vir truncado ou malformado). Retorna o markdown original se nenhuma seção
 * conhecida for encontrada.
 */
export function injectReportSummary(markdown: string): string {
  if (!markdown) return markdown

  // Normaliza os níveis de título das seções conhecidas para a hierarquia canônica
  const normalized = normalizeReportHeadings(markdown)

  const lines = normalized.split("\n")
  const cleaned: string[] = []
  let i = 0

  // 1) Remove o Sumário existente (gerado pela IA)
  while (i < lines.length) {
    if (/^#{2}\s*📑?\s*Sum[áa]rio\b/i.test(lines[i])) {
      i++ // pula o título "## 📑 Sumário"
      // pula os itens de lista e linhas em branco que fazem parte do Sumário
      while (i < lines.length && (/^\s*(\d+\.|-|\*)\s+/.test(lines[i]) || lines[i].trim() === "")) {
        i++
      }
      // pula um separador "---" logo após a lista, se houver
      if (i < lines.length && /^-{3,}\s*$/.test(lines[i])) i++
      while (i < lines.length && lines[i].trim() === "") i++
      continue
    }
    cleaned.push(lines[i])
    i++
  }

  // 2) Identifica as seções (h1/h2/h3) que casam com as âncoras conhecidas
  const anchors = [...MARKET_SECTION_ANCHORS, ...AD_SECTION_ANCHORS]
  const sections: Array<{ index: number; id: string; title: string; label?: string }> = []
  cleaned.forEach((line, idx) => {
    const m = /^(#{1,3})\s+(.+)$/.exec(line)
    if (!m) return
    const title = m[2].trim()
    const normalized = normalizeHeading(title)
    for (const anchor of anchors) {
      if (anchor.match.test(normalized)) {
        sections.push({ index: idx, id: anchor.id, title, label: anchor.label })
        break
      }
    }
  })

  if (sections.length === 0) return markdown

  // 3) Constrói o novo Sumário com links de âncora, na ordem canônica das seções
  // (estável mesmo que a IA gere as seções em ordem diferente) e usando rótulos
  // canônicos quando definidos (evita variação de emojis/títulos entre execuções).
  const canonicalOrder = new Map(anchors.map((anchor, n) => [anchor.id, n]))
  const ordered = [...sections].sort(
    (a, b) => (canonicalOrder.get(a.id) ?? 999) - (canonicalOrder.get(b.id) ?? 999)
  )
  const items = ordered.map((s, n) => `${n + 1}. [${s.label ?? s.title}](#${s.id})`)
  const summary = ["## 📑 Sumário", "", ...items, "", "---", ""]

  // 4) Insere o Sumário antes da primeira seção (em ordem de documento)
  const insertAt = Math.min(...sections.map((s) => s.index))
  return [...cleaned.slice(0, insertAt), ...summary, ...cleaned.slice(insertAt)].join("\n")
}

/**
 * Plugin rehype que adiciona ids de âncora (secao-N / ad-*) aos títulos
 * das seções dos relatórios de mercado e de análise de anúncio.
 * Permite que o Sumário use links de âncora que rolam até a seção.
 */
export function rehypeSectionIds() {
  return (tree: any) => {
    let hasMetricasHeading = false
    let isMarketReport = false

    const walk = (node: any) => {
      if (node && node.type === "element" && /^h[1-6]$/.test(node.tagName || "")) {
        const normalized = normalizeHeading(collectText(node))
        for (const anchor of [...MARKET_SECTION_ANCHORS, ...AD_SECTION_ANCHORS]) {
          if (anchor.match.test(normalized)) {
            node.properties = node.properties || {}
            node.properties.id = anchor.id
            // Força o nível canônico do título, independentemente do que a IA gerou
            node.tagName = `h${canonicalHeadingLevel(anchor.id)}`
            if (anchor.id === "secao-1") hasMetricasHeading = true
            if (anchor.id.startsWith("secao-")) isMarketReport = true
            break
          }
        }
      }
      if (node && Array.isArray(node.children)) {
        for (const child of node.children) walk(child)
      }
    }
    walk(tree)

    // Fallback: relatório de mercado gerado sem o título "Métricas da Categoria"
    // (a IA às vezes coloca a tabela de métricas direto após o Sumário).
    // Nesse caso, ancora o #secao-1 na primeira tabela logo após o Sumário.
    if (isMarketReport && !hasMetricasHeading) {
      let passedSumario = false
      let assigned = false
      const walkTables = (node: any) => {
        if (assigned) return
        if (node && node.type === "element") {
          if (node.tagName === "h2" && /sumario/.test(normalizeHeading(collectText(node)))) {
            passedSumario = true
          } else if (passedSumario && node.tagName === "table") {
            node.properties = node.properties || {}
            node.properties.id = "secao-1"
            assigned = true
            return
          }
        }
        if (node && Array.isArray(node.children)) {
          for (const child of node.children) walkTables(child)
        }
      }
      walkTables(tree)
    }
  }
}

/** Rola suavemente até uma âncora interna (#secao-N). */
export function scrollToAnchor(href: string): void {
  if (!href || !href.startsWith("#")) return
  const id = decodeURIComponent(href.slice(1))
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
}
