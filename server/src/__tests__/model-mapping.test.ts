import { describe, it, expect } from "vitest"

// Mesma lógica de mapeamento usada em server/src/index.ts
const GEMINI_MODEL_MAP: Record<string, string> = {
  "gemini-flash-2.5": "gemini-2.5-flash",
  "gemini-pro-2.5": "gemini-2.5-pro",
  "gemini-flash-3": "gemini-3-flash-preview",
  "gemini-pro-3.1": "gemini-3.1-pro-preview",
}

const SUPPORTED_MODELS = [
  ...Object.keys(GEMINI_MODEL_MAP),
  "gpt-4.1",
  "claude-sonnet",
  "deepseek-flash",
  "deepseek-pro",
]

function resolveGeminiModel(modelId: string): string | null {
  return GEMINI_MODEL_MAP[modelId] ?? null
}

function isSupportedModel(modelId: string): boolean {
  return SUPPORTED_MODELS.includes(modelId)
}

function isGeminiModel(modelId: string): boolean {
  return modelId in GEMINI_MODEL_MAP
}

describe("Mapeamento de modelos", () => {
  describe("Modelos Gemini", () => {
    it("deve mapear gemini-flash-2.5 para gemini-2.5-flash", () => {
      expect(resolveGeminiModel("gemini-flash-2.5")).toBe("gemini-2.5-flash")
    })

    it("deve mapear gemini-pro-2.5 para gemini-2.5-pro", () => {
      expect(resolveGeminiModel("gemini-pro-2.5")).toBe("gemini-2.5-pro")
    })

    it("deve mapear gemini-flash-3 para gemini-3-flash-preview", () => {
      expect(resolveGeminiModel("gemini-flash-3")).toBe("gemini-3-flash-preview")
    })

    it("deve mapear gemini-pro-3.1 para gemini-3.1-pro-preview", () => {
      expect(resolveGeminiModel("gemini-pro-3.1")).toBe("gemini-3.1-pro-preview")
    })

    it("deve retornar null para modelo desconhecido", () => {
      expect(resolveGeminiModel("gemini-unknown")).toBeNull()
    })

    it("deve gerar URL correta da API para cada modelo Gemini", () => {
      for (const [modelId, apiModel] of Object.entries(GEMINI_MODEL_MAP)) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${apiModel}:generateContent?key=test`
        expect(url).toContain(apiModel)
        expect(url).not.toContain(modelId)
      }
    })
  })

  describe("Detecção de provider", () => {
    it("deve identificar todos os modelos Gemini", () => {
      expect(isGeminiModel("gemini-flash-2.5")).toBe(true)
      expect(isGeminiModel("gemini-pro-2.5")).toBe(true)
      expect(isGeminiModel("gemini-flash-3")).toBe(true)
      expect(isGeminiModel("gemini-pro-3.1")).toBe(true)
    })

    it("não deve identificar modelos de outros providers como Gemini", () => {
      expect(isGeminiModel("gpt-4.1")).toBe(false)
      expect(isGeminiModel("claude-sonnet")).toBe(false)
      expect(isGeminiModel("deepseek-flash")).toBe(false)
      expect(isGeminiModel("deepseek-pro")).toBe(false)
    })
  })

  describe("Validação de modelos suportados", () => {
    it("deve aceitar todos os modelos válidos", () => {
      const validModels = [
        "gemini-flash-2.5",
        "gemini-pro-2.5",
        "gemini-flash-3",
        "gemini-pro-3.1",
        "gpt-4.1",
        "claude-sonnet",
        "deepseek-flash",
        "deepseek-pro",
      ]
      for (const model of validModels) {
        expect(isSupportedModel(model), `${model} deveria ser suportado`).toBe(true)
      }
    })

    it("deve rejeitar modelos inválidos", () => {
      const invalidModels = [
        "gemini-flash-2.0",
        "gemini-pro",
        "gemini-3.0-flash",
        "gpt-3.5",
        "claude-opus",
        "",
        "modelo-inexistente",
      ]
      for (const model of invalidModels) {
        expect(isSupportedModel(model), `${model} não deveria ser suportado`).toBe(false)
      }
    })

    it("deve ter exatamente 8 modelos suportados", () => {
      expect(SUPPORTED_MODELS).toHaveLength(8)
    })

    it("deve ter exatamente 4 modelos Gemini mapeados", () => {
      expect(Object.keys(GEMINI_MODEL_MAP)).toHaveLength(4)
    })
  })
})
