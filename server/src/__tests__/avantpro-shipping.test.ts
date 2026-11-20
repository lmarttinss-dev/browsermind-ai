import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { chromium, type Browser, type Page } from "playwright"
import { extractCompetitorListings } from "../competitor-listings.js"
import { formatAvantproShipping, summarizeAvantproShipping } from "../avantpro-shipping.js"

describe("frete AvantPro por oferta", () => {
  let browser: Browser
  let page: Page
  beforeAll(async () => {
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox"] })
    page = await browser.newPage()
  })
  afterAll(async () => { await browser?.close() })
  it("extrai valores explícitos, ignora selos do ML e preserva desconhecidos e shadow DOM", async () => {
    await page.setContent('<div id="cards"></div>')
    await page.evaluate(() => {
      const values = ["R$\u00a012,90", "R$ 0,00", "—", "R$ 12,90", "R$ 1.234,56"]
      values.forEach((value, i) => {
        const card = document.createElement("div")
        card.className = "ui-search-layout__item"
        card.innerHTML = '<a class="poly-component__title" href="https://produto.mercadolivre.com.br/MLB-' + (1000 + i) + '-produto">Produto ' + i + '</a><div class="poly-component__shipping-v2">Frete R$ 99,90 FULL</div><div class="host"></div>'
        const root = i === 4 ? card.querySelector(".host")!.attachShadow({ mode: "open" }) : card.querySelector(".host")!
        root.innerHTML = '<div class="avantpro-product-container"><div class="avantpro-product-info-row"><span class="avantpro-product-info-row-label">Frete<div class="tooltip-root avantpro-tooltip-host"><svg></svg><div class="avantpro-tooltip-popover">Quanto o vendedor paga de frete neste anúncio. O comprador pode ver outro valor.</div></div></span><span class="avantpro-product-info-row-value">' + value + '</span></div></div>'
        document.querySelector("#cards")!.append(card)
      })
    })
    const listings = await page.evaluate(extractCompetitorListings)
    const summary = summarizeAvantproShipping(listings)
    expect(summary).toMatchObject({ totalOffers: 5, informed: 4, unknown: 1, zeroCost: 1, positiveCost: 3, min: 0, max: 1234.56, mean: 315.09, modes: [12.9] })
    expect(summary.offers[2].amount).toBeNull()
    expect(summary.offers[4].itemId).toBe("MLB1004")
    expect(formatAvantproShipping(summary)).toContain('"amount":1234.56')
  })
  it("não inventa estatísticas em amostra vazia", () => {
    expect(summarizeAvantproShipping([])).toMatchObject({ totalOffers: 0, informed: 0, min: null, max: null, mean: null, modes: [] })
  })
})
