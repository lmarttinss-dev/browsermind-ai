import express from "express"
import request from "supertest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { beforeAll, afterAll, beforeEach, it, expect } from "vitest"
import suppliers from "../routes/suppliers"
import pipeline from "../routes/pipeline"
import { SupplierRecord } from "../models/supplier"
import { Product } from "../models/product"
const app = express()
app.use(express.json())
app.use("/suppliers", suppliers)
app.use("/pipeline", pipeline)
let mongo: MongoMemoryServer
beforeAll(async () => { mongo = await MongoMemoryServer.create(); await mongoose.connect(mongo.getUri()) }, 60000)
afterAll(async () => { await mongoose.disconnect(); await mongo?.stop() })
beforeEach(async () => { await SupplierRecord.deleteMany({}); await Product.deleteMany({}) })
it("creates, reads, edits and deletes a standalone supplier without affecting products", async () => {
  const product = await Product.create({ title: "Produto", url: "https://example.com" })
  const created = await request(app).post("/suppliers").send({ name: "  Fábrica  ", contact: "Ana", purchaseOrigin: "domestic" })
  expect(created.status).toBe(201)
  const id = created.body.supplier._id
  expect(created.body.supplier.name).toBe("Fábrica")
  expect(created.body.supplier.productId).toBeNull()
  expect((await request(app).get("/suppliers/" + id)).body.supplier.contact).toBe("Ana")
  const updated = await request(app).patch("/suppliers/" + id).send({ productId: String(product._id), status: "approved", notes: "Amostra aprovada" })
  expect(updated.status).toBe(200)
  expect(updated.body.supplier.productId.title).toBe("Produto")
  expect((await request(app).get("/suppliers")).body.suppliers).toHaveLength(1)
  expect((await request(app).delete("/suppliers/" + id)).status).toBe(200)
  expect(await Product.exists({ _id: product._id })).toBeTruthy()
  expect((await request(app).get("/suppliers/" + id)).status).toBe(404)
})
it("relinks and unlinks suppliers, and keeps contacts when a product is deleted", async () => {
  const first = await Product.create({ title: "Primeiro", url: "https://example.com/1" })
  const second = await Product.create({ title: "Segundo", url: "https://example.com/2" })
  const record = await SupplierRecord.create({ name: "Fornecedor", productId: first._id })
  const path = "/suppliers/" + record._id
  expect((await request(app).patch(path).send({ productId: String(second._id) })).body.supplier.productId._id).toBe(String(second._id))
  expect((await request(app).patch(path).send({ productId: null })).body.supplier.productId).toBeNull()
  await request(app).patch(path).send({ productId: String(first._id) })
  expect((await request(app).delete("/pipeline/" + first._id)).status).toBe(200)
  expect((await SupplierRecord.findById(record._id))?.productId).toBeNull()
})
it("rejects invalid input and missing product references without modifying existing data", async () => {
  for (const data of [{ name: "" }, { name: [] }, { name: "Nome", url: "javascript:alert(1)" }, { name: "Nome", email: "bad" }, { name: "Nome", status: "bad" }, { name: "Nome", productId: String(new mongoose.Types.ObjectId()) }]) {
    expect((await request(app).post("/suppliers").send(data)).status).toBe(400)
  }
  const record = await SupplierRecord.create({ name: "Original" })
  expect((await request(app).patch("/suppliers/" + record._id).send({ name: "Novo", productId: "bad" })).status).toBe(400)
  expect((await SupplierRecord.findById(record._id))?.name).toBe("Original")
  expect((await request(app).get("/suppliers/bad")).status).toBe(400)
  expect((await request(app).delete("/suppliers/" + new mongoose.Types.ObjectId())).status).toBe(404)
})

it("persists domestic fields and enforces BRL even on partial updates", async () => {
  const response = await request(app).post("/suppliers").send({ name: "Distribuidor", purchaseOrigin: "domestic", currency: "USD", priceAmount: 12.5, legalName: "Distribuidor Ltda", taxId: "Cadastro informado", city: "São Paulo", invoice: "yes", domesticFreight: "A combinar" })
  expect(response.status).toBe(201)
  expect(response.body.supplier.currency).toBe("BRL")
  expect(response.body.supplier.priceAmount).toBe(12.5)
  expect(response.body.supplier.invoice).toBe("yes")
  const changed = await request(app).patch("/suppliers/" + response.body.supplier._id).send({ currency: "EUR" })
  expect(changed.body.supplier.currency).toBe("BRL")
})
it("persists import terms, changes origin and preserves previous data", async () => {
  const response = await request(app).post("/suppliers").send({ name: "Fábrica", purchaseOrigin: "import", priceAmount: 2.125, currency: "USD", originCountry: "China", incoterm: "FOB", transportMode: "Marítimo", sample: "yes" })
  expect(response.status).toBe(201)
  const path = "/suppliers/" + response.body.supplier._id
  expect((await request(app).get(path)).body.supplier.incoterm).toBe("FOB")
  const domestic = await request(app).patch(path).send({ purchaseOrigin: "domestic", priceAmount: null })
  expect(domestic.body.supplier.currency).toBe("BRL")
  expect(domestic.body.supplier.priceAmount).toBeNull()
  expect(domestic.body.supplier.incoterm).toBe("FOB")
})
it("retains unclassified legacy data without guessing currency or price", async () => {
  const legacy = await SupplierRecord.collection.insertOne({ name: "Legado", unitPrice: "US$ 2 a 3" })
  const read = await request(app).get("/suppliers/" + legacy.insertedId)
  expect(read.body.supplier.purchaseOrigin).toBe("unknown")
  expect(read.body.supplier.priceAmount).toBeNull()
  expect(read.body.supplier.unitPrice).toBe("US$ 2 a 3")
  const update = await request(app).patch("/suppliers/" + legacy.insertedId).send({ purchaseOrigin: "import", priceAmount: 2, currency: "USD" })
  expect(update.status).toBe(200)
  expect(update.body.supplier.unitPrice).toBe("US$ 2 a 3")
})
it("rejects missing origin, invalid enums, negative prices and prices without currency", async () => {
  for (const data of [{}, { purchaseOrigin: "unknown" }, { purchaseOrigin: "invalid" }, { purchaseOrigin: "import", priceAmount: -1, currency: "USD" }, { purchaseOrigin: "import", priceAmount: "2" }, { purchaseOrigin: "import", priceAmount: 2 }, { purchaseOrigin: "domestic", invoice: "invalid" }, { purchaseOrigin: "import", sample: "invalid" }]) {
    expect((await request(app).post("/suppliers").send({ name: "Teste", ...data })).status).toBe(400)
  }
})
