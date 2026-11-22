import { Search, SlidersHorizontal } from "lucide-react"
import { AlibabaSupplierCard, isAlibabaSupplier } from "@/components/pipeline/AlibabaSupplierCard"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { PROMPT_TEMPLATES } from "@/lib/prompt-templates"
import { MODELS, type ModelId } from "@/lib/api"
import { DeleteSupplierButton } from "@/components/DeleteSupplierButton"
import { BackLink } from "@/components/BackLink"
import { SupplierPicker } from "@/components/pipeline/SupplierPicker"
import { useEffect, useState, type FormEvent } from "react"
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom"
import { api, type ManualSupplier, type ManualSupplierInput } from "@/lib/api"

const statuses = { prospect: "Em prospecção", negotiating: "Em negociação", approved: "Aprovado", inactive: "Inativo" }
const origins = { unknown: "Não informado", domestic: "Nacional", import: "Importação direta" }
const answers = { unknown: "Não informado", yes: "Sim", no: "Não" }
const domesticFields = [["legalName", "Razão social"], ["taxId", "CNPJ"], ["state", "Estado"], ["city", "Cidade"], ["domesticFreight", "Frete nacional (valor ou condição)"]] as const
const importFields = [["originCountry", "País de origem da mercadoria"], ["contactChannel", "Canal de negociação"], ["incoterm", "Condição comercial (EXW, FOB, CIF…)"], ["transportMode", "Modal de transporte"]] as const
const formatPrice = (s: ManualSupplier) => s.priceAmount != null && s.currency ? new Intl.NumberFormat("pt-BR", { style: "currency", currency: s.currency }).format(s.priceAmount) : s.unitPrice || "—"
const empty: ManualSupplierInput = {
  purchaseOrigin: "unknown", priceAmount: null, currency: "", legalName: "", taxId: "", state: "", city: "", invoice: "unknown", domesticFreight: "", originCountry: "", contactChannel: "", incoterm: "", transportMode: "", sample: "unknown", name: "", contact: "", email: "", phone: "", country: "", url: "", status: "prospect", unitPrice: "", moq: "", deliveryTime: "", paymentTerms: "", notes: "", productId: null }
const fields = [
  ["name", "Nome do fornecedor *"], ["contact", "Pessoa de contato"], ["email", "E-mail"], ["phone", "Telefone / WhatsApp"],
  ["country", "País do fornecedor"], ["url", "Site / página do fornecedor"], ["moq", "Pedido mínimo (MOQ)"],
  ["deliveryTime", "Prazo de entrega"], ["paymentTerms", "Condições de pagamento"],
] as const

export function SuppliersPage({ productId }: { productId?: string }) {
  const [suppliers, setSuppliers] = useState<ManualSupplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState("")
  const [originFilter, setOriginFilter] = useState("")
  const [linkBusy, setLinkBusy] = useState(false)
  const [linkFilter, setLinkFilter] = useState("")
  const [page, setPage] = useState(1)
  const load = async () => {
    setLoading(true); setError("")
    try {
      const records = await api.getManualSuppliers()
      setSuppliers(records.suppliers)
    } catch (err) { setError((err as Error).message) }
    finally { setLoading(false) }
  }
  useEffect(() => { void load() }, [productId])
  const scoped = suppliers.filter(s => !productId || s.links?.some(link => link.productId?._id === productId))
  const visible = scoped.filter(s => (!originFilter || (s.purchaseOrigin || "unknown") === originFilter) && (!status || s.status === status)
    && (!linkFilter || (linkFilter === "linked" ? !!s.links?.length : !s.links?.length))
    && [s.name,s.contact,s.country,s.email,s.productId?.title].join(" ").toLocaleLowerCase().includes(search.toLocaleLowerCase()))
  const pageSize = 10
  const totalPages = Math.max(1, Math.ceil(visible.length / pageSize))
  const currentPage = Math.min(page, totalPages)
  const pageRows = visible.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  useEffect(() => { setPage(1) }, [search, status, originFilter, linkFilter])
  if (productId) return <section className="supplier-workspace">

    {error && <p role="alert" className="text-red-400">{error}</p>}
    {loading ? <p role="status">Carregando fornecedores…</p> : <SupplierPicker suppliers={suppliers} productId={productId} busy={linkBusy} onSelect={async id => { setLinkBusy(true); setError(""); try { await api.linkSupplierProduct(id, productId); const records = await api.getManualSuppliers(); setSuppliers(records.suppliers) } catch(err) { setError((err as Error).message) } finally { setLinkBusy(false) } }} />}

  </section>
  return <section className="supplier-workspace">
    <div className="supplier-heading"><div><p className="eyebrow">REDE DE FORNECEDORES</p><h1>{productId ? "Fornecedores vinculados" : "Fornecedores"}</h1><p>Cadastre contatos, acompanhe condições comerciais e conecte fornecedores à sua esteira.</p></div>
      <Link className="primary-link" to={"/suppliers/new" + (productId ? "?productId=" + encodeURIComponent(productId) : "")}>+ Novo fornecedor</Link></div>
    <AlibabaSupplierList onSaved={() => void load()} />
    <div className="supplier-filters supplier-directory-filters"><label className="supplier-directory-search"><Search size={17} aria-hidden="true"/><input aria-label="Buscar fornecedores" placeholder="Buscar fornecedores…" value={search} onChange={e => setSearch(e.target.value)}/></label><span className="supplier-filter-icon" aria-hidden="true"><SlidersHorizontal size={16}/></span>
      <select aria-label="Filtrar origem" value={originFilter} onChange={e => setOriginFilter(e.target.value)}><option value="">Origem: todas</option>{Object.entries(origins).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
      <select aria-label="Filtrar status" value={status} onChange={e => setStatus(e.target.value)}><option value="">Status: todos</option>{Object.entries(statuses).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select>
      {!productId && <select aria-label="Filtrar vínculo" value={linkFilter} onChange={e => setLinkFilter(e.target.value)}><option value="">Vínculos: todos</option><option value="linked">Com produto</option><option value="unlinked">Sem produto</option></select>}</div>
    {error && <p role="alert" className="text-red-400">{error} <button onClick={() => void load()}>Tentar novamente</button></p>}
    {loading ? <p role="status">Carregando fornecedores…</p> : !visible.length ? <div className="supplier-empty"><h2>{scoped.length ? "Nenhum resultado para os filtros." : "Sua rede começa com o primeiro fornecedor."}</h2><p>Cadastre um fornecedor com ou sem vínculo a um produto da esteira.</p></div> :
    <div className="overflow-x-auto"><table className="supplier-selection-table supplier-directory" aria-label="Todos os fornecedores">
      <thead><tr><th>Fornecedor</th><th>Origem</th><th>Status</th><th>Produtos</th><th><span className="sr-only">Ações</span></th></tr></thead>
      <tbody>{pageRows.map(s => <tr key={s._id}>
        <td><Link className="supplier-selection-name hover:text-emerald-200" to={"/suppliers/" + s._id}>{s.name}</Link></td>
        <td><span className={"supplier-origin " + (s.purchaseOrigin || "unknown")}>{origins[s.purchaseOrigin || "unknown"]}</span></td>
        <td><span className="supplier-directory-status">{statuses[s.status]}</span></td>
        <td>{s.links?.filter(link => link.productId).length || 0}</td>
        <td><div className="supplier-directory-actions"><Link to={"/suppliers/" + s._id + "/edit"}>Editar</Link><DeleteSupplierButton id={s._id} name={s.name} onDeleted={() => setSuppliers(current => current.filter(item => item._id !== s._id))}/></div></td>
      </tr>)}</tbody>
    </table></div>}
    {visible.length > pageSize && <nav className="supplier-selection-pagination" aria-label="Paginação de todos os fornecedores">
      <span>{(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, visible.length)} de {visible.length}</span>
      <div className="flex items-center gap-3"><button disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Página anterior">←</button><span>{currentPage} / {totalPages}</span><button disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Próxima página">→</button></div>
    </nav>}

  </section>
}

export function SupplierFormPage() {
  const { id } = useParams<{ id: string }>()
  const [params] = useSearchParams()
  const productId = params.get("productId")
  const navigate = useNavigate()
  const [form, setForm] = useState<ManualSupplierInput>(empty)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError(""); setFormError("")
    Promise.all([api.getPipelineProducts(), id ? api.getManualSupplier(id) : Promise.resolve(null)])
      .then(([_pipeline, record]) => {
        if (!active) return

        setForm(record ? { ...empty, ...record.supplier, productId: record.supplier.productId?._id || null } : { ...empty, productId })
      })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, productId, attempt])
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true); setFormError("")
    try {
      const profile = Object.fromEntries(Object.entries(form).filter(([key]) => !["productId","links","priceAmount","currency","unitPrice","moq","deliveryTime","paymentTerms","domesticFreight","originCountry","incoterm","transportMode","sample"].includes(key))) as ManualSupplierInput
      const { supplier } = id ? await api.updateManualSupplier(id, profile) : await api.createManualSupplier(profile)
      navigate("/suppliers/" + supplier._id, { replace: true })
    } catch (err) { setFormError((err as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="supplier-workspace">
    <header className="page-heading"><BackLink to="/suppliers">Fornecedores</BackLink><h1>{id ? "Editar fornecedor" : "Novo fornecedor"}</h1></header>
    {loading ? <p role="status">Carregando cadastro…</p> : error ? <p role="alert">{error} <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button></p> : (
    <form className="supplier-editor" onSubmit={save} aria-label={!id ? "Novo fornecedor" : "Editar fornecedor"}>
      <h2>{!id ? "Novo fornecedor" : "Editar fornecedor"}</h2><p>Informe o nome e a origem da compra. Compra de um distribuidor brasileiro é nacional, mesmo quando a mercadoria foi importada.</p>
      <label>Origem da compra *<select aria-label="Origem da compra" required value={form.purchaseOrigin === "unknown" ? "" : form.purchaseOrigin} onChange={e => setForm({ ...form, purchaseOrigin: e.target.value as ManualSupplierInput["purchaseOrigin"], currency: e.target.value === "domestic" ? "BRL" : form.currency })}><option value="" disabled>Selecione a origem</option><option value="domestic">Compra nacional</option><option value="import">Importação direta</option></select></label>

      <div className="supplier-form-grid">{fields.filter(([key]) => !["moq","deliveryTime","paymentTerms"].includes(key)).map(([key,label]) => <label key={key}>{label}<input autoFocus={key === "name"} required={key === "name"} maxLength={key === "name" ? 200 : 500} type={key === "email" ? "email" : key === "url" ? "url" : "text"} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}/></label>)}
      <label htmlFor="supplier-status">Status<select aria-label="Status" id="supplier-status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value as ManualSupplierInput["status"] })}>{Object.entries(statuses).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
</div>
      {form.unitPrice && <p>Preço do cadastro anterior: <strong>{form.unitPrice}</strong>. Preencha preço e moeda acima para atualizar a referência; o texto anterior será preservado.</p>}
      {form.purchaseOrigin !== "unknown" && <fieldset><legend>{form.purchaseOrigin === "domestic" ? "Compra nacional" : "Importação direta"}</legend><div className="supplier-form-grid">
        {(form.purchaseOrigin === "domestic" ? domesticFields.filter(([key]) => key !== "domesticFreight") : importFields.filter(([key]) => key === "contactChannel")).map(([key,label]) => <label key={key}>{label}<input maxLength={500} value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })}/></label>)}
        {form.purchaseOrigin === "domestic" ? <label>Emite nota fiscal?<select aria-label="Emite nota fiscal?" value={form.invoice} onChange={e => setForm({ ...form, invoice: e.target.value as ManualSupplierInput["invoice"] })}>{Object.entries(answers).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label> : <label>Amostra disponível?<select aria-label="Amostra disponível?" value={form.sample} onChange={e => setForm({ ...form, sample: e.target.value as ManualSupplierInput["sample"] })}>{Object.entries(answers).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>}
      </div></fieldset>}
      <label>Observações<textarea rows={4} maxLength={10000} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/></label>
      {formError && <p role="alert" className="text-red-400">{formError}</p>}
      <div className="supplier-form-actions"><button type="submit" className="primary-link" disabled={busy}>{busy ? "Salvando…" : "Salvar fornecedor"}</button><button type="button" disabled={busy} onClick={() => navigate(id ? "/suppliers/" + id : "/suppliers")}>Cancelar</button></div>
    </form>
    )}
  </section>
}

export function SupplierRecordPage({ deleting = false }: { deleting?: boolean }) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [supplier, setSupplier] = useState<ManualSupplier | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    let active = true
    setLoading(true); setError(""); setSupplier(null)
    api.getManualSupplier(id!)
      .then(result => { if (active) setSupplier(result.supplier) })
      .catch(err => { if (active) setError(err.message) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [id, attempt])
  const remove = async () => {
    setBusy(true); setError("")
    try { await api.deleteManualSupplier(id!); navigate("/suppliers", { replace: true }) }
    catch (err) { setError((err as Error).message) }
    finally { setBusy(false) }
  }
  return <section className="supplier-workspace">
    <header className="page-heading">
      <BackLink to="/suppliers">Fornecedores</BackLink>
      <h1>{deleting ? "Excluir fornecedor" : "Detalhes do fornecedor"}</h1>
    </header>
    {error && <p role="alert" className="text-red-400">{error} {!supplier && <button onClick={() => setAttempt(value => value + 1)}>Tentar novamente</button>}</p>}
    {loading ? <p role="status">Carregando fornecedor…</p> : supplier && <article className="supplier-card supplier-record">
      <div className="supplier-heading"><h2>{supplier.name}</h2><span className="supplier-status">{statuses[supplier.status]}</span></div>
      <span className={"supplier-origin " + (supplier.purchaseOrigin || "unknown")}>{origins[supplier.purchaseOrigin || "unknown"]}</span>
      {!deleting && supplier.purchaseOrigin === "import" && <IndividualSupplierAnalysis supplier={supplier} onUpdated={() => setAttempt(value => value + 1)}/>}
      {deleting ? <>
        <p>Confirme a exclusão permanente deste cadastro. O produto vinculado e as análises anteriores serão preservados.</p>
        <div className="supplier-actions"><button disabled={busy} className="text-red-400" onClick={() => void remove()}>{busy ? "Excluindo…" : "Confirmar exclusão"}</button><button disabled={busy} onClick={() => navigate("/suppliers/" + id)}>Cancelar</button></div>
      </> : <>
        {isAlibabaSupplier(supplier) ? <div className="mt-5"><AlibabaSupplierCard supplier={supplier}/>{supplier.individuallyAnalyzed && <div className="prose prose-invert max-w-none mt-6"><ReactMarkdown remarkPlugins={[remarkGfm]}>{supplier.report || ""}</ReactMarkdown></div>}</div> : <>
        <div className="supplier-detail-grid">
          <section className="supplier-detail-section"><h3>Contato</h3><dl>
            {fields.filter(([key]) => ["contact","email","phone","country","url"].includes(key)).map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{key === "url" && supplier.url ? <a href={supplier.url} target="_blank" rel="noopener noreferrer">{supplier.url} ↗</a> : supplier[key] || "Não informado"}</dd></div>)}
          </dl></section>
          <section className="supplier-detail-section"><h3>{supplier.purchaseOrigin === "domestic" ? "Dados da empresa" : "Informações comerciais"}</h3><dl>
            {(supplier.purchaseOrigin === "domestic" ? domesticFields : supplier.purchaseOrigin === "import" ? importFields : []).map(([key,label]) => <div key={key}><dt>{label}</dt><dd>{supplier[key] || "Não informado"}</dd></div>)}
            {supplier.purchaseOrigin === "domestic" && <div><dt>Nota fiscal</dt><dd>{answers[supplier.invoice || "unknown"]}</dd></div>}
            {supplier.purchaseOrigin === "import" && <div><dt>Amostra disponível</dt><dd>{answers[supplier.sample || "unknown"]}</dd></div>}
          </dl></section>
          {supplier.report && <section className="supplier-detail-section"><h3>Qualificação Alibaba</h3><dl>
            {[[ "Tipo", supplier.supplierType === "FACTORY" ? "Fábrica" : supplier.supplierType === "TRADING" ? "Trading" : "Não identificado" ],["Avaliação", supplier.rating ? supplier.rating + " / 5" : "Não informada"],["Anos de operação", supplier.yearsInBusiness || "Não informado"],["Taxa de resposta",supplier.responseRate || "Não informada"],["Capacidades",supplier.capabilities || "Não informadas"],["Certificações",supplier.certifications || "Não informadas"]].map(([label,value]) => <div key={String(label)}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl></section>}
          {supplier.purchaseOrigin !== "domestic" && <>
          <section className="supplier-detail-section"><h3>Produtos atendidos <span>{supplier.links?.filter(link => link.productId).length || 0}</span></h3>
            <div className="supplier-detail-products">{supplier.links?.some(link => link.productId) ? supplier.links.map(link => link.productId && <Link key={link.productId._id} to={"/pipeline/" + link.productId._id}><span>{link.productId.title}<small className="block text-gray-400 mt-1">Preço: {link.priceAmount != null ? link.currency + " " + link.priceAmount : link.unitPrice || "Não informado"} · MOQ: {link.moq || "Não informado"}</small></span><span aria-hidden="true">↗</span></Link>) : <p>Nenhum produto vinculado.</p>}</div>
          </section>
          </>}
          <section className="supplier-detail-section"><h3>Observações</h3><p className="supplier-notes">{supplier.notes || "Nenhuma observação."}</p></section>
        </div>
        </>}
        <small>Atualizado em {new Date(supplier.updatedAt).toLocaleDateString("pt-BR")}</small>
        <div className="supplier-actions"><Link to={"/suppliers/" + id + "/edit"}>Editar fornecedor</Link><DeleteSupplierButton id={supplier._id} name={supplier.name} onDeleted={() => navigate("/suppliers", { replace: true })}/></div>
      </>}
    </article>}
  </section>
}

function SupplierTerms({ supplier, productId }: { supplier: ManualSupplier; productId: string }) {
  const link = supplier.links?.find(item => item.productId?._id === productId)
  const [terms, setTerms] = useState<Record<string, string | number | null>>({ ...link, productId: undefined } as unknown as Record<string, string | number | null>)
  const [message, setMessage] = useState("")
  const [busy, setBusy] = useState(false)
  return <details className="supplier-editor"><summary>Condições comerciais deste produto</summary>
    <label>Preço unitário<input type="number" min="0" step="any" value={terms.priceAmount ?? ""} onChange={e => setTerms({ ...terms, priceAmount: e.target.value === "" ? null : Number(e.target.value) })}/></label>
    <label>Moeda<select disabled={supplier.purchaseOrigin === "domestic"} value={supplier.purchaseOrigin === "domestic" ? "BRL" : terms.currency || ""} onChange={e => setTerms({ ...terms, currency: e.target.value })}><option value="">Selecione</option>{["BRL","USD","EUR","CNY"].map(code => <option key={code}>{code}</option>)}</select></label>
    {[["moq","Pedido mínimo"],["deliveryTime","Prazo"],["paymentTerms","Pagamento"],["domesticFreight","Frete"],["originCountry","País da mercadoria"],["incoterm","Condição comercial"],["transportMode","Modal"],["notes","Observações"]].map(([key,label]) => <label key={key}>{label}<input value={terms[key] ?? ""} onChange={e => setTerms({ ...terms, [key]: e.target.value })}/></label>)}
    <button disabled={busy} onClick={async () => { setBusy(true); try { await api.saveSupplierTerms(supplier._id, productId, terms); setMessage("Condições salvas.") } catch(err) { setMessage((err as Error).message) } finally { setBusy(false) } }}>{busy ? "Salvando…" : "Salvar condições"}</button><p role="status">{message}</p>
  </details>
}

function AlibabaSupplierList({ productId, onSaved }: { productId?: string; onSaved: () => void }) {
  const [model, setModel] = useState<ModelId>(MODELS[0].id)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState("")
  return <div className="mb-5">
    <div className="supplier-analysis-actions">
      <select aria-label="Modelo da análise de fornecedores" value={model} disabled={busy} onChange={e => setModel(e.target.value as ModelId)}>{MODELS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
      <button type="button" className="primary-link" disabled={busy} onClick={async () => {
        setBusy(true); setMessage("")
        try {
          const current = await api.status()
          if (!current.url || !/(^|\.)alibaba\.com$/i.test(new URL(current.url).hostname)) throw new Error("Abra a página de resultados do Alibaba no browser.")
          const template = PROMPT_TEMPLATES.find(item => item.id === "top5-fornecedores-alibaba")!
          const result = await api.analyze({ prompt: template.content, model })
          if (!result.success || !result.response) throw new Error("A análise não retornou fornecedores.")
          const saved = await api.saveSupplierList(productId, result.response)
          setMessage(saved.count + " fornecedores importados para a listagem."); onSaved()
        } catch(err) { setMessage((err as Error).message) }
        finally { setBusy(false) }
      }}>{busy ? "Analisando fornecedores…" : "Analisar fornecedores do Alibaba"}</button>
    </div>
    <p className="text-xs text-gray-400 mt-2" role="status">{message || "Abra os resultados da busca no Alibaba no browser para analisar a lista de fornecedores."}</p>
  </div>
}

function IndividualSupplierAnalysis({ supplier, onUpdated }: { supplier: ManualSupplier; onUpdated: () => void }) {
  const [model, setModel] = useState<ModelId>(MODELS[0].id)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState("")
  const isAlibaba = (() => { try { return /(^|\.)alibaba\.com$/i.test(new URL(supplier.url).hostname) } catch { return false } })()
  return <div className="supplier-analysis-actions">
    <select aria-label="Modelo para análise individual" value={model} disabled={busy} onChange={event => setModel(event.target.value as ModelId)}>{MODELS.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
    <button type="button" disabled={busy || !isAlibaba} className="primary-link" onClick={async () => {
      setBusy(true); setError("")
      try {
        const result = await api.analyzeSupplier(supplier.url, model)
        if (!result.report) throw new Error("A análise não retornou relatório.")
        await api.updateSupplierAnalysis(supplier._id, result.report)
        onUpdated()
      } catch(err) { setError((err as Error).message) }
      finally { setBusy(false) }
    }}>{busy ? "Analisando fornecedor…" : supplier.individuallyAnalyzed ? "Atualizar análise individual" : "Analisar fornecedor individualmente"}</button>
    {!isAlibaba && <p className="text-xs text-gray-400">Cadastre uma URL do Alibaba para analisar este fornecedor.</p>}
    {error && <p role="alert" className="text-sm text-red-400 w-full">{error}</p>}
  </div>
}
