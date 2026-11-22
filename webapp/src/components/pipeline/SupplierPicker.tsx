import { Link } from "react-router-dom"
import { useEffect, useState } from "react"
import { Search, Check, ChevronLeft, ChevronRight } from "lucide-react"
import type { ManualSupplier } from "@/lib/api"

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim()
export function SupplierPicker({ suppliers, productId, busy, onSelect }: { suppliers: ManualSupplier[]; productId: string; busy: boolean; onSelect: (id: string) => Promise<void> }) {
  const [query, setQuery] = useState("")
  const [page, setPage] = useState(1)
  const pageSize = 5
  const matches = suppliers.filter(s => normalize([s.name,s.contact,s.country].join(" ")).includes(normalize(query)))
  const totalPages = Math.max(1, Math.ceil(matches.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const start = (currentPage - 1) * pageSize
  const visible = matches.slice(start, start + pageSize)
  useEffect(() => { setPage(previous => Math.min(previous, totalPages)) }, [totalPages])
  return <section className="supplier-selection" aria-label="Fornecedores cadastrados">
    <label className="supplier-selection-search"><Search size={16} aria-hidden="true"/><input aria-label="Filtrar fornecedores" placeholder="Buscar fornecedor" value={query} onChange={e => { setQuery(e.target.value); setPage(1) }}/></label>
    <table className="supplier-selection-table" aria-label="Selecionar fornecedor"><thead><tr><th scope="col">Fornecedor</th><th scope="col" className="supplier-selection-action-heading">Seleção</th></tr></thead><tbody>
      {!matches.length && <tr><td colSpan={2} className="py-5 text-sm text-gray-400" role="status">{suppliers.length ? "Nenhum fornecedor encontrado." : "Nenhum fornecedor cadastrado."}</td></tr>}
      {visible.map(s => {
        const linked = s.links?.some(link => link.productId?._id === productId)
        return <tr key={s._id}><td><Link to={"/suppliers/" + s._id} className="supplier-selection-name hover:text-emerald-200 hover:underline underline-offset-4" aria-label={"Ver fornecedor " + s.name}>{s.name}</Link></td><td>
          {linked ? <span className="supplier-selection-linked"><Check size={14}/>Vinculado</span> : <button type="button" disabled={busy} aria-label={"Vincular " + s.name} onClick={() => void onSelect(s._id)} className="supplier-selection-action">Vincular</button>}
        </td></tr>
      })}
    </tbody></table>
    {matches.length > pageSize && <nav aria-label="Paginação dos fornecedores" className="supplier-selection-pagination">
      <span role="status">{start + 1}–{Math.min(start + pageSize, matches.length)} de {matches.length}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label="Página anterior" title="Página anterior" disabled={currentPage === 1 || busy} onClick={() => setPage(currentPage - 1)} className="p-1.5 rounded-md hover:bg-gray-700 disabled:opacity-30"><ChevronLeft size={16}/></button>
        <span>{currentPage} / {totalPages}</span>
        <button type="button" aria-label="Próxima página" title="Próxima página" disabled={currentPage === totalPages || busy} onClick={() => setPage(currentPage + 1)} className="p-1.5 rounded-md hover:bg-gray-700 disabled:opacity-30"><ChevronRight size={16}/></button>
      </div>
    </nav>}
  </section>
}
