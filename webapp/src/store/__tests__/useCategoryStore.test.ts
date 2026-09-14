import { describe, it, expect, vi, beforeEach } from "vitest"
import { useCategoryStore } from "@/store/useCategoryStore"
import type { Category } from "@/lib/api"

vi.mock("@/lib/api", () => ({
  api: {
    getCategories: vi.fn(),
    createCategory: vi.fn(),
    updateCategory: vi.fn(),
    deleteCategory: vi.fn(),
  },
}))

import { api } from "@/lib/api"

const mockCategory = (overrides: Partial<Category> = {}): Category => ({
  _id: "cat_1",
  name: "Películas",
  slug: "peliculas",
  description: "",
  color: "#3b82f6",
  mlCategoryUrl: "",
  productCount: 0,
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
  ...overrides,
})

describe("useCategoryStore", () => {
  beforeEach(() => {
    useCategoryStore.setState({
      categories: [],
      selectedCategoryId: null,
      isLoading: false,
      error: null,
    })
    vi.clearAllMocks()
  })

  it("deve iniciar sem categorias e sem filtro", () => {
    const state = useCategoryStore.getState()
    expect(state.categories).toHaveLength(0)
    expect(state.selectedCategoryId).toBeNull()
    expect(state.isLoading).toBe(false)
  })

  describe("fetchCategories", () => {
    it("deve carregar categorias", async () => {
      vi.mocked(api.getCategories).mockResolvedValue({ success: true, categories: [mockCategory()] })

      await useCategoryStore.getState().fetchCategories()

      expect(useCategoryStore.getState().categories).toHaveLength(1)
      expect(useCategoryStore.getState().isLoading).toBe(false)
      expect(useCategoryStore.getState().error).toBeNull()
    })

    it("deve setar erro se fetch falhar", async () => {
      vi.mocked(api.getCategories).mockRejectedValue(new Error("Network error"))

      await useCategoryStore.getState().fetchCategories()

      expect(useCategoryStore.getState().error).toBe("Network error")
      expect(useCategoryStore.getState().isLoading).toBe(false)
    })
  })

  describe("createCategory", () => {
    it("deve criar categoria e atualizar a lista", async () => {
      vi.mocked(api.createCategory).mockResolvedValue({ success: true, category: mockCategory() })
      vi.mocked(api.getCategories).mockResolvedValue({ success: true, categories: [mockCategory()] })

      const category = await useCategoryStore.getState().createCategory({ name: "Películas" })

      expect(category).not.toBeNull()
      expect(api.createCategory).toHaveBeenCalledWith({ name: "Películas" })
    })
  })

  describe("deleteCategory", () => {
    it("deve limpar o filtro se a categoria removida for a selecionada", async () => {
      useCategoryStore.setState({ selectedCategoryId: "cat_1" })
      vi.mocked(api.deleteCategory).mockResolvedValue({ success: true })
      vi.mocked(api.getCategories).mockResolvedValue({ success: true, categories: [] })

      await useCategoryStore.getState().deleteCategory("cat_1")

      expect(useCategoryStore.getState().selectedCategoryId).toBeNull()
    })
  })

  describe("setFilter", () => {
    it("deve definir o filtro", () => {
      useCategoryStore.getState().setFilter("cat_1")
      expect(useCategoryStore.getState().selectedCategoryId).toBe("cat_1")

      useCategoryStore.getState().setFilter(null)
      expect(useCategoryStore.getState().selectedCategoryId).toBeNull()
    })
  })
})
