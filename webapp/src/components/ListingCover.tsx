import { useState } from "react"
import { ImageOff } from "lucide-react"

export function ListingCover({ src, title }: { src?: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  return <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-700 ${src && !failed ? "bg-white" : "bg-gray-800"}`}>
    {src && !failed
      ? <img src={src} alt={`Capa de ${title}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={() => setFailed(true)} />
      : <span className="text-gray-500" role="img" aria-label={`Sem foto de ${title}`}><ImageOff size={18} aria-hidden="true" /></span>}
  </div>
}
