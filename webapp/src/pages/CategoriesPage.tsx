import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams } from "react-router-dom"
import { Search } from "lucide-react"
import { DeleteCategoryButton } from "@/components/DeleteCategoryButton"
import { BackLink } from "@/components/BackLink"
import { api, type Category } from "@/lib/api"
import { useCategoryStore } from "@/store/useCategoryStore"

type CategoryForm = Pick<Category, "name" | "description" | "mlCategoryUrl">
const empty: CategoryForm = { name: "", description: "", mlCategoryUrl: "" }

export function CategoriesPage() {
  const { categories, isLoading, error, fetchCategories } = useCategoryStore()
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  useEffect(() => { void fetchCategories() }, [fetchCategories])
  const visible = categories.filter(category => (category.name + " " + category.description).toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const totalPages = Math.max(1, Math.ceil(visible.length / 10))
  const currentPage = Math.min(page, totalPages)
  return <section className="supplier-workspace">
    <div className="supplier-heading"><div><p className="eyebrow">ORGANIZAÇÃO DA ESTEIRA</p><h1>Categorias</h1><p>Agrupe e organize produtos por nicho de mercado.</p></div><Link className="primary-link" to="/categories/new">+ Nova categoria</Link></div>
    <div className="supplier-filters supplier-directory-filters"><label className="supplier-directory-search"><Search size={17} aria-hidden="true"/><input aria-label="Buscar categorias" placeholder="Buscar categorias…" value={search} onChange={event => { setSearch(event.target.value); setPage(1) }}/></label></div>
    {error && <p role="alert" className="text-red-400">{error} <button onClick={() => void fetchCategories()}>Tentar novamente</button></p>}
    {isLoading ? <p role="status">Carregando categorias…</p> : !visible.length ? <div className="supplier-empty"><h2>{categories.length ? "Nenhum resultado para a busca." : "Nenhuma categoria cadastrada."}</h2><p>Crie uma categoria para agrupar produtos na esteira.</p></div> :
    <div className="overflow-x-auto"><table className="supplier-selection-table supplier-directory" aria-label="Todas as categorias">
      <thead><tr><th>Categoria</th><th>Descrição</th><th>Produtos</th><th><span className="sr-only">Ações</span></th></tr></thead>
      <tbody>{visible.slice((currentPage - 1) * 10, currentPage * 10).map(category => <tr key={category._id}>
        <td><Link className="supplier-selection-name hover:text-emerald-200" to={`/categories/${category._id}`}>{category.name}</Link></td>
        <td className="max-w-sm"><span className="line-clamp-2">{category.description || "—"}</span></td><td>{category.productCount || 0}</td>
        <td><div className="supplier-directory-actions"><Link to={`/categories/${category._id}/edit`}>Editar</Link><DeleteCategoryButton id={category._id} name={category.name}/></div></td>
      </tr>)}</tbody>
    </table></div>}
    {visible.length > 10 && <nav className="supplier-selection-pagination" aria-label="Paginação de categorias"><span>{(currentPage - 1) * 10 + 1}–{Math.min(currentPage * 10, visible.length)} de {visible.length}</span><div className="flex items-center gap-3"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior">←</button><span>{currentPage} / {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Próxima página">→</button></div></nav>}
  </section>
}

export function CategoryFormPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [form, setForm] = useState<CategoryForm>(empty)
  const [loading, setLoading] = useState(!!id)
  const [loadError, setLoadError] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoadError(""); setError(""); setForm(empty); setLoading(!!id)
    if (id) api.getCategory(id).then(({ category }) => {
      if (active) setForm({ name: category.name, description: category.description, mlCategoryUrl: category.mlCategoryUrl })
    }).catch(err => { if (active) setLoadError(err.message) }).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, attempt])
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setError("")
    try {
      const { category } = id ? await api.updateCategory(id, form) : await api.createCategory(form)
      await useCategoryStore.getState().fetchCategories()
      navigate("/categories/" + category._id, { replace: true })
    } catch (err) { setError((err as Error).message) } finally { setBusy(false) }
  }
  return <section className="supplier-workspace">
    <header className="page-heading"><BackLink to="/categories">Categorias</BackLink><h1>{id ? "Editar categoria" : "Nova categoria"}</h1></header>
    {loading ? <p role="status">Carregando categoria…</p> : loadError ? <p role="alert">{loadError} <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></p> :
    <form className="supplier-editor" onSubmit={save} aria-label={id ? "Editar categoria" : "Nova categoria"}>
      <h2>{id ? "Editar categoria" : "Nova categoria"}</h2>
      <p>Informe o nome e os dados da categoria para organizar os produtos da esteira.</p>
      <div className="supplier-form-grid">
        <label>Nome da categoria *<input autoFocus required maxLength={200} value={form.name} onChange={event => setForm({ ...form, name: event.target.value })}/></label>
        <label>URL da categoria no Mercado Livre<input type="url" maxLength={2000} placeholder="https://lista.mercadolivre.com.br/…" value={form.mlCategoryUrl} onChange={event => setForm({ ...form, mlCategoryUrl: event.target.value })}/></label>
      </div>
      <label>Descrição<textarea rows={4} maxLength={2000} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })}/></label>
      {error && <p role="alert" className="text-red-400">{error}</p>}
      <div className="supplier-form-actions"><button type="submit" className="primary-link" disabled={busy || !form.name.trim()}>{busy ? "Salvando…" : "Salvar categoria"}</button><button type="button" disabled={busy} onClick={() => navigate(id ? "/categories/" + id : "/categories")}>Cancelar</button></div>
    </form>}
  </section>
}
