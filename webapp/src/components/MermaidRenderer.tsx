import { useEffect, useRef, useState } from "react"

type MermaidRendererProps = {
  chart: string
}

let mermaidIdCounter = 0

export function MermaidRenderer({ chart }: MermaidRendererProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<string | null>(null)
  const idRef = useRef(`mermaid-${++mermaidIdCounter}`)

  useEffect(() => {
    let cancelled = false

    async function render() {
      if (!containerRef.current) return

      try {
        const mermaid = (await import("mermaid")).default

        if (!cancelled) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            securityLevel: "loose",
            fontFamily: "ui-monospace, monospace",
          })

          const { svg } = await mermaid.render(idRef.current, chart)
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
  }, [chart])

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
