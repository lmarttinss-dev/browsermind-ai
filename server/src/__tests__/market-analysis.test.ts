import { describe, expect, it, vi } from "vitest"
import express from "express"
import request from "supertest"
import { analyzeSelection, normalizeListing, emptyProfile, type MarketSnapshot } from "../market-analysis.js"
import { createMarketAnalysisRouter } from "../routes/market-analysis.js"
import type { CompetitorListing } from "../competitor-listings.js"

const listing = (overrides: Partial<CompetitorListing> = {}): CompetitorListing => ({
  positions: [1], itemId: "MLB100", catalogId: null, title: "Adaptador USB", seller: "LOJA_A", url: "https://produto.mercadolivre.com.br/MLB-100-_JM", advertising: false,
  metrics: "Vendas (30 dias)\n1.234", observed: { price: 19.9, logistics: "Full", freeShipping: true, delivery: "Full", sponsored: true }, ...overrides,
})
const snapshot = (): MarketSnapshot => ({ id: "snapshot", title: "Adaptadores", url: "https://lista.mercadolivre.com.br/adaptador", capturedAt: new Date().toISOString(), warnings: [],
  listings: [normalizeListing(listing(), 0), normalizeListing(listing({ itemId: "MLB200", catalogId: "MLB999", seller: "LOJA_B", metrics: "Vendas (30 dias)\n999", observed: { price: 29.9, logistics: null, freeShipping: null, delivery: null, sponsored: false } }), 1), normalizeListing(listing({ itemId: "MLB300", metrics: "Ritmo atual (vendas/mês)\n500\nVendidos\n10.000", observed: { price: null, logistics: "Flex", freeShipping: null, delivery: "Flex", sponsored: false } }), 2)] })

describe("Panorama AvantPro: scope and missing values", () => {
  it("analyzes only selected offers and keeps explicit zeros", () => {
    const data = snapshot()
    data.listings[0].sales30d = 0
    const result = analyzeSelection(data, ["listing-0"], emptyProfile())
    expect(result.total).toBe(1)
    expect(result.sales30d).toBe(0)
    expect(result.pricing).toEqual({ min: 19.9, max: 19.9, median: 19.9, count: 1 })
    expect(result.logistics).toEqual({ Full: 1, Flex: 0, Normal: 0, Outros: 0, unknown: 0 })
    expect(result.sponsored).toBe(1)
    expect(result.report).not.toContain("MLB200")
  })
  it("excludes catalog sales and projected/lifetime sales from offer totals", () => {
    const result = analyzeSelection(snapshot(), ["listing-0", "listing-1", "listing-2"], emptyProfile())
    expect(result.sales30d).toBe(1234)
    expect(result.salesCoverage).toBe(1)
    expect(result.pricing.median).toBe(24.9)
    expect(result.logistics).toEqual({ Full: 1, Flex: 1, Normal: 0, Outros: 0, unknown: 1 })
    expect(result.readiness.every(row => row.status === "Sem dados")).toBe(true)
    expect(result.verdict).toBe("Dados insuficientes para concluir")
  })
  it("does not turn missing data, lower bounds or fractional counts into zero", () => {
    for (const metrics of ["Vendidos\n10.000", "Vendas (30 dias)\n100+", "Vendas (30 dias)\n1,5", "", "Vendas do vendedor\n1.234"]) {
      expect(normalizeListing(listing({ metrics }), 0).sales30d).toBeNull()
    }
    const result = analyzeSelection(snapshot(), ["listing-2"], emptyProfile())
    expect(result.sales30d).toBeNull()
    expect(result.pricing.median).toBeNull()
    expect(result.report).toContain("Sem dados")
  })
  it("accepts explicit offer-scoped 30-day sales on catalog cards", () => {
    expect(normalizeListing(listing({ catalogId: "MLB999", metrics: "Vendas (30 dias)\n999\nVendas do anúncio (30 dias)\n42" }), 0).sales30d).toBe(42)
  })
  it("identifies operational gaps only with declared account data", () => {
    const result = analyzeSelection(snapshot(), ["listing-0"], { ...emptyProfile(), full: "no", sales: "no" })
    expect(result.verdict).toBe("Entrar com plano")
    expect(result.readiness.find(row => row.key === "full")?.status).toBe("Gap")
    expect(result.readiness.find(row => row.key === "sales")?.status).toBe("Crítico")
    expect(result.report).toContain("Margem não calculada")
  })
  it("rejects empty, duplicate, oversized and foreign selections", () => {
    for (const ids of [[], ["listing-0", "listing-0"], ["foreign"], Array.from({ length: 201 }, (_, i) => `listing-${i}`)]) expect(() => analyzeSelection(snapshot(), ids, emptyProfile())).toThrow()
  })
})

describe("Market analysis HTTP contracts", () => {
  const setup = (url = "https://lista.mercadolivre.com.br/adaptador", listings = [listing()]) => {
    const app = express().use(express.json())
    const capture = vi.fn(async () => ({ url, title: "Adaptador", listings, ready: false }))
    app.use("/api/market-analysis", createMarketAnalysisRouter(capture))
    return app
  }
  it("captures authoritative server data and analyzes selected snapshot IDs", async () => {
    const app = setup()
    const captured = await request(app).post("/api/market-analysis/capture").expect(200)
    const snapshot = captured.body.snapshot
    expect(snapshot.warnings).toHaveLength(1)
    const response = await request(app).post("/api/market-analysis/analyze").send({ snapshotId: snapshot.id, selectedIds: ["listing-0"], listings: [{ price: 1 }], profile: emptyProfile() }).expect(200)
    expect(response.body.analysis.pricing.median).toBe(19.9)
    await request(app).post("/api/market-analysis/analyze").send({ snapshotId: snapshot.id, selectedIds: ["forged"] }).expect(400)
    await request(app).post("/api/market-analysis/analyze").send({ snapshotId: snapshot.id, selectedIds: ["listing-0"], profile: { full: true } }).expect(400)
  })
  it("returns actionable errors for absent or expired snapshots", async () => {
    const app = setup()
    await request(app).post("/api/market-analysis/analyze").send({ snapshotId: "missing", selectedIds: ["listing-0"] }).expect(410)
    const captured = await request(app).post("/api/market-analysis/capture").expect(200)
    const now = vi.spyOn(Date, "now").mockReturnValue(Date.now() + 31 * 60 * 1000)
    try { await request(app).post("/api/market-analysis/analyze").send({ snapshotId: captured.body.snapshot.id, selectedIds: ["listing-0"] }).expect(410) }
    finally { now.mockRestore() }
  })
  it("rejects non-marketplace captures, empty lists and oversized captures", async () => {
    await request(setup("https://mercadolivre.com.br.evil.test/")).post("/api/market-analysis/capture").expect(400)
    await request(setup(undefined, [])).post("/api/market-analysis/capture").expect(422)
    await request(setup(undefined, Array.from({ length: 201 }, () => listing()))).post("/api/market-analysis/capture").expect(422)
  })
})
