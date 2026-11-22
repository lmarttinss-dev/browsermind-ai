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

describe("Category routes - CRUD completo", () => {
  it("cria, lista, consulta e remove sem excluir produtos", async () => {
    const created = await request(app).post("/categories").send({ name: "  Decoração  ", description: " Casa ", color: "#abcdef", mlCategoryUrl: "https://example.com/categoria" })
    expect(created.status).toBe(201)
    expect(created.body.category.name).toBe("Decoração")
    expect(created.body.category.slug).toBe("decoracao")
    expect(created.body.category.description).toBe("Casa")
    const id = created.body.category._id
    const product = await Product.create({ title: "Produto", url: "https://example.com", categoryId: id, category: "Decoração" })
    const other = await Category.create({ name: "Outra" })
    const otherProduct = await Product.create({ title: "Outro", url: "https://example.com/2", categoryId: other._id, category: other.name })
    const list = await request(app).get("/categories")
    expect(list.body.categories.find((item: { _id: string }) => item._id === id).productCount).toBe(1)
    const detail = await request(app).get("/categories/" + id)
    expect(detail.status).toBe(200)
    expect(detail.body.products).toHaveLength(1)
    expect(detail.body.metrics.totalProducts).toBe(1)
    expect((await request(app).delete("/categories/" + id)).status).toBe(200)
    const preserved = await Product.findById(product._id)
    expect(preserved).not.toBeNull()
    expect(preserved?.categoryId).toBeNull()
    expect(preserved?.category).toBe("")
    expect((await Product.findById(otherProduct._id))?.categoryId?.toString()).toBe(String(other._id))
    expect((await request(app).get("/categories/" + id)).status).toBe(404)
  })

  it("rejeita nomes equivalentes na criação", async () => {
    await request(app).post("/categories").send({ name: "Decoração" })
    expect((await request(app).post("/categories").send({ name: "DECORACAO" })).status).toBe(409)
  })

  it("valida campos antes de criar ou alterar", async () => {
    const category = await Category.create({ name: "Original" })
    for (const input of [{ name: "!!!" }, { name: " " }, { name: "a".repeat(201) }, { description: {} }, { description: "x".repeat(2001) }, { color: "red" }, { mlCategoryUrl: "javascript:alert(1)" }, { mlCategoryUrl: 123 }, { mlCategoryUrl: "invalid" }]) {
      expect((await request(app).post("/categories").send({ name: "Teste", ...input })).status).toBe(400)
      expect((await request(app).patch("/categories/" + category._id).send(input)).status).toBe(400)
    }
    expect((await Category.findById(category._id))?.name).toBe("Original")
    expect(await Category.countDocuments()).toBe(1)
  })

  it("retorna 400 para IDs inválidos e 404 para categorias inexistentes", async () => {
    for (const id of ["bad", String(new mongoose.Types.ObjectId())]) {
      const status = id === "bad" ? 400 : 404
      expect((await request(app).get("/categories/" + id)).status).toBe(status)
      expect((await request(app).patch("/categories/" + id).send({ description: "Teste" })).status).toBe(status)
      expect((await request(app).delete("/categories/" + id)).status).toBe(status)
    }
  })

  it("permite limpar campos opcionais sem alterar o nome", async () => {
    const category = await Category.create({ name: "Original", description: "Texto", mlCategoryUrl: "https://example.com" })
    const updated = await request(app).patch("/categories/" + category._id).send({ description: "", mlCategoryUrl: "", color: "#123456" })
    expect(updated.status).toBe(200)
    expect(updated.body.category.name).toBe("Original")
    expect(updated.body.category.description).toBe("")
    expect(updated.body.category.mlCategoryUrl).toBe("")
    expect(updated.body.category.color).toBe("#123456")
  })
})
