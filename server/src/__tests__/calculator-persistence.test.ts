import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import express from "express"
import request from "supertest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { Product } from "../models/product"
import pipelineRouter from "../routes/pipeline"

const app = express()
app.use(express.json())
app.use("/api/pipeline", pipelineRouter)
let mongo: MongoMemoryServer
beforeAll(async () => {
  mongo = await MongoMemoryServer.create()
  await mongoose.connect(mongo.getUri())
})
afterAll(async () => {
  await mongoose.disconnect()
  await mongo?.stop()
})
beforeEach(async () => { await Product.deleteMany({}) })

const state = {
  version: 1, dollarRate: 5.35, productMode: "multiple",
  product: { name: "Adaptador USB", importTax: 60, quantity: 100, unitPriceDollar: 0.3, shippingDollar: 79.48, icms: 17 },
  sales: { isKit: true, salesTax: 7, salePrice: 34.9, shippingFee: 6.95, adFee: 13, packagingCost: 0.5 },
  isKit: true, kitQuantity: 2,
  source: { supplierIndex: 0, quoteIndex: 0, supplierName: "Fornecedor da cotação" },
}
const results = { unitCost: 12.62, roi: 66, contributionMargin: 23.9, profitPerUnit: 8.35, multiplier: 0.66, salePrice: 34.9, quantity: 100 }

describe("Product calculator persistence", () => {
  it("round-trips currency and separate national and imported purchase inputs", async () => {
    const product = await Product.create({ title: "Nacional", url: "https://example.com/nacional" })
    const path = `/api/pipeline/${product._id}`
    for (const currency of ["BRL", "USD"]) {
      const nationalState = { ...state, currency, domesticPurchase: { unitPrice: 20, shippingCost: 50 } }
      await request(app).patch(`${path}/calculator`).send({ ...results, calculatorState: nationalState }).expect(200)
      const { body } = await request(app).get(path).expect(200)
      expect(body.product.calculatorState).toEqual({ ...nationalState, savedAt: expect.any(String) })
    }
  })

  it("rejects unknown currencies and incomplete or negative national costs", async () => {
    const product = await Product.create({ title: "Nacional", url: "https://example.com/nacional" })
    const path = `/api/pipeline/${product._id}/calculator`
    for (const invalid of [
      { ...state, currency: "EUR" },
      { ...state, currency: "BRL" },
      { ...state, currency: "BRL", domesticPurchase: { unitPrice: 20 } },
      { ...state, currency: "BRL", domesticPurchase: { unitPrice: -1, shippingCost: 0 } },
      { ...state, currency: "BRL", domesticPurchase: { unitPrice: 20, shippingCost: -1 } },
    ]) {
      await request(app).patch(path).send({ ...results, calculatorState: invalid }).expect(400)
    }
  })

  it("round-trips every form field, kit and quote even after product/supplier changes", async () => {
    const product = await Product.create({ title: "Adaptador", url: "https://example.com" })
    const path = `/api/pipeline/${product._id}`
    await request(app).patch(`${path}/calculator`).send({ ...results, calculatorState: state }).expect(200)
    // Simulate supplier removal and a later change in the market price.
    await Product.findByIdAndUpdate(product._id, { price: 99, suppliers: [] })
    const { body } = await request(app).get(path).expect(200)
    expect(body.product.calculatorState).toEqual({ ...state, savedAt: expect.any(String) })
    expect(body.product.analysisReport).toContain("12.62")
    const list = await request(app).get("/api/pipeline").expect(200)
    expect(list.body.products.triagem[0].calculatorState).toEqual(body.product.calculatorState)
  })

  it("updates the saved calculation on the same product without affecting another", async () => {
    const first = await Product.create({ title: "Primeiro", url: "https://first.example" })
    const second = await Product.create({ title: "Segundo", url: "https://second.example" })
    const path = `/api/pipeline/${first._id}/calculator`
    await request(app).patch(path).send({ ...results, calculatorState: state }).expect(200)
    const updated = { ...state, dollarRate: 6, isKit: false, source: null, sales: { ...state.sales, isKit: false, adFee: 0 } }
    await request(app).patch(path).send({ ...results, calculatorState: updated }).expect(200)
    expect((await request(app).get(`/api/pipeline/${first._id}`)).body.product.calculatorState)
      .toEqual({ ...updated, savedAt: expect.any(String) })
    expect((await Product.findById(second._id))?.calculatorState).toBeUndefined()
  })

  it("rejects incomplete or invalid form inputs without overwriting a valid saved calculation", async () => {
    const product = await Product.create({ title: "Produto", url: "https://example.com" })
    const path = `/api/pipeline/${product._id}/calculator`
    await request(app).patch(path).send({ ...results, calculatorState: state }).expect(200)
    for (const invalid of [{ ...state, product: undefined }, { ...state, dollarRate: 0 }, { ...state, product: { ...state.product, icms: 100 } }]) {
      await request(app).patch(path).send({ ...results, calculatorState: invalid }).expect(400)
    }
    await request(app).patch(path).send({ ...results, roi: "invalid", calculatorState: state }).expect(400)
    const read = await request(app).get(`/api/pipeline/${product._id}`).expect(200)
    expect(read.body.product.calculatorState.dollarRate).toBe(5.35)
  })

  it("keeps legacy products and result-only clients compatible", async () => {
    const product = await Product.create({ title: "Antigo", url: "https://example.com" })
    const path = `/api/pipeline/${product._id}`
    expect((await request(app).get(path)).body.product.calculatorState).toBeUndefined()
    await request(app).patch(`${path}/calculator`).send(results).expect(200)
    expect((await request(app).get(path)).body.product.calculatorState).toBeUndefined()
  })
})
