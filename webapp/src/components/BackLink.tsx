import { ArrowLeft } from "lucide-react"
import { Link } from "react-router-dom"

export function BackLink({ to, children = "Voltar" }: { to: string; children?: React.ReactNode }) {
  return <Link to={to} className="page-back-link"><ArrowLeft size={16} aria-hidden="true"/>{children}</Link>
}
