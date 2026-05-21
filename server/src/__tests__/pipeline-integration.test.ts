import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { Product, PIPELINE_STAGES } from "../models/product"

let mongoServer: MongoMemoryServer

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
  stage: "triagem" as const,
  score: 8,
  monthlySales: 1200,
  competitionLevel: "Baixa" as const,
  potentialMargin: "45%",
  analysisReport: "# Relatório de Análise\n\nProduto viável...",
  order: 0,
}

describe("Product Model - CRUD", () => {
  it("deve criar um produto com dados válidos", async () => {
    const product = await Product.create(sampleProduct)
    expect(product._id).toBeDefined()
    expect(product.title).toBe(sampleProduct.title)
    expect(product.url).toBe(sampleProduct.url)
    expect(product.price).toBe(29.9)
    expect(product.stage).toBe("triagem")
    expect(product.score).toBe(8)
    expect(product.createdAt).toBeDefined()
    expect(product.updatedAt).toBeDefined()
  })

  it("deve criar produto com valores padrão", async () => {
    const product = await Product.create({ title: "Produto Mínimo", url: "https://example.com" })
    expect(product.stage).toBe("triagem")
    expect(product.score).toBe(0)
    expect(product.monthlySales).toBe(0)
    expect(product.competitionLevel).toBe("Média")
    expect(product.imageUrl).toBe("")
    expect(product.price).toBe(0)
    expect(product.order).toBe(0)
  })

  it("deve falhar sem título", async () => {
    await expect(Product.create({ url: "https://example.com" })).rejects.toThrow()
  })

  it("deve falhar sem URL", async () => {
    await expect(Product.create({ title: "Sem URL" })).rejects.toThrow()
  })

  it("deve falhar com stage inválido", async () => {
    await expect(Product.create({ ...sampleProduct, stage: "invalido" })).rejects.toThrow()
  })

  it("deve falhar com competitionLevel inválido", async () => {
    await expect(Product.create({ ...sampleProduct, competitionLevel: "Inexistente" })).rejects.toThrow()
  })

  it("deve limitar score entre 0 e 10", async () => {
    const productMin = await Product.create({ ...sampleProduct, score: 0 })
    expect(productMin.score).toBe(0)

    const productMax = await Product.create({ ...sampleProduct, score: 10 })
    expect(productMax.score).toBe(10)
  })

  it("deve atualizar um produto", async () => {
    const product = await Product.create(sampleProduct)
    const updated = await Product.findByIdAndUpdate(
      product._id,
      { price: 39.9, stage: "analise" },
      { new: true }
    )
    expect(updated?.price).toBe(39.9)
    expect(updated?.stage).toBe("analise")
  })

  it("deve deletar um produto", async () => {
    const product = await Product.create(sampleProduct)
    await Product.findByIdAndDelete(product._id)
    const found = await Product.findById(product._id)
    expect(found).toBeNull()
  })
})

describe("Product Model - Queries", () => {
  beforeEach(async () => {
    await Product.create([
      { ...sampleProduct, title: "Produto A", stage: "triagem", order: 0 },
      { ...sampleProduct, title: "Produto B", stage: "triagem", order: 1 },
      { ...sampleProduct, title: "Produto C", stage: "analise", order: 0 },
      { ...sampleProduct, title: "Produto D", stage: "aprovado", order: 0 },
      { ...sampleProduct, title: "Produto E", stage: "importando", order: 0 },
    ])
  })

  it("deve listar produtos agrupados por stage", async () => {
    const products = await Product.find().sort({ stage: 1, order: 1 })
    const grouped = Object.fromEntries(
      PIPELINE_STAGES.map(stage => [stage, products.filter(p => p.stage === stage)])
    )

    expect(grouped.triagem).toHaveLength(2)
    expect(grouped.analise).toHaveLength(1)
    expect(grouped.aprovado).toHaveLength(1)
    expect(grouped.importando).toHaveLength(1)
    expect(grouped.concluido).toHaveLength(0)
  })

  it("deve ordenar por order dentro do stage", async () => {
    const triagem = await Product.find({ stage: "triagem" }).sort({ order: 1 })
    expect(triagem[0].title).toBe("Produto A")
    expect(triagem[1].title).toBe("Produto B")
  })

  it("deve encontrar o último produto por order", async () => {
    const last = await Product.findOne({ stage: "triagem" }).sort({ order: -1 })
    expect(last?.title).toBe("Produto B")
    expect(last?.order).toBe(1)
  })
})

describe("Product Model - Movimentação entre colunas", () => {
  it("deve mover produto para outra coluna", async () => {
    const product = await Product.create({ ...sampleProduct, stage: "triagem", order: 0 })

    await Product.findByIdAndUpdate(product._id, { stage: "analise", order: 0 }, { new: true })

    const moved = await Product.findById(product._id)
    expect(moved?.stage).toBe("analise")
    expect(moved?.order).toBe(0)
  })

  it("deve reordenar produtos ao inserir no meio", async () => {
    await Product.create([
      { ...sampleProduct, title: "A", stage: "analise", order: 0 },
      { ...sampleProduct, title: "B", stage: "analise", order: 1 },
      { ...sampleProduct, title: "C", stage: "analise", order: 2 },
    ])

    // Simular inserção na posição 1 (empurra B e C para baixo)
    await Product.updateMany(
      { stage: "analise", order: { $gte: 1 } },
      { $inc: { order: 1 } }
    )

    const newProduct = await Product.create({
      ...sampleProduct,
      title: "Inserido",
      stage: "analise",
      order: 1,
    })

    const all = await Product.find({ stage: "analise" }).sort({ order: 1 })
    expect(all[0].title).toBe("A")
    expect(all[0].order).toBe(0)
    expect(all[1].title).toBe("Inserido")
    expect(all[1].order).toBe(1)
    expect(all[2].title).toBe("B")
    expect(all[2].order).toBe(2)
    expect(all[3].title).toBe("C")
    expect(all[3].order).toBe(3)
  })
})
