import { BackLink } from "@/components/BackLink"
import { useEffect, useState } from "react"
import { Link, useParams, useNavigate } from "react-router-dom"
import { DeleteCategoryButton } from "@/components/DeleteCategoryButton"
import { api, type Category } from "@/lib/api"

export const CategoryDashboardPage = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [category, setCategory] = useState<Category | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    setIsLoading(true); setError(""); setCategory(null)
    if (!id) { setIsLoading(false); setError("Categoria não encontrada"); return }
    api.getCategory(id)
      .then(result => {
        if (!active) return
        setCategory(result.category)
      })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setIsLoading(false) })
    return () => { active = false }
  }, [id, attempt])

  return <section className="supplier-workspace">
    <header className="page-heading"><BackLink to="/categories">Categorias</BackLink><h1>Detalhes da categoria</h1></header>
    {error && <p role="alert" className="text-red-400">{error} {!category && <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}</p>}
    {isLoading ? <p role="status">Carregando categoria…</p> : category && <article className="supplier-card supplier-record">
      <div className="supplier-heading"><h2>{category.name}</h2></div>
      <div className="supplier-detail-grid">
        <section className="supplier-detail-section"><h3>Dados da categoria</h3><dl>
          <div><dt>Nome</dt><dd>{category.name}</dd></div>
          <div><dt>Mercado Livre</dt><dd>{category.mlCategoryUrl ? <a href={category.mlCategoryUrl} target="_blank" rel="noopener noreferrer">{category.mlCategoryUrl} ↗</a> : "Não informado"}</dd></div>
        </dl></section>
        <section className="supplier-detail-section"><h3>Descrição</h3><p className="supplier-notes">{category.description || "Nenhuma descrição."}</p></section>
      </div>
      <div className="supplier-actions"><Link to={"/categories/" + category._id + "/edit"}>Editar categoria</Link><DeleteCategoryButton id={category._id} name={category.name} onDeleted={() => navigate("/categories", { replace: true })}/></div>
    </article>}
  </section>
}
