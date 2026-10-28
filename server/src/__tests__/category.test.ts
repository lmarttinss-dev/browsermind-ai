import express from "express"
import request from "supertest"
import categoryRouter from "../routes/categories"
import pipelineRouter from "../routes/pipeline"
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { Category, normalizeCategorySlug } from "../models/category"
import { Product } from "../models/product"

let mongoServer: MongoMemoryServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  await mongoose.connect(mongoServer.getUri())
  await Category.init()
}, 60000)

afterAll(async () => {
  await mongoose.disconnect()
  await mongoServer.stop()
}, 30000)

beforeEach(async () => {
  await Product.deleteMany({})
  await Category.deleteMany({})
})

describe("normalizeCategorySlug", () => {
  it("deve gerar slug lowercase com hífens", () => {
    expect(normalizeCategorySlug("Celulares > Películas")).toBe("celulares-peliculas")
  })

  it("deve remover acentos", () => {
    expect(normalizeCategorySlug("Móveis e Decoração")).toBe("moveis-e-decoracao")
  })

  it("deve remover espaços extras e caracteres especiais", () => {
    expect(normalizeCategorySlug("  Películas!! Para Celular  ")).toBe("peliculas-para-celular")
  })
})

describe("Category Model - CRUD", () => {
  it("deve criar categoria com slug automático", async () => {
    const category = await Category.create({ name: "Celulares > Películas" })
    expect(category._id).toBeDefined()
    expect(category.slug).toBe("celulares-peliculas")
    expect(category.color).toBe("#3b82f6")
    expect(category.description).toBe("")
  })

  it("deve rejeitar nome duplicado", async () => {
    await Category.create({ name: "Películas" })
    await expect(Category.create({ name: "Películas" })).rejects.toThrow()
  })

  it("deve rejeitar nome vazio", async () => {
    await expect(Category.create({ name: "" })).rejects.toThrow()
  })

  it("deve atualizar slug quando o nome muda", async () => {
    const category = await Category.create({ name: "Películas" })
    expect(category.slug).toBe("peliculas")

    category.name = "Capinhas"
    await category.save()
    expect(category.slug).toBe("capinhas")
  })
})

describe("Category - vínculo com produtos", () => {
  it("deve desvincular produtos ao remover categoria", async () => {
    const category = await Category.create({ name: "Películas" })
    const product = await Product.create({
      title: "Película Teste",
      url: "https://example.com",
      categoryId: category._id,
    })
    expect(product.categoryId?.toString()).toBe(category._id.toString())

    await Category.findByIdAndDelete(category._id)
    await Product.updateMany({ categoryId: category._id }, { $set: { categoryId: null } })

    const updated = await Product.findById(product._id)
    expect(updated?.categoryId).toBeNull()
  })
})

const app = express()
app.use(express.json())
app.use("/categories", categoryRouter)
app.use("/pipeline", pipelineRouter)

describe("Category routes - atualizacao", () => {
  it("atualiza nome, slug e produtos vinculados", async () => {
    const category = await Category.create({ name: "Nome antigo" })
    const product = await Product.create({ title: "Teste", url: "https://example.com", category: category.name, categoryId: category._id })
    const response = await request(app).patch(`/categories/${category._id}`).send({ name: "  Novo Nome  " })
    expect(response.status).toBe(200)
    expect(response.body.category.name).toBe("Novo Nome")
    expect(response.body.category.slug).toBe("novo-nome")
    expect((await Product.findById(product._id))?.category).toBe("Novo Nome")
  })

  it("retorna conflito em vez de erro generico para nome equivalente", async () => {
    const source = await Category.create({ name: "Origem" })
    await Category.create({ name: "Destino" })
    const response = await request(app).patch(`/categories/${source._id}`).send({ name: "DESTINO" })
    expect(response.status).toBe(409)
    expect(response.body.error).toContain("existe")
    expect((await Category.findById(source._id))?.name).toBe("Origem")
  })

  it("rejeita nome vazio", async () => {
    const category = await Category.create({ name: "Teste" })
    const response = await request(app).patch(`/categories/${category._id}`).send({ name: "  " })
    expect(response.status).toBe(400)
  })

  it("move apenas o produto para uma categoria existente e sincroniza o nome", async () => {
    const source = await Category.create({ name: "Origem" })
    const target = await Category.create({ name: "Destino" })
    const product = await Product.create({ title: "Teste", url: "https://example.com", category: source.name, categoryId: source._id })
    const other = await Product.create({ title: "Outro", url: "https://example.com/other", category: source.name, categoryId: source._id })
    const response = await request(app).patch(`/pipeline/${product._id}/category`).send({ categoryId: target._id })
    expect(response.status).toBe(200)
    expect(response.body.product.categoryId).toBe(String(target._id))
    expect(response.body.product.category).toBe("Destino")
    expect((await Product.findById(other._id))?.category).toBe("Origem")
  })
})
