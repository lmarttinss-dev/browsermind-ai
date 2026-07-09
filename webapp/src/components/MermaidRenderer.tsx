import { useEffect, useMemo, useRef, useState } from "react"

type MermaidRendererProps = {
  chart: string
}

let mermaidIdCounter = 0
let mermaidInitialized = false

/** Garante que o Mermaid seja inicializado apenas uma vez globalmente */
async function ensureMermaidReady() {
  if (mermaidInitialized) return
  const mermaid = (await import("mermaid")).default
  mermaid.initialize({
    startOnLoad: false,
    theme: "dark",
    securityLevel: "loose",
    fontFamily: "ui-monospace, monospace",
  })
  mermaidInitialized = true
}

export function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef(`mermaid-${++mermaidIdCounter}`)

  // Memoriza a normalização para evitar recálculo em cada render
  const normalizedChart = useMemo(() =>
    chart
      .replace(/[\u201C\u201D]/g, '"')   // aspas curvas → aspas retas
      .replace(/[\u2018\u2019]/g, "'")   // aspas simples curvas → retas
      .replace(/[\u2013\u2014]/g, "-"),  // em/en dash → hífen simples
    [chart]
  )

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!containerRef.current) return

      try {
        await ensureMermaidReady()
        const mermaid = (await import("mermaid")).default

        if (!cancelled && containerRef.current) {
          // Limpa o container antes de renderizar para evitar flicker
          containerRef.current.innerHTML = ""
          const { svg } = await mermaid.render(idRef.current, normalizedChart)
          if (!cancelled && containerRef.current) {
            containerRef.current.innerHTML = svg
            setError(null)
          }
        }
      } catch (err: unknown) {
        if (!cancelled) {
          const message = err instanceof Error ? err.message : String(err)
          setError(message)
        }
      }
    }

    render()

    return () => {
      cancelled = true
    }
  }, [normalizedChart])

  if (error) {
    return (
      <div className="my-3 rounded-lg border border-red-500/30 bg-red-950/20 p-3">
        <p className="text-xs text-red-400 font-medium mb-1">Erro ao renderizar gráfico</p>
        <pre className="text-xs text-red-300/70 overflow-x-auto">{error}</pre>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="my-4 flex justify-center overflow-x-auto"
    />
  )
}
