import { describe, expect, it, vi } from "vitest"
import {
  isTransientNetworkError,
  withTransientNetworkRetry,
} from "../deepseek-client.js"

describe("DeepSeek network retry", () => {
  it("reconhece EAI_AGAIN direto ou na causa do erro", () => {
    expect(isTransientNetworkError({ code: "EAI_AGAIN" })).toBe(true)
    expect(isTransientNetworkError({ cause: { code: "EAI_AGAIN" } })).toBe(true)
  })

  it("não classifica erros HTTP como falha transitória de rede", () => {
    expect(isTransientNetworkError({
      code: "ERR_BAD_REQUEST",
      response: { status: 401 },
    })).toBe(false)
  })

  it("repete EAI_AGAIN com backoff exponencial e retorna o resultado", async () => {
    const operation = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error("DNS temporário"), { code: "EAI_AGAIN" }))
      .mockRejectedValueOnce(Object.assign(new Error("DNS temporário"), { code: "EAI_AGAIN" }))
      .mockResolvedValue("ok")
    const sleep = vi.fn().mockResolvedValue(undefined)
    const onRetry = vi.fn()

    await expect(withTransientNetworkRetry(operation, {
      maxAttempts: 3,
      baseDelayMs: 250,
      sleep,
      onRetry,
    })).resolves.toBe("ok")

    expect(operation).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenNthCalledWith(1, 250)
    expect(sleep).toHaveBeenNthCalledWith(2, 500)
    expect(onRetry).toHaveBeenCalledTimes(2)
  })

  it("não repete erros não transitórios", async () => {
    const error = Object.assign(new Error("Unauthorized"), { code: "ERR_BAD_REQUEST" })
    const operation = vi.fn().mockRejectedValue(error)
    const sleep = vi.fn().mockResolvedValue(undefined)

    await expect(withTransientNetworkRetry(operation, { sleep })).rejects.toBe(error)
    expect(operation).toHaveBeenCalledTimes(1)
    expect(sleep).not.toHaveBeenCalled()
  })

  it("propaga EAI_AGAIN depois de esgotar as tentativas", async () => {
    const error = Object.assign(new Error("DNS temporário"), { code: "EAI_AGAIN" })
    const operation = vi.fn().mockRejectedValue(error)
    const sleep = vi.fn().mockResolvedValue(undefined)

    await expect(withTransientNetworkRetry(operation, {
      maxAttempts: 3,
      sleep,
    })).rejects.toBe(error)

    expect(operation).toHaveBeenCalledTimes(3)
    expect(sleep).toHaveBeenCalledTimes(2)
  })
})
