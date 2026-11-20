import { describe, expect, it } from "vitest"
import type { CompetitorListing } from "../competitor-listings.js"
import { summarizeAvantproShipping, formatAvantproShippingValueDistribution } from "../avantpro-shipping.js"
const offer = (seller: string | null, amount: number | null): CompetitorListing => ({
  seller, title: "Produto", positions: [], itemId: null, catalogId: null, url: null, advertising: false, metrics: "",
  avantproShipping: { source: "AvantPro", amount, text: amount === null ? "—" : String(amount) },
})
describe("percentual de vendedores por valor de frete", () => {
  it("conta vendedores únicos por valor e separa o percentual de anúncios", () => {
    const summary = summarizeAvantproShipping([offer("A", 6.85), offer(" a ", 6.85), offer("B", 6.85), offer("C", 6.85), offer("D", 6.95), offer("E", 6.95)])
    expect(summary.sellersWithShipping).toBe(5)
    expect(summary.valueDistribution[0]).toEqual({ amount: 6.85, sellerCount: 3, sellerPercentage: 60, offerCount: 4, offerPercentage: 66.7 })
    expect(formatAvantproShippingValueDistribution(summary)).toContain("R$ 6,85 é praticado por 60% dos vendedores")
  })
  it("exclui desconhecidos da base de vendedores e permite vários valores por vendedor", () => {
    const summary = summarizeAvantproShipping([offer("A", 0), offer("A", 6.85), offer("B", 6.85), offer(null, 6.85), offer("—", 6.85), offer("C", null)])
    expect(summary).toMatchObject({ sellersWithShipping: 2, identifiedSellers: 3, offersWithoutSeller: 2, sellersWithMultipleValues: 1 })
    expect(summary.valueDistribution.find(row => row.amount === 6.85)).toMatchObject({ sellerCount: 2, sellerPercentage: 100, offerCount: 4, offerPercentage: 80 })
    expect(summary.valueDistribution.find(row => row.amount === 0)).toMatchObject({ sellerCount: 1, sellerPercentage: 50 })
    expect(formatAvantproShippingValueDistribution(summary)).toContain("podem somar mais de 100%")
  })
  it("não inventa percentuais sem vendedores identificados ou sem valores", () => {
    expect(summarizeAvantproShipping([offer(null, 6.85)]).valueDistribution[0].sellerPercentage).toBeNull()
    expect(summarizeAvantproShipping([]).valueDistribution).toEqual([])
    expect(formatAvantproShippingValueDistribution(summarizeAvantproShipping([]))).toContain("Sem vendedores identificados")
  })
})
