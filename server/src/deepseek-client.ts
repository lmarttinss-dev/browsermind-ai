import axios from "axios"

const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions"

const TRANSIENT_NETWORK_CODES = new Set([
  "EAI_AGAIN",
  "ECONNABORTED",
  "ECONNRESET",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ETIMEDOUT",
])

type RetryOptions = {
  maxAttempts?: number
  baseDelayMs?: number
  sleep?: (delayMs: number) => Promise<void>
  onRetry?: (error: unknown, attempt: number, delayMs: number) => void
}

function errorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined

  const directCode = (error as { code?: unknown }).code
  if (typeof directCode === "string") return directCode

  const cause = (error as { cause?: unknown }).cause
  if (!cause || typeof cause !== "object") return undefined
  const causeCode = (cause as { code?: unknown }).code
  return typeof causeCode === "string" ? causeCode : undefined
}

export function isTransientNetworkError(error: unknown): boolean {
  const code = errorCode(error)
  return code !== undefined && TRANSIENT_NETWORK_CODES.has(code)
}

export async function withTransientNetworkRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxAttempts = 3,
    baseDelayMs = 500,
    sleep = (delayMs) => new Promise((resolve) => setTimeout(resolve, delayMs)),
    onRetry,
  } = options

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation()
    } catch (error) {
      if (attempt === maxAttempts || !isTransientNetworkError(error)) throw error

      const delayMs = baseDelayMs * 2 ** (attempt - 1)
      onRetry?.(error, attempt, delayMs)
      await sleep(delayMs)
    }
  }

  throw new Error("Número inválido de tentativas para a API DeepSeek")
}

export function postDeepSeek(payload: Record<string, unknown>, apiKey: string) {
  return withTransientNetworkRetry(
    () => axios.post(DEEPSEEK_API_URL, payload, {
      headers: { Authorization: `Bearer ${apiKey}` },
    }),
    {
      onRetry: (error, attempt, delayMs) => {
        const code = errorCode(error) || "erro de rede"
        console.warn(
          `⚠️ DeepSeek: ${code}; nova tentativa ${attempt + 1}/3 em ${delayMs}ms`,
        )
      },
    },
  )
}
