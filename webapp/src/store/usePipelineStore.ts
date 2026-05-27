import { create } from "zustand"
import { api, type PipelineProduct, type PipelineStage, type ComparisonResult } from "@/lib/api"

type PipelineState = {
  products: Record<PipelineStage, PipelineProduct[]>
  isLoading: boolean
  error: string | null
  comparison: ComparisonResult | null
  isComparing: boolean
  showComparison: boolean

  fetchProducts: () => Promise<void>
  moveProduct: (id: string, stage: PipelineStage, order: number) => Promise<void>
  deleteProduct: (id: string) => Promise<void>
  compareProducts: (model: string) => Promise<void>
  clearComparison: () => void
  confirmTopProducts: (productIds: string[]) => Promise<void>
}

const EMPTY_STAGES: Record<PipelineStage, PipelineProduct[]> = {
  triagem: [],
  analise: [],
  aprovado: [],
  importando: [],
  concluido: [],
}

export const usePipelineStore = create<PipelineState>((set, get) => ({
  products: { ...EMPTY_STAGES },
  isLoading: false,
  error: null,
  comparison: null,
  isComparing: false,
  showComparison: false,

  fetchProducts: async () => {
    set({ isLoading: true, error: null })
    try {
      const { products } = await api.getPipelineProducts()
      set({ products: { ...EMPTY_STAGES, ...products }, isLoading: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Erro ao carregar produtos", isLoading: false })
    }
  },

  moveProduct: async (id, stage, order) => {
    const prev = get().products
    try {
      await api.movePipelineProduct(id, stage, order)
      await get().fetchProducts()
    } catch (error) {
      set({ products: prev, error: error instanceof Error ? error.message : "Erro ao mover produto" })
    }
  },

  deleteProduct: async (id) => {
    try {
      await api.deletePipelineProduct(id)
      await get().fetchProducts()
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Erro ao remover produto" })
    }
  },

  compareProducts: async (model) => {
    set({ isComparing: true, error: null, showComparison: true })
    try {
      const { comparison } = await api.comparePipelineProducts(model)
      set({ comparison, isComparing: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : "Erro ao comparar produtos",
        isComparing: false,
      })
    }
  },

  clearComparison: () => {
    set({ comparison: null, showComparison: false })
  },

  confirmTopProducts: async (productIds) => {
    try {
      for (const id of productIds) {
        await api.movePipelineProduct(id, "analise", 0)
      }
      await get().fetchProducts()
      set({ comparison: null, showComparison: false })
    } catch (error) {
      set({ error: error instanceof Error ? error.message : "Erro ao mover produtos" })
    }
  },
}))
