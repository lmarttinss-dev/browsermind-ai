import { useEffect, useRef, useState } from "react"
import { ChevronDown, Package, Search, X } from "lucide-react"
import type { PipelineProduct } from "@/lib/api"

const stages: Record<string, string> = { triagem: "Triagem", analise: "Em análise", aprovado: "Aprovado", importando: "Importando", concluido: "Concluído" }
const normalize = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()

export function SupplierProductPicker({ products, value, onChange }: {
  products: PipelineProduct[]; value: string | null; onChange: (id: string | null) => void
}) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const container = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const selected = products.find(product => product._id === value)
  const filtered = products.filter(product => normalize(product.title).includes(normalize(search)))
  useEffect(() => {
    const outside = (event: MouseEvent) => { if (!container.current?.contains(event.target as Node)) setOpen(false) }
    if (open) document.addEventListener("mousedown", outside)
    return () => document.removeEventListener("mousedown", outside)
  }, [open])
  const select = (id: string | null) => { onChange(id); setOpen(false); setSearch(""); trigger.current?.focus() }
  return <div className="relative" ref={container} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false) }} onKeyDown={event => {
    if (event.key === "Escape") { event.preventDefault(); setOpen(false); trigger.current?.focus() }
  }}>
    <div className="relative">
      <button ref={trigger} type="button" aria-label="Produto da esteira" aria-expanded={open} aria-controls="supplier-product-options" onClick={() => { setOpen(!open); setSearch("") }}
        className="w-full flex items-center gap-2 bg-blue-950/50 border border-blue-800 rounded-lg px-3 py-2 pr-14 text-sm text-left hover:border-blue-300">
        {selected ? <>
          {selected.imageUrl ? <img src={selected.imageUrl} alt="" className="w-5 h-5 rounded object-cover shrink-0"/> : <Package className="w-4 h-4 text-blue-400 shrink-0"/>}
          <span className="text-gray-200 truncate">{selected.title.replace(/\*+/g, "")}</span>
          <span className="text-[10px] text-blue-300 shrink-0">{stages[selected.stage]}</span>
        </> : <span className="text-gray-400">Vincular a um produto da esteira (opcional)...</span>}
      </button>
      {value && <button type="button" aria-label="Remover vínculo com produto" onClick={() => select(null)} className="absolute right-7 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"><X size={15}/></button>}
      <ChevronDown className={"absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-400 pointer-events-none " + (open ? "rotate-180" : "")}/>
    </div>
    {open && <div id="supplier-product-options" className="absolute z-50 top-full mt-1 w-full bg-gray-800 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-700"><Search size={14} className="text-gray-400 shrink-0"/>
        <input autoFocus aria-label="Filtrar produtos" placeholder="Filtrar produtos..." value={search} onChange={event => setSearch(event.target.value)} className="w-full text-sm text-gray-200"/>
      </div>
      <div className="max-h-64 overflow-y-auto">
        <button type="button" onClick={() => select(null)} className="w-full px-3 py-2 text-xs text-left text-gray-400 hover:bg-gray-900">Nenhum (sem vínculo)</button>
        {!filtered.length && <p role="status" className="px-3 py-4 text-xs text-gray-400 text-center">Nenhum produto encontrado</p>}
        {filtered.map(product => <button type="button" key={product._id} aria-label={"Selecionar " + product.title.replace(/\*+/g, "")} aria-pressed={product._id === value} onClick={() => select(product._id)}
          className={"w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-gray-900 border-b border-gray-700 last:border-0 " + (product._id === value ? "bg-blue-950/50" : "")}>
          {product.imageUrl ? <img src={product.imageUrl} alt="" className="w-8 h-8 rounded-md object-cover shrink-0"/> : <div className="w-8 h-8 rounded-md bg-gray-900 flex items-center justify-center shrink-0"><Package size={16} className="text-gray-400"/></div>}
          <div className="flex-1 min-w-0"><span className="block text-sm text-gray-100 truncate">{product.title.replace(/\*+/g, "")}</span>
            <div className="flex items-center gap-2 mt-1 text-[10px]"><span className="text-blue-300">{stages[product.stage]}</span>
            </div>
          </div>
        </button>)}
      </div>
    </div>}
  </div>
}
