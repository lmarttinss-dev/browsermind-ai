import { create } from "zustand"
import { api, type Category } from "@/lib/api"

type CategoryState = {
  categories: Category[]
  selectedCategoryId: string | null
  isLoading: boolean
  error: string | null

  fetchCategories: () => Promise<void>
  createCategory: (data: Partial<Category>) => Promise<Category | null>
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>
  deleteCategory: (id: string) => Promise<void>
  setFilter: (categoryId: string | null) => void
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
  categories: [],
  selectedCategoryId: null,
  isLoading: false,
  error: null,

  fetchCategories: async () => {
    set({ isLoading: true, error: null })
    try {
      const { categories } = await api.getCategories()
      set({ categories, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro ao carregar categorias",
        isLoading: false,
      })
    }
  },

  createCategory: async (data) => {
    set({ error: null })
    try {
      const { category } = await api.createCategory(data)
      await get().fetchCategories()
      return category
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Erro ao criar categoria" })
      return null
    }
  },

  updateCategory: async (id, data) => {
    set({ error: null })
    try {
      await api.updateCategory(id, data)
      await get().fetchCategories()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Erro ao atualizar categoria" })
    }
  },

  deleteCategory: async (id) => {
    set({ error: null })
    try {
      await api.deleteCategory(id)
      if (get().selectedCategoryId === id) set({ selectedCategoryId: null })
      await get().fetchCategories()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Erro ao remover categoria" })
    }
  },

  setFilter: (categoryId) => set({ selectedCategoryId: categoryId }),
}))
