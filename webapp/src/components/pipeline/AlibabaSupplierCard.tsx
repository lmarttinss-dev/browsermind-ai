import { Link } from "react-router-dom"
import { Star, ShieldCheck, Clock, ExternalLink } from "lucide-react"
import type { ManualSupplier } from "@/lib/api"

export const isAlibabaSupplier = (supplier: ManualSupplier) => supplier.purchaseOrigin === "import" && /(^|\.)alibaba\.com$/i.test((() => { try { return new URL(supplier.url).hostname } catch { return "" } })())

export function AlibabaSupplierCard({ supplier, productId }: { supplier: ManualSupplier; productId?: string }) {
  const links = supplier.links?.filter(link => link.productId && (!productId || link.productId._id === productId)) || []
  return <article className="bg-gray-800/40 border border-gray-700 rounded-xl p-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Link to={"/suppliers/" + supplier._id} className="text-sm font-semibold text-blue-300 hover:underline">{supplier.name}</Link>
      <span className={"text-xs px-2 py-1 rounded " + (supplier.supplierType === "FACTORY" ? "bg-emerald-900/40 text-emerald-300" : "bg-amber-900/30 text-amber-300")}>{supplier.supplierType === "FACTORY" ? "Fábrica" : supplier.supplierType === "TRADING" ? "Trading" : "Tipo não identificado"}</span>
    </div>
    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 my-4">
      <span className="flex items-center gap-1"><Star size={14} className="text-amber-400"/>{supplier.rating || "—"} / 5</span>
      <span className="flex items-center gap-1"><Clock size={14}/>{supplier.yearsInBusiness ? supplier.yearsInBusiness + " anos" : "Tempo não informado"}</span>
      {supplier.tradeAssurance && <span className="flex items-center gap-1 text-emerald-300"><ShieldCheck size={14}/>Trade Assurance</span>}
      <span>Resposta: {supplier.responseRate || "Não informada"}</span>
    </div>
    {!links.length && <div className="flex gap-6 py-3 border-t border-gray-700 text-sm"><span>Preço unitário: {supplier.unitPrice || "Não informado"}</span><span>MOQ: {supplier.moq || "Não informado"}</span></div>}
    {links.map(link => <div key={link.productId!._id} className="flex flex-wrap gap-6 py-3 border-t border-gray-700 text-sm"><span><small className="block text-gray-500 mb-1">Preço unitário</small>{link.priceAmount != null ? link.currency + " " + link.priceAmount : link.unitPrice || "Não informado"}</span><span><small className="block text-gray-500 mb-1">MOQ</small>{link.moq || "Não informado"}</span></div>)}
    <p className="text-xs text-gray-400 mt-2">Capacidades: {supplier.capabilities || "Não informadas"}</p>
    <p className="text-xs text-gray-400 mt-2">Certificações: {supplier.certifications || "Não informadas"}</p>
    <div className="flex items-center gap-5 mt-4 text-xs"><Link className="text-blue-300" to={"/suppliers/" + supplier._id}>Ver fornecedor →</Link><a href={supplier.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-gray-400">Alibaba <ExternalLink size={12}/></a></div>
  </article>
}
