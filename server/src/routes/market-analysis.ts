import { validatePdfReport, createMarketReportPdf } from "../market-report-pdf.js"
import type { SavedListingRepository } from "../models/saved-market-listing.js"
import { MARKET_MODELS, type MarketAnalysis, type MarketNarrative, type SelectionAnalysis } from "../market-analysis-ai.js"
import { Product } from "../models/product.js"
import { isObjectIdOrHexString } from "mongoose"
import { randomUUID } from "node:crypto"
import { Router } from "express"
import { analyzeSelection, normalizeListing, emptyProfile, PROFILE_KEYS, type MarketSnapshot } from "../market-analysis.js"
import type { CompetitorListing } from "../competitor-listings.js"

type Capture = () => Promise<{ url: string; title: string; listings: CompetitorListing[]; ready: boolean }>
const TTL = 30 * 60 * 1000
export function createMarketAnalysisRouter(capture: Capture, narrate?: (model: string, analysis: SelectionAnalysis) => Promise<MarketNarrative>, repository?: SavedListingRepository) {
  const router = Router()
  router.get("/products/:productId", async (req, res) => {
    const { productId } = req.params
    if (!isObjectIdOrHexString(productId)) return res.status(400).json({ error: "ID de produto inválido." })
    try {
      const product = await Product.findById(productId).select("title avantproAnalysis").lean()
      if (!product) return res.status(404).json({ error: "Produto da esteira não encontrado." })
      res.json({ success: true, title: product.title, analysis: product.avantproAnalysis ?? null })
    } catch {
      res.status(500).json({ error: "Não foi possível carregar o panorama do produto." })
    }
  })
  router.post("/export-pdf", async (req, res) => {
    let data: ReturnType<typeof validatePdfReport>
    try { data = validatePdfReport(req.body?.analysis) }
    catch { return res.status(400).json({ error: "Relatório inválido para exportar em PDF." }) }
    try {
      const pdf = await createMarketReportPdf(data)
      res.setHeader("Content-Type", "application/pdf")
      res.setHeader("Content-Disposition", `attachment; filename="panorama-avantpro-${new Date(data.analyzedAt).toISOString().slice(0, 10)}.pdf"`)
      res.send(pdf)
    } catch { res.status(500).json({ error: "Não foi possível gerar o PDF. Tente novamente." }) }
  })
  const snapshots = new Map<string, MarketSnapshot>()
  const memory = new Map<string, { identity: string; listing: ReturnType<typeof normalizeListing> }>()
  const store: SavedListingRepository = repository || {
    async list() { return [...memory.values()].map(row => row.listing) },
    async save(identity, listing) { memory.set(listing.id, { identity, listing }) },
    async remove(ids) { return ids.filter(id => memory.delete(id)).length },
  }
  const collection = (listings: Awaited<ReturnType<typeof store.list>>) => ({ id: "saved", url: listings[0]?.url || "", title: "Anúncios capturados individualmente", capturedAt: new Date().toISOString(), listings,
    warnings: ["Ads pode ser declarado pelo usuário ou identificado pelo ad_click_id da URL. Acesso por Ads não comprova campanha ativa agora.", "Cada ficha tem sua própria data de captura. Os valores do AvantPro são considerados também nos anúncios de catálogo."] })
  router.get("/listings", async (_req, res) => {
    try { res.json({ success: true, snapshot: collection(await store.list()) }) }
    catch { res.status(500).json({ error: "Não foi possível carregar as fichas salvas." }) }
  })
  router.patch("/listings/:id/ads", async (req, res) => {
    const status = req.body?.adsStatus
    if (!["yes", "no", "unknown"].includes(status)) return res.status(400).json({ error: "Informe Sim, Não ou Não informado para Ads." })
    try {
      const listing = (await store.list()).find(row => row.id === req.params.id)
      if (!listing) return res.status(404).json({ error: "Ficha não encontrada." })
      const identity = listing.itemId || (listing.catalogId && listing.seller ? [listing.catalogId, listing.seller].join("|") : listing.url!)
      await store.save(identity, { ...listing, adsStatus: status, sponsored: status === "unknown" ? !!listing.observed?.sponsored : status === "yes" })
      res.json({ success: true, snapshot: collection(await store.list()) })
    } catch { res.status(500).json({ error: "Não foi possível salvar a informação de Ads." }) }
  })
  router.delete("/listings/:id", async (req, res) => {
    try { await store.remove([req.params.id as string]); res.json({ success: true, snapshot: collection(await store.list()) }) }
    catch { res.status(500).json({ error: "Não foi possível remover a ficha." }) }
  })
  router.post("/listings/bulk-delete", async (req, res) => {
    const ids: unknown = req.body?.ids
    if (!Array.isArray(ids) || !ids.length || ids.length > 200 || !ids.every(id => typeof id === "string" && id.trim())) {
      return res.status(400).json({ error: "Selecione de 1 a 200 fichas válidas para excluir." })
    }
    try {
      const deletedCount = await store.remove(ids)
      res.json({ success: true, deletedCount, snapshot: collection(await store.list()) })
    } catch {
      res.status(500).json({ error: "Não foi possível excluir as fichas selecionadas." })
    }
  })
  router.post("/save-current", async (_req, res) => {
    try {
      const data = await capture()
      if (data.listings.length !== 1) return res.status(422).json({ error: "Abra um anúncio individual para capturar. Listagens não são aceitas." })
      const row = data.listings[0]
      const url = new URL(data.url)
      if (url.protocol !== "https:" || !/(^|\.)mercadolivre\.com\.br$/i.test(url.hostname)) return res.status(400).json({ error: "Abra um anúncio do Mercado Livre." })
      const identity = row.itemId || (row.catalogId && row.seller ? [row.catalogId, row.seller].join("|") : row.url!)
      const existing = await store.list()
      const previous = existing.find(saved => (saved.itemId || (saved.catalogId && saved.seller ? [saved.catalogId, saved.seller].join("|") : saved.url!)) === identity)
      if (!previous && existing.length >= 200) return res.status(422).json({ error: "Limite de 200 fichas. Remova anúncios antes de salvar novos." })
      const listing = { ...normalizeListing(row, 0), id: previous?.id || randomUUID(), adsStatus: previous?.adsStatus || "unknown" as const }
      if (listing.adsStatus !== "unknown") listing.sponsored = listing.adsStatus === "yes"
      await store.save(identity, listing)
      res.json({ success: true, savedId: listing.id, snapshot: collection(await store.list()), warning: data.ready ? null : "Anúncio salvo sem métricas AvantPro. Confira a extensão e recapture." })
    } catch (error) { res.status(409).json({ error: error instanceof Error ? error.message : "Não foi possível salvar o anúncio." }) }
  })
  router.post("/capture", async (_req, res) => {
    try {
      const data = await capture()
      const url = new URL(data.url)
      if (url.protocol !== "https:" || !/(^|\.)mercadolivre\.com\.br$/i.test(url.hostname)) return res.status(400).json({ error: "Abra uma busca do Mercado Livre no Browser antes de capturar." })
      if (!data.listings.length) return res.status(422).json({ error: "Nenhum anúncio encontrado. Abra uma listagem e aguarde os cards carregarem." })
      if (data.listings.length > 200) return res.status(422).json({ error: "Limite de 200 anúncios por captura. Refine a busca." })
      for (const [id, snapshot] of snapshots) if (Date.now() - Date.parse(snapshot.capturedAt) > TTL) snapshots.delete(id)
      if (snapshots.size >= 20) snapshots.delete(snapshots.keys().next().value!)
      const snapshot: MarketSnapshot = { id: randomUUID(), url: data.url, title: data.title, capturedAt: new Date().toISOString(),
        listings: data.listings.map(normalizeListing), warnings: data.ready ? [] : ["AvantPro sem métricas prontas em todos os cards. Confira a extensão e a autenticação antes de recapturar."] }
      snapshots.set(snapshot.id, snapshot)
      res.json({ success: true, snapshot })
    } catch (error) { res.status(409).json({ error: error instanceof Error ? error.message : "Não foi possível capturar os anúncios." }) }
  })
  router.post("/analyze", async (req, res) => {
    let { snapshotId, selectedIds, model, profile = emptyProfile() } = req.body || {}
    const productId: unknown = req.body?.productId
    if (productId !== undefined && (typeof productId !== "string" || !isObjectIdOrHexString(productId))) {
      return res.status(400).json({ error: "ID de produto inválido." })
    }
    const savedIds = req.body?.savedListingIds
    let savedSnapshot: MarketSnapshot | undefined
    if (savedIds !== undefined) {
      if (!Array.isArray(savedIds) || !savedIds.length || savedIds.length > 200 || !savedIds.every(id => typeof id === "string")) return res.status(400).json({ error: "Selecione de 1 a 200 fichas válidas." })
      try { savedSnapshot = collection((await store.list()).filter(row => savedIds.includes(row.id))) }
      catch { return res.status(500).json({ error: "Não foi possível consultar as fichas salvas." }) }
      snapshotId = "saved"; selectedIds = savedIds
    }
    if (typeof snapshotId !== "string" || !Array.isArray(selectedIds) || !selectedIds.every(id => typeof id === "string") || !profile || typeof profile !== "object" || !PROFILE_KEYS.every(key => ["yes", "no", "unknown"].includes(profile[key]))) return res.status(400).json({ error: "Seleção ou perfil da conta inválido." })
    const snapshot = savedSnapshot || snapshots.get(snapshotId)
    if (!snapshot || (!savedSnapshot && Date.now() - Date.parse(snapshot.capturedAt) > TTL)) { snapshots.delete(snapshotId); return res.status(410).json({ error: "Captura expirada. Capture os anúncios novamente (validade: 30 minutos)." }) }
    let title = snapshot.title
    if (productId !== undefined) {
      try {
        const product = await Product.findById(productId).select("title").lean()
        if (!product) return res.status(404).json({ error: "Produto da esteira não encontrado." })
        title = product.title
      } catch {
        return res.status(500).json({ error: "Não foi possível consultar o produto da esteira." })
      }
    }
    let analysis: MarketAnalysis
    try { analysis = analyzeSelection({ ...snapshot, title }, selectedIds, Object.fromEntries(PROFILE_KEYS.map(key => [key, profile[key]])) as typeof profile) }
    catch (error) { return res.status(400).json({ error: error instanceof Error ? error.message : "Seleção inválida." }) }
    if (narrate) {
      if (!MARKET_MODELS.includes(model)) return res.status(400).json({ error: "Selecione um modelo de IA válido." })
      try {
        const ai = await narrate(model, analysis)
        const report = ai.sections ? ai.text : `${analysis.report}\n\n## Análise pelo modelo (${ai.model})\n\n${ai.text}`
        analysis = { ...analysis, ai, report }
      } catch (error) {
        // Provider errors may contain request headers/credentials: never return their payload.
        const message = error instanceof Error && /^(Chave .* não configurada|Resposta vazia|O modelo retornou)/.test(error.message)
          ? error.message : "Não foi possível obter a análise do modelo. Confira a configuração e tente novamente."
        return res.status(502).json({ error: message })
      }
    }
    if (productId !== undefined) {
      try {
        const { matchedCount } = await Product.updateOne({ _id: productId }, { $set: { avantproAnalysis: analysis } })
        if (!matchedCount) return res.status(404).json({ error: "Produto da esteira não encontrado." })
      } catch {
        return res.status(500).json({ error: "Não foi possível salvar o panorama do produto." })
      }
    }
    res.json({ success: true, analysis })
  })
  return router
}
