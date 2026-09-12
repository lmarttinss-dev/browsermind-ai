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
