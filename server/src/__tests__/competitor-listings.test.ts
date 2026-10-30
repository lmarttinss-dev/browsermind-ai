import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest"
import { PlaywrightManager } from "../playwright-manager.js"
import { extractCompetitorListings, formatCompetitorListings, restoreCompetitorReportLinks, type CompetitorListing } from "../competitor-listings.js"

describe("Competitor listing links from the DOM", () => {
  let manager: PlaywrightManager
  beforeAll(async () => {
    manager = new PlaywrightManager()
    await manager.launch(true)
  })
  afterAll(async () => { await manager.close() })

  const card = (title: string, url: string | null, seller: string, metrics = "Participação\n8,0%") =>
    '<li class="ui-search-layout__item"><div class="poly-card">' +
    (url ? '<a class="poly-component__title" href="' + url.replaceAll("&", "&amp;") + '">' + title + '</a>' :
      '<h3 class="poly-component__title">' + title + '</h3>') +
    '<div class="avantpro-product-container">Nome do vendedor<br>' + seller + '<br>' +
    metrics.replaceAll("\n", "<br>") + '</div></div></li>'

  const ad = "https://click1.mercadolivre.com.br/mclics/clicks/external/MLB/count?a=opaque&pdp_filters=item_id%3AMLB111#is_advertising=true&wid=MLB111"
  const organic = "https://www.mercadolivre.com.br/adaptador/up/MLBU999?pdp_filters=item_id%3AMLB111#tracking_id=123&wid=MLB111"
  const second = "https://www.mercadolivre.com.br/adaptador/up/MLBU999?pdp_filters=item_id%3AMLB222#tracking_id=123&wid=MLB222"

  beforeEach(async () => {
    const page = await manager.getPage()
    // Navigation exceeds the existing generic link limit; competitor links must survive.
    await page.setContent('<base href="https://www.mercadolivre.com.br/">' +
      Array.from({ length: 110 }, (_, i) => '<a href="https://www.mercadolivre.com.br/menu/' + i + '">Menu</a>').join("") +
      '<ul>' +
      card("Patrocinado", ad, "LOJA_A") +
      card("Adaptador orgânico", organic, "LOJA_A", "Participação\n8,0%\nRitmo atual (vendas/mês)\n500") +
      card("Outra oferta do mesmo catálogo", second, "LOJA_B", "Participação\n2,0%") +
      card("Sem link", null, "LOJA_C") +
      '</ul>')
  })

  it("deduplicates ads by item ID, preferring organic URLs and keeping offer selectors", async () => {
    const extracted = await manager.extractPageContent()
    const rows = extracted.competitorListings
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({
      itemId: "MLB111", catalogId: "MLBU999", seller: "LOJA_A",
      title: "Adaptador orgânico", positions: [1, 2], advertising: false,
    })
    const url = new URL(rows[0].url!)
    expect(url.hostname).toBe("www.mercadolivre.com.br")
    expect(url.searchParams.get("pdp_filters")).toBe("item_id:MLB111")
    expect(new URLSearchParams(url.hash.slice(1)).get("wid")).toBe("MLB111")
    expect(rows[0].metrics).toContain("500")
    expect(rows[1]).toMatchObject({ itemId: "MLB222", catalogId: "MLBU999", seller: "LOJA_B" })
    expect(rows[1].url).toContain("MLB222")
    expect(rows[2]).toMatchObject({ title: "Sem link", url: null, itemId: null, seller: "LOJA_C" })
  })

  it("keeps competitor URLs beyond the generic 100-link limit and preserves generic offer URLs", async () => {
    const extracted = await manager.extractPageContent()
    expect(extracted.links).toHaveLength(100)
    expect(extracted.competitorListings.some(row => row.itemId === "MLB111")).toBe(true)
    const page = await manager.getPage()
    await page.setContent(card("Adaptador", organic, "LOJA_A"))
    const withLink = await manager.extractPageContent()
    expect(withLink.links[0].href).toContain("pdp_filters=item_id%3AMLB111")
    expect(withLink.links[0].href).toContain("wid=MLB111")
  })

  it("converts sponsored tracking URLs into direct item permalinks", async () => {
    const page = await manager.getPage()
    await page.setContent(card("Patrocinado", ad, "LOJA_A"))
    const rows = await page.evaluate(extractCompetitorListings)
    expect(rows[0]).toMatchObject({ url: "https://produto.mercadolivre.com.br/MLB-111-_JM", itemId: "MLB111", advertising: true })
    expect(formatCompetitorListings(rows)).not.toContain("click1.mercadolivre.com.br")
  })

  it("does not publish a sponsored redirect when no listing ID can be verified", async () => {
    const page = await manager.getPage()
    await page.setContent(card("Patrocinado sem ID", "https://click1.mercadolivre.com.br/mclics/clicks/external/MLB/count?a=opaque", "LOJA_A"))
    expect((await page.evaluate(extractCompetitorListings))[0]).toMatchObject({ url: null, itemId: null })
  })

  it("does not mistake catalog IDs for listing IDs or merge separate seller offers", async () => {
    const page = await manager.getPage()
    await page.setContent(card("Catálogo", "https://www.mercadolivre.com.br/produto/p/MLB999", "LOJA_A") +
      card("Catálogo", "https://www.mercadolivre.com.br/produto/p/MLB999", "LOJA_B"))
    const rows = await page.evaluate(extractCompetitorListings)
    expect(rows).toHaveLength(2)
    expect(rows.map(row => row.itemId)).toEqual([null, null])
    expect(rows.map(row => row.catalogId)).toEqual(["MLB999", "MLB999"])
  })

  it("ignores unsafe and non-product URLs instead of inventing competitor links", async () => {
    const page = await manager.getPage()
    await page.setContent(card("Javascript", "javascript:alert(1)", "LOJA_A") +
      card("Outro domínio", "https://example.com/MLB-123", "LOJA_B") +
      card("Ajuda", "https://vendedores.mercadolivre.com.br/ajuda/16467", "LOJA_C"))
    const rows = await page.evaluate(extractCompetitorListings)
    expect(rows).toHaveLength(3)
    expect(rows.every(row => row.url === null)).toBe(true)
  })

  it("supports legacy cards, relative URLs and winner labels", async () => {
    const page = await manager.getPage()
    await page.setContent('<base href="https://produto.mercadolivre.com.br/"><div class="ui-search-result">' +
      '<a href="/MLB-123-adaptador-_JM"><h2 class="ui-search-item__title">Adaptador</h2></a>' +
      '<div class="avantpro-product-info-container">Atual ganhador<br>LOJA_D</div></div>')
    expect((await page.evaluate(extractCompetitorListings))[0]).toMatchObject({
      itemId: "MLB123", seller: "LOJA_D", url: "https://produto.mercadolivre.com.br/MLB-123-adaptador-_JM",
    })
  })

  it("places all identities/links before bounded metrics in model context", async () => {
    const extracted = await manager.extractPageContent()
    const rows = Array.from({ length: 70 }, (_, i): CompetitorListing => ({
      ...extracted.competitorListings[0], itemId: "MLB" + i,
      url: "https://produto.mercadolivre.com.br/MLB-" + i + "-item-_JM", metrics: "x".repeat(10000),
    }))
    const context = formatCompetitorListings(rows)
    expect(context.indexOf("MLB-69-item")).toBeLessThan(context.indexOf('"metrics"'))
    expect(context.length).toBeLessThan(70000)
    expect(formatCompetitorListings([])).toBe("")
  })
})


describe("Competitor report link validation", () => {
  const listing: CompetitorListing = {
    positions: [2], itemId: "MLB7079076226", catalogId: null, title: "Adaptador",
    seller: "RFB001", url: "https://produto.mercadolivre.com.br/MLB-7079076226-_JM", advertising: true, metrics: "",
  }
  it("repairs the abbreviated tracking link reported by the user", () => {
    const report = "[Abrir anúncio](https://click1.mercadolivre.com.br/...&wid=MLB7079076226)"
    expect(restoreCompetitorReportLinks(report, [listing])).toBe("[Abrir anúncio](" + listing.url + ")")
  })
  it("restores escaped and encoded destinations and keeps the seller offer selected", () => {
    const organic = { ...listing, url: "https://www.mercadolivre.com.br/produto/p/MLB999?pdp_filters=item_id%3AMLB7079076226#wid=MLB7079076226", advertising: false }
    const report = "[Adaptador](https://click1.mercadolivre.com.br/...\\&wid=MLB7079076226)"
    expect(restoreCompetitorReportLinks(report, [organic])).toBe("[Adaptador](" + organic.url + ")")
    expect(restoreCompetitorReportLinks("[Adaptador](https://click1.mercadolivre.com.br/?pdp_filters=item_id%3AMLB7079076226)", [organic]))
      .toBe("[Adaptador](" + organic.url + ")")
  })
  it("can recover a truncated destination using a known listing ID in the link label", () => {
    expect(restoreCompetitorReportLinks("[MLB7079076226](https://click1.mercadolivre.com.br/...)", [listing]))
      .toBe("[MLB7079076226](" + listing.url + ")")
  })
  it("removes unverified tracking links and does not change unrelated links", () => {
    expect(restoreCompetitorReportLinks("[Outro](https://click1.mercadolivre.com.br/...&wid=MLB999)", [listing]))
      .toBe("Outro (Link não disponível)")
    const unrelated = "[Fonte](https://example.com/source)"
    expect(restoreCompetitorReportLinks(unrelated, [listing])).toBe(unrelated)
    expect(restoreCompetitorReportLinks(unrelated, [])).toBe(unrelated)
  })
})
