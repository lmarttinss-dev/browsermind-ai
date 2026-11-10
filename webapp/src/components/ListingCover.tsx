import { useState } from "react"
import { ImageOff } from "lucide-react"

export function ListingCover({ src, title }: { src?: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  return <div className="w-20 h-20 shrink-0 rounded-lg overflow-hidden bg-white border border-gray-600 flex items-center justify-center">
    {src && !failed
      ? <img src={src} alt={`Capa de ${title}`} loading="lazy" decoding="async" referrerPolicy="no-referrer" className="w-full h-full object-contain" onError={() => setFailed(true)} />
      : <span className="flex flex-col items-center gap-1 text-gray-500 text-[10px]" role="img" aria-label={`Sem foto de ${title}`}><ImageOff size={22} aria-hidden="true" />Sem foto</span>}
  </div>
}
