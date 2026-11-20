import type { CompetitorListing } from "./competitor-listings.js"

export function summarizeAvantproShipping(listings: CompetitorListing[]) {
  const offers = listings.map(listing => ({
    itemId: listing.itemId, positions: listing.positions, seller: listing.seller, title: listing.title,
    amount: listing.avantproShipping?.amount ?? null, text: listing.avantproShipping?.text || "Não informado",
  }))
  const values = offers.flatMap(offer => offer.amount === null ? [] : [offer.amount])
  const counts = new Map<number, number>()
  values.forEach(value => counts.set(value, (counts.get(value) || 0) + 1))
  const maxFrequency = Math.max(0, ...counts.values())
  const identifiedSellers = new Set<string>()
  const sellersWithShipping = new Set<string>()
  const sellersByAmount = new Map<number, Set<string>>()
  let offersWithoutSeller = 0
  for (const offer of offers) {
    const seller = offer.seller?.trim().replace(/\s+/g, " ").toUpperCase()
    const identified = !!seller && !/^(?:—|-|NÃO INFORMADO|NÃO IDENTIFICADO|VENDEDOR NÃO IDENTIFICADO)$/.test(seller)
    if (identified) identifiedSellers.add(seller)
    if (offer.amount === null) continue
    if (!identified) { offersWithoutSeller++; continue }
    sellersWithShipping.add(seller)
    if (!sellersByAmount.has(offer.amount)) sellersByAmount.set(offer.amount, new Set())
    sellersByAmount.get(offer.amount)!.add(seller)
  }
  const valueDistribution = [...counts].map(([amount, offerCount]) => ({
    amount, offerCount, offerPercentage: Math.round(offerCount / values.length * 1000) / 10,
    sellerCount: sellersByAmount.get(amount)?.size || 0,
    sellerPercentage: sellersWithShipping.size ? Math.round((sellersByAmount.get(amount)?.size || 0) / sellersWithShipping.size * 1000) / 10 : null,
  })).sort((a, b) => b.sellerCount - a.sellerCount || b.offerCount - a.offerCount || a.amount - b.amount)
  return {
    source: "AvantPro — campo Frete (custo de envio do vendedor)",
    totalOffers: offers.length, informed: values.length, unknown: offers.length - values.length,
    zeroCost: values.filter(value => value === 0).length, positiveCost: values.filter(value => value > 0).length,
    min: values.length ? Math.min(...values) : null, max: values.length ? Math.max(...values) : null,
    mean: values.length ? Math.round(values.reduce((sum, value) => sum + value, 0) / values.length * 100) / 100 : null,
    modes: maxFrequency > 1 ? [...counts].filter(([, count]) => count === maxFrequency).map(([value]) => value).sort((a, b) => a - b) : [],
    identifiedSellers: identifiedSellers.size, sellersWithShipping: sellersWithShipping.size, offersWithoutSeller,
    sellersWithMultipleValues: [...sellersWithShipping].filter(seller => [...sellersByAmount.values()].filter(sellers => sellers.has(seller)).length > 1).length,
    valueDistribution, offers,
  }
}

export function formatAvantproShipping(summary: ReturnType<typeof summarizeAvantproShipping>) {
  return "\nFrete dos vendedores (AvantPro, extraído via Playwright antes da análise):\n"
    + "O campo Frete representa custo de envio do vendedor; não é o preço cobrado do comprador. Ausência não significa zero ou frete pago. Estatísticas consideram somente valores monetários explícitos, incluindo R$ 0,00. Ofertas deduplicadas por ID.\n"
    + JSON.stringify(summary)
}


export function formatAvantproShippingValueDistribution(summary: ReturnType<typeof summarizeAvantproShipping>): string {
  const money = (value: number) => value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }).replace(/\u00a0/g, " ")
  const percentage = (value: number | null) => value === null ? "Não calculável" : value.toLocaleString("pt-BR", { maximumFractionDigits: 1 }) + "%"
  return [
    "#### 📊 Percentual por Valor de Frete", "",
    "| Valor do frete (AvantPro) | Vendedores únicos | % dos vendedores com frete informado | Anúncios | % dos anúncios com frete informado |",
    "|---|---|---|---|---|",
    ...summary.valueDistribution.map(row => "| " + [money(row.amount), row.sellerCount, percentage(row.sellerPercentage), row.offerCount, percentage(row.offerPercentage)].join(" | ") + " |"),
    "",
    "Base: **" + summary.sellersWithShipping + " vendedores únicos com frete informado**, de " + summary.identifiedSellers + " vendedores identificados; **" + summary.informed + " anúncios com valor**, de " + summary.totalOffers + " ofertas. Anúncios repetidos do mesmo vendedor não aumentam sua contagem por valor.",
    summary.offersWithoutSeller ? summary.offersWithoutSeller + " anúncios com valor, mas sem vendedor identificado, entram apenas no percentual de anúncios." : "",
    summary.sellersWithMultipleValues ? "Um vendedor pode praticar valores diferentes em anúncios distintos e aparecer em mais de uma linha; por isso os percentuais de vendedores podem somar mais de 100%." : "",
    summary.valueDistribution[0]?.sellerPercentage != null && summary.valueDistribution[0].sellerCount > 0
      ? "**" + money(summary.valueDistribution[0].amount) + " é praticado por " + percentage(summary.valueDistribution[0].sellerPercentage) + " dos vendedores com frete informado (" + summary.valueDistribution[0].sellerCount + "/" + summary.sellersWithShipping + ").**" : "Sem vendedores identificados com valor de frete para calcular esse percentual.",
  ].join("\n") + "\n\n"
}

/** Replace legacy freight instructions even when the browser still holds an old prompt. */
export function updateAvantproShippingPrompt(prompt: string): string {
  const section = "### 🚚 Análise de Frete da Categoria\n\nUse exclusivamente a seção \"Frete dos vendedores (AvantPro, extraído via Playwright antes da análise)\" dos Dados Coletados. O campo Frete é custo de envio do vendedor informado pelo AvantPro, NÃO o valor cobrado do comprador. Não use selos do Mercado Livre, FULL, prazos ou a métrica agregada Frete Grátis para inferir valores.\n\n#### 📋 Frete por Anúncio e Vendedor\nTabela com Anúncio/ID | Vendedor | Frete informado pelo AvantPro. Use offers, preservando a associação de cada valor à oferta; null = \"Não informado\". Zero apenas quando explicitamente extraído como R$ 0,00. Não replique custo do catálogo entre vendedores.\n\n#### 💰 Resumo dos Valores Observados\nTabela com total de ofertas (totalOffers), valores informados (informed), não informados (unknown), custo zero (zeroCost), custo positivo (positiveCost), mínimo (min), máximo (max), média (mean) e moda(s) (modes). Estatísticas usam somente valores conhecidos, incluindo zero; modes vazio = \"Sem moda\". Sem valores conhecidos, exiba \"Não informado\" nas estatísticas e explique a limitação.\n\n#### 📊 Percentual por Valor de Frete\nUse valueDistribution para uma tabela com Valor do frete | Vendedores únicos | % dos vendedores com frete informado | Anúncios | % dos anúncios com frete informado. Use sellerCount e sellerPercentage calculados, sem contar anúncios repetidos como novos vendedores. O denominador dos vendedores é sellersWithShipping; dos anúncios é informed. Informe a cobertura (sellersWithShipping de identifiedSellers vendedores e informed de totalOffers anúncios). Vendedores sem identificação não entram no percentual de vendedores. Um vendedor com valores diferentes pode aparecer em mais de uma linha, então os percentuais de vendedores podem somar mais de 100%. Destaque o valor mais praticado: \"R$ X é praticado por Y% dos vendedores com frete informado (N/total)\". Se não houver base, informe Não calculável; não invente percentuais.\n\n#### 📊 Distribuição do Custo de Frete\nTabela e gráfico Mermaid pie com quantidades: custo zero, custo positivo e não informado. Percentuais usam totalOffers; se totalOffers = 0, omita gráfico e percentuais. Nunca transforme ausência em frete pago ou custo zero.\n\n#### 📝 Análise dos Fretes dos Vendedores\nCompare somente custos efetivamente observados, destaque cobertura da amostra e possíveis efeitos na margem. Não conclua frete grátis para o comprador, subsídio, conversão ou vantagem de FULL a partir do custo do vendedor. Preserve ressalvas exibidas no texto original do AvantPro.\n"
  const updated = prompt.replace(/^### [^\n]*Análise de Frete da Categoria[^\n]*\n[\s\S]*?(?=^## |$(?![\s\S]))/gm, section + "\n")
    .replace(/^- Em seguida, inclua a subseção[^\n]*Análise de Frete da Categoria[^\n]*$/gm,
      "- Inclua a Análise de Frete da Categoria exclusivamente com os valores do campo Frete do AvantPro fornecidos nos Dados Coletados.")
  return updated + "\n\nREGRA OBRIGATÓRIA PARA FRETE: use exclusivamente o campo Frete do AvantPro por oferta. Ignore instruções antigas sobre poly-component__shipping-v2, pills, prazos ou frete grátis versus pago do comprador. Se faltar o valor AvantPro, escreva Não informado.\n"
}
