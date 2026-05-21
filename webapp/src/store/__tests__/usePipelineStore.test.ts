import { describe, it, expect, vi, beforeEach } from "vitest"
import { usePipelineStore } from "@/store/usePipelineStore"
import type { PipelineProduct } from "@/lib/api"

// Mock do módulo api
vi.mock("@/lib/api", () => ({
  api: {
    getPipelineProducts: vi.fn(),
    movePipelineProduct: vi.fn(),
    deletePipelineProduct: vi.fn(),
  },
}))

import { api } from "@/lib/api"

const mockProduct = (overrides: Partial<PipelineProduct> = {}): PipelineProduct => ({
  _id: "prod_1",
  title: "Película Galaxy S24 Ultra",
  url: "https://www.mercadolivre.com.br/pelicula-s24/p/MLB123",
  imageUrl: "https://http2.mlstatic.com/D_NQ_NP_123.jpg",
  price: 29.9,
  category: "Celulares > Películas",
  stage: "triagem",
  score: 8,
  monthlySales: 1200,
  competitionLevel: "Baixa",
  potentialMargin: "45%",
  analysisReport: "# Relatório",
  analyzedAt: "2026-05-21T00:00:00.000Z",
  order: 0,
  createdAt: "2026-05-21T00:00:00.000Z",
  updatedAt: "2026-05-21T00:00:00.000Z",
  ...overrides,
})

describe("usePipelineStore", () => {
  beforeEach(() => {
    // Reset store state
    usePipelineStore.setState({
      products: { triagem: [], analise: [], aprovado: [], importando: [], concluido: [] },
      isLoading: false,
      error: null,
      selectedProduct: null,
    })
    vi.clearAllMocks()
  })

  describe("Estado inicial", () => {
    it("deve ter produtos vazios em todas as colunas", () => {
      const { products } = usePipelineStore.getState()
      expect(products.triagem).toHaveLength(0)
      expect(products.analise).toHaveLength(0)
      expect(products.aprovado).toHaveLength(0)
      expect(products.importando).toHaveLength(0)
      expect(products.concluido).toHaveLength(0)
    })

    it("deve iniciar sem loading", () => {
      expect(usePipelineStore.getState().isLoading).toBe(false)
    })

    it("deve iniciar sem erro", () => {
      expect(usePipelineStore.getState().error).toBeNull()
    })

    it("deve iniciar sem produto selecionado", () => {
      expect(usePipelineStore.getState().selectedProduct).toBeNull()
    })
  })

  describe("fetchProducts", () => {
    it("deve carregar produtos e agrupar por stage", async () => {
      const mockProducts = {
        triagem: [mockProduct({ _id: "1", stage: "triagem" })],
        analise: [mockProduct({ _id: "2", stage: "analise" })],
        aprovado: [],
        importando: [],
        concluido: [],
      }

      vi.mocked(api.getPipelineProducts).mockResolvedValue({
        success: true,
        products: mockProducts,
      })

      await usePipelineStore.getState().fetchProducts()

      const { products, isLoading, error } = usePipelineStore.getState()
      expect(products.triagem).toHaveLength(1)
      expect(products.analise).toHaveLength(1)
      expect(isLoading).toBe(false)
      expect(error).toBeNull()
    })

    it("deve setar isLoading durante fetch", async () => {
      let resolvePromise: (value: unknown) => void
      vi.mocked(api.getPipelineProducts).mockImplementation(
        () => new Promise(resolve => { resolvePromise = resolve as typeof resolvePromise })
      )

      const fetchPromise = usePipelineStore.getState().fetchProducts()
      expect(usePipelineStore.getState().isLoading).toBe(true)

      resolvePromise!({ success: true, products: { triagem: [], analise: [], aprovado: [], importando: [], concluido: [] } })
      await fetchPromise

      expect(usePipelineStore.getState().isLoading).toBe(false)
    })

    it("deve setar erro se fetch falhar", async () => {
      vi.mocked(api.getPipelineProducts).mockRejectedValue(new Error("Network error"))

      await usePipelineStore.getState().fetchProducts()

      const { error, isLoading } = usePipelineStore.getState()
      expect(error).toBe("Network error")
      expect(isLoading).toBe(false)
    })
  })

  describe("moveProduct", () => {
    it("deve chamar API e recarregar produtos", async () => {
      vi.mocked(api.movePipelineProduct).mockResolvedValue({
        success: true,
        product: mockProduct({ _id: "1", stage: "analise" }),
      })
      vi.mocked(api.getPipelineProducts).mockResolvedValue({
        success: true,
        products: {
          triagem: [],
          analise: [mockProduct({ _id: "1", stage: "analise" })],
          aprovado: [],
          importando: [],
          concluido: [],
        },
      })

      await usePipelineStore.getState().moveProduct("1", "analise", 0)

      expect(api.movePipelineProduct).toHaveBeenCalledWith("1", "analise", 0)
      expect(api.getPipelineProducts).toHaveBeenCalled()
    })

    it("deve restaurar estado anterior em caso de erro", async () => {
      const initialProducts = {
        triagem: [mockProduct({ _id: "1", stage: "triagem" })],
        analise: [],
        aprovado: [],
        importando: [],
        concluido: [],
      }
      usePipelineStore.setState({ products: initialProducts })

      vi.mocked(api.movePipelineProduct).mockRejectedValue(new Error("Falha ao mover"))

      await usePipelineStore.getState().moveProduct("1", "analise", 0)

      const { products, error } = usePipelineStore.getState()
      expect(products.triagem).toHaveLength(1)
      expect(error).toBe("Falha ao mover")
    })
  })

  describe("deleteProduct", () => {
    it("deve chamar API e recarregar produtos", async () => {
      vi.mocked(api.deletePipelineProduct).mockResolvedValue({ success: true })
      vi.mocked(api.getPipelineProducts).mockResolvedValue({
        success: true,
        products: { triagem: [], analise: [], aprovado: [], importando: [], concluido: [] },
      })

      await usePipelineStore.getState().deleteProduct("1")

      expect(api.deletePipelineProduct).toHaveBeenCalledWith("1")
      expect(api.getPipelineProducts).toHaveBeenCalled()
    })

    it("deve limpar selectedProduct se deletar o produto selecionado", async () => {
      usePipelineStore.setState({ selectedProduct: mockProduct({ _id: "1" }) })
      vi.mocked(api.deletePipelineProduct).mockResolvedValue({ success: true })
      vi.mocked(api.getPipelineProducts).mockResolvedValue({
        success: true,
        products: { triagem: [], analise: [], aprovado: [], importando: [], concluido: [] },
      })

      await usePipelineStore.getState().deleteProduct("1")

      expect(usePipelineStore.getState().selectedProduct).toBeNull()
    })

    it("não deve limpar selectedProduct se deletar outro produto", async () => {
      const selected = mockProduct({ _id: "2" })
      usePipelineStore.setState({ selectedProduct: selected })
      vi.mocked(api.deletePipelineProduct).mockResolvedValue({ success: true })
      vi.mocked(api.getPipelineProducts).mockResolvedValue({
        success: true,
        products: { triagem: [], analise: [selected], aprovado: [], importando: [], concluido: [] },
      })

      await usePipelineStore.getState().deleteProduct("1")

      expect(usePipelineStore.getState().selectedProduct?._id).toBe("2")
    })

    it("deve setar erro se delete falhar", async () => {
      vi.mocked(api.deletePipelineProduct).mockRejectedValue(new Error("Falha ao remover"))

      await usePipelineStore.getState().deleteProduct("1")

      expect(usePipelineStore.getState().error).toBe("Falha ao remover")
    })
  })

  describe("setSelectedProduct", () => {
    it("deve setar produto selecionado", () => {
      const product = mockProduct()
      usePipelineStore.getState().setSelectedProduct(product)
      expect(usePipelineStore.getState().selectedProduct).toBe(product)
    })

    it("deve limpar produto selecionado com null", () => {
      usePipelineStore.setState({ selectedProduct: mockProduct() })
      usePipelineStore.getState().setSelectedProduct(null)
      expect(usePipelineStore.getState().selectedProduct).toBeNull()
    })
  })
})
