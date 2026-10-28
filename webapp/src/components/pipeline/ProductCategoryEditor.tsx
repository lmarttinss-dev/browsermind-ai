import { useState, type FormEvent } from "react"
import { Check, Loader2, Pencil, Tag, X } from "lucide-react"
import { api, type PipelineProduct } from "@/lib/api"

export function ProductCategoryEditor({ product, onUpdate }: {
  product: PipelineProduct
  onUpdate: (product: PipelineProduct) => void
}) {
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const [name, setName] = useState("")
  const [currentName, setCurrentName] = useState(product.category.replace(/\*+/g, ""))
  const [color, setColor] = useState("#60a5fa")

  const open = async () => {
    setError("")
    setName(currentName)
    setEditing(true)
    if (!product.categoryId) return
    setBusy(true)
    try {
      const { category } = await api.getCategory(product.categoryId)
      setName(category.name)
      setCurrentName(category.name)
      setColor(category.color)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar categoria")
    } finally { setBusy(false) }
  }

  const save = async (event: FormEvent) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || busy) return
    setBusy(true)
    setError("")
    try {
      const { categories } = await api.getCategories()
      const slug = trimmed.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
      const existing = categories.find(category => category.slug === slug || category.name === trimmed)
      if (existing && existing._id !== product.categoryId) {
        const { product: updated } = await api.assignCategoryToProduct(product._id, existing._id)
        onUpdate(updated)
        setCurrentName(updated.category)
        setColor(existing.color)
      } else if (product.categoryId) {
        const { category } = await api.updateCategory(product.categoryId, { name: trimmed })
        onUpdate({ ...product, category: category.name })
        setCurrentName(category.name)
      } else {
        const { product: updated } = await api.updatePipelineProduct(product._id, { category: trimmed })
        onUpdate(updated)
        setCurrentName(updated.category)
      }
      setEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar categoria")
    } finally { setBusy(false) }
  }

  if (!editing) return (
    <button type="button" onClick={() => void open()} title="Editar categoria"
      className="group inline-flex max-w-full items-center gap-2 rounded-full border border-blue-400/20 bg-blue-400/5 px-3 py-1.5 text-xs text-blue-200 transition-colors hover:border-blue-400/50 hover:bg-blue-400/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
      <Tag className="h-3.5 w-3.5 shrink-0" style={{ color }} />
      <span className="truncate">{currentName || "Sem categoria"}</span>
      <Pencil className="h-3 w-3 shrink-0 text-blue-300/60 transition-colors group-hover:text-blue-200" />
    </button>
  )

  return (
    <form onSubmit={save} onKeyDown={e => { if (e.key === "Escape" && !busy) setEditing(false) }}
      className="w-full max-w-md rounded-xl border border-blue-400/30 bg-gray-900/60 p-3 shadow-lg shadow-black/10">
      <label htmlFor="category-name" className="mb-2 flex items-center gap-2 text-xs font-medium text-blue-200">
        <Tag className="h-3.5 w-3.5" /> Editar categoria
      </label>
      <div className="flex items-center gap-2">
        <input id="category-name" autoFocus required value={name} disabled={busy}
          onChange={e => setName(e.target.value)}
          className="min-w-0 flex-1 rounded-lg border border-gray-600 bg-gray-800 px-3 py-2 text-sm text-gray-100 outline-none transition-colors focus:border-blue-400 focus:ring-2 focus:ring-blue-400/10 disabled:opacity-50" />
        <button type="submit" disabled={busy || !name.trim()} aria-label="Salvar categoria" title="Salvar"
          className="rounded-lg bg-blue-600 p-2 text-white transition-colors hover:bg-blue-500 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
        </button>
        <button type="button" disabled={busy} onClick={() => setEditing(false)} aria-label="Cancelar edição" title="Cancelar"
          className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-gray-700 hover:text-gray-100 disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400">
          <X className="h-4 w-4" />
        </button>
      </div>
      {product.categoryId && <p className="mt-2 text-[11px] leading-relaxed text-gray-500">Se o nome já existir, este produto será movido para essa categoria. Caso contrário, o nome será alterado para todos os produtos da categoria atual.</p>}
      {error && <p role="alert" className="mt-2 text-xs text-red-400">{error}</p>}
    </form>
  )
}
