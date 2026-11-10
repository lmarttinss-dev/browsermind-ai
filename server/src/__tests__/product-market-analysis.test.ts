import express from "express"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import request from "supertest"
import { afterAll, beforeAll, expect, it, vi } from "vitest"
import { emptyProfile, normalizeListing } from "../market-analysis.js"
import { Product } from "../models/product.js"
import { savedListingRepository } from "../models/saved-market-listing.js"
import { createMarketAnalysisRouter } from "../routes/market-analysis.js"

let mongo: MongoMemoryServer
beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
}, 60_000)
afterAll(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})

const listing = {
  positions: [1], itemId: "MLB123", catalogId: null, title: "Oferta concorrente", seller: "Loja",
  url: "https://produto.mercadolivre.com.br/MLB-123-_JM", advertising: false, metrics: "Vendas (30 dias)\n42",
}
const capture = async () => ({ url: listing.url, title: listing.title, listings: [listing], ready: true })
const narrate = vi.fn(async (model: string) => ({ model, text: "Diagnóstico da amostra", generatedAt: new Date().toISOString() }))
const createApp = () => express().use(express.json()).use("/market", createMarketAnalysisRouter(capture, narrate, savedListingRepository))

it("persists a complete panorama for the chosen product and retrieves it without the original listings or router", async () => {
  const product = await Product.create({ title: "Adaptador da esteira", url: "https://example.com/usb" })
  const other = await Product.create({ title: "Outro produto", url: "https://example.com/outro" })
  const productId = product.id
  const path = `/market/products/${productId}`
  const app = createApp()
  const profile = { ...emptyProfile(), full: "yes" }
  expect((await request(app).get(path).expect(200)).body).toEqual({ success: true, title: product.title, analysis: null })

  const { body: { savedId } } = await request(app).post("/market/save-current").expect(200)
  const payload = { savedListingIds: [savedId], model: "gpt-4.1", profile, productId }
  const { body: { analysis } } = await request(app).post("/market/analyze").send(payload).expect(200)
  expect(analysis).toMatchObject({
    title: product.title, profile, selectedIds: [savedId], sales30d: 42, ai: { text: "Diagnóstico da amostra" },
  })
  expect((await Product.findById(productId))?.avantproAnalysis).toBeUndefined()
  expect((await request(app).get(`/market/products/${other.id}`).expect(200)).body.analysis).toBeNull()

  const reopened = createApp()
  await request(reopened).delete(`/market/listings/${savedId}`).expect(200)
  await Product.updateOne({ _id: productId }, { $set: { stage: "analise" } })
  expect((await request(reopened).get(path).expect(200)).body.analysis).toEqual(analysis)
  expect(narrate).toHaveBeenCalledTimes(1)

  const recaptured = await request(reopened).post("/market/save-current").expect(200)
  const updated = { ...payload, savedListingIds: [recaptured.body.savedId], profile: { ...profile, full: "no" } }
  narrate.mockRejectedValueOnce(new Error("Provider offline"))
  await request(reopened).post("/market/analyze").send(updated).expect(502)
  expect((await request(reopened).get(path).expect(200)).body.analysis).toEqual(analysis)

  const { body: { analysis: latest } } = await request(reopened).post("/market/analyze").send(updated).expect(200)
  expect(latest.profile.full).toBe("no")
  expect((await request(reopened).get(path).expect(200)).body.analysis).toEqual(latest)

  const another = normalizeListing({ ...listing, itemId: "MLB456" }, 1)
  const retained = normalizeListing({ ...listing, itemId: "MLB789" }, 2)
  await savedListingRepository.save("MLB456", another)
  await savedListingRepository.save("MLB789", retained)
  const bulkPath = "/market/listings/bulk-delete"
  const ids = [recaptured.body.savedId, another.id]
  await request(reopened).post(bulkPath).send({ ids: [ids[0], { $ne: "" }] }).expect(400)
  const deleted = await request(reopened).post(bulkPath).send({ ids }).expect(200)
  expect(deleted.body.deletedCount).toBe(2)
  expect(deleted.body.snapshot.listings.map((row: { id: string }) => row.id)).toEqual([retained.id])
  expect((await request(reopened).post(bulkPath).send({ ids }).expect(200)).body.deletedCount).toBe(0)
  expect((await request(reopened).get(path).expect(200)).body.analysis).toEqual(latest)

  await Product.deleteOne({ _id: productId })
  await request(reopened).get(path).expect(404)
  await request(reopened).get("/market/products/invalid").expect(400)
  await request(reopened).post("/market/analyze").send(updated).expect(404)
  await request(reopened).post("/market/analyze").send({ ...updated, productId: null }).expect(400)
  expect(narrate).toHaveBeenCalledTimes(3)
})
