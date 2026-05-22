import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import express from "express"
import request from "supertest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { Product, PIPELINE_STAGES } from "../models/product"
import pipelineRouter from "../routes/pipeline"

let mongoServer: MongoMemoryServer
const app = express()
app.use(express.json())
app.use("/api/pipeline", pipelineRouter)

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
})

beforeEach(async () => {
  await Product.deleteMany({})
})

const sampleProduct = {
  title: "Película Galaxy S24 Ultra Hydrogel",
  url: "https://www.mercadolivre.com.br/pelicula-s24/p/MLB123",
  imageUrl: "https://http2.mlstatic.com/D_NQ_NP_123.jpg",
  price: 29.9,
  category: "Celulares > Películas",
  score: 8,
  monthlySales: 1200,
  competitionLevel: "Baixa",
  potentialMargin: "45%",
  analysisReport: "# Relatório\n\nProduto viável para importação.",
}

describe("Pipeline API - E2E", () => {
  describe("POST /api/pipeline - Criar produto", () => {
    it("deve criar produto e retornar com _id e stage triagem", async () => {
      const res = await request(app)
        .post("/api/pipeline")
        .send(sampleProduct)
        .expect(201)

      expect(res.body.success).toBe(true)
      expect(res.body.product._id).toBeDefined()
      expect(res.body.product.title).toBe(sampleProduct.title)
      expect(res.body.product.stage).toBe("triagem")
      expect(res.body.product.order).toBe(0)
    })

    it("deve auto-incrementar order ao adicionar múltiplos produtos", async () => {
      await request(app).post("/api/pipeline").send(sampleProduct)
      const res = await request(app).post("/api/pipeline").send({ ...sampleProduct, title: "Produto 2" })

      expect(res.body.product.order).toBe(1)
    })

    it("deve retornar erro 500 se dados inválidos", async () => {
      const res = await request(app)
        .post("/api/pipeline")
        .send({ price: 10 }) // sem title e url

      expect(res.status).toBe(500)
      expect(res.body.error).toBeDefined()
    })
  })

  describe("GET /api/pipeline - Listar produtos", () => {
    it("deve retornar todos os stages vazios inicialmente", async () => {
      const res = await request(app).get("/api/pipeline").expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.products).toBeDefined()
      for (const stage of PIPELINE_STAGES) {
        expect(res.body.products[stage]).toEqual([])
      }
    })

    it("deve retornar produtos agrupados por stage", async () => {
      await Product.create([
        { ...sampleProduct, title: "A", stage: "triagem", order: 0 },
        { ...sampleProduct, title: "B", stage: "triagem", order: 1 },
        { ...sampleProduct, title: "C", stage: "analise", order: 0 },
      ])

      const res = await request(app).get("/api/pipeline").expect(200)

      expect(res.body.products.triagem).toHaveLength(2)
      expect(res.body.products.analise).toHaveLength(1)
      expect(res.body.products.aprovado).toHaveLength(0)
    })

    it("deve retornar produtos ordenados por order", async () => {
      await Product.create([
        { ...sampleProduct, title: "Segundo", stage: "triagem", order: 1 },
        { ...sampleProduct, title: "Primeiro", stage: "triagem", order: 0 },
      ])

      const res = await request(app).get("/api/pipeline").expect(200)

      expect(res.body.products.triagem[0].title).toBe("Primeiro")
      expect(res.body.products.triagem[1].title).toBe("Segundo")
    })
  })

  describe("PATCH /api/pipeline/:id - Atualizar produto", () => {
    it("deve atualizar campos do produto", async () => {
      const product = await Product.create(sampleProduct)

      const res = await request(app)
        .patch(`/api/pipeline/${product._id}`)
        .send({ price: 39.9, score: 9 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.product.price).toBe(39.9)
      expect(res.body.product.score).toBe(9)
      expect(res.body.product.title).toBe(sampleProduct.title) // não alterado
    })

    it("deve retornar 404 para id inexistente", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await request(app)
        .patch(`/api/pipeline/${fakeId}`)
        .send({ price: 50 })
        .expect(404)

      expect(res.body.error).toBe("Produto não encontrado")
    })
  })

  describe("PATCH /api/pipeline/:id/move - Mover produto", () => {
    it("deve mover produto para outra coluna", async () => {
      const product = await Product.create({ ...sampleProduct, stage: "triagem", order: 0 })

      const res = await request(app)
        .patch(`/api/pipeline/${product._id}/move`)
        .send({ stage: "analise", order: 0 })
        .expect(200)

      expect(res.body.success).toBe(true)
      expect(res.body.product.stage).toBe("analise")
      expect(res.body.product.order).toBe(0)
    })

    it("deve reordenar produtos existentes na coluna destino", async () => {
      const existing = await Product.create([
        { ...sampleProduct, title: "Já estava", stage: "analise", order: 0 },
      ])
      const toMove = await Product.create({ ...sampleProduct, title: "Movido", stage: "triagem", order: 0 })

      await request(app)
        .patch(`/api/pipeline/${toMove._id}/move`)
        .send({ stage: "analise", order: 0 })
        .expect(200)

      // Produto existente deve ter sido empurrado para order 1
      const updated = await Product.findById(existing[0]._id)
      expect(updated?.order).toBe(1)
    })

    it("deve rejeitar stage inválido", async () => {
      const product = await Product.create(sampleProduct)

      const res = await request(app)
        .patch(`/api/pipeline/${product._id}/move`)
        .send({ stage: "invalido", order: 0 })
        .expect(400)

      expect(res.body.error).toBe("Stage inválido")
    })

    it("deve retornar 404 para id inexistente", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await request(app)
        .patch(`/api/pipeline/${fakeId}/move`)
        .send({ stage: "analise", order: 0 })
        .expect(404)

      expect(res.body.error).toBe("Produto não encontrado")
    })
  })

  describe("DELETE /api/pipeline/:id - Remover produto", () => {
    it("deve remover produto e retornar sucesso", async () => {
      const product = await Product.create(sampleProduct)

      const res = await request(app)
        .delete(`/api/pipeline/${product._id}`)
        .expect(200)

      expect(res.body.success).toBe(true)

      const found = await Product.findById(product._id)
      expect(found).toBeNull()
    })

    it("deve retornar 404 para id inexistente", async () => {
      const fakeId = new mongoose.Types.ObjectId().toString()
      const res = await request(app)
        .delete(`/api/pipeline/${fakeId}`)
        .expect(404)

      expect(res.body.error).toBe("Produto não encontrado")
    })
  })

  describe("Fluxo completo: Triagem → Concluído", () => {
    it("deve percorrer toda a esteira", async () => {
      // 1. Criar produto (entra em triagem)
      const createRes = await request(app)
        .post("/api/pipeline")
        .send(sampleProduct)
        .expect(201)

      const productId = createRes.body.product._id
      expect(createRes.body.product.stage).toBe("triagem")

      // 2. Mover para análise
      await request(app)
        .patch(`/api/pipeline/${productId}/move`)
        .send({ stage: "analise", order: 0 })
        .expect(200)

      // 3. Mover para aprovado
      await request(app)
        .patch(`/api/pipeline/${productId}/move`)
        .send({ stage: "aprovado", order: 0 })
        .expect(200)

      // 4. Mover para importando
      await request(app)
        .patch(`/api/pipeline/${productId}/move`)
        .send({ stage: "importando", order: 0 })
        .expect(200)

      // 5. Mover para concluído
      await request(app)
        .patch(`/api/pipeline/${productId}/move`)
        .send({ stage: "concluido", order: 0 })
        .expect(200)

      // Verificar estado final
      const listRes = await request(app).get("/api/pipeline").expect(200)
      expect(listRes.body.products.triagem).toHaveLength(0)
      expect(listRes.body.products.concluido).toHaveLength(1)
      expect(listRes.body.products.concluido[0]._id).toBe(productId)
      expect(listRes.body.products.concluido[0].title).toBe(sampleProduct.title)
    })
  })
})
