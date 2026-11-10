import { ListingCover } from "@/components/ListingCover"
import { currency, type MarketListing } from "@/lib/market-analysis"
import { ExternalLink, Trash2 } from "lucide-react"

type Props = {
  listing: MarketListing
  selected: boolean
  disabled: boolean
  onSelect: () => void
  onAdsChange: (status: NonNullable<MarketListing["adsStatus"]>) => void
  onRemove: () => void
}

export function MarketListingRow({ listing, selected, disabled, onSelect, onAdsChange, onRemove }: Props) {
  const estimatedSales = listing.avantproFields?.find(field => field.label === "Vendas estimadas")?.value

  return (
    <li className={`px-3 py-3 sm:px-4 ${selected ? "bg-indigo-500/10" : ""}`}>
      <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-3 gap-y-2 sm:grid-cols-[auto_minmax(0,1fr)_7rem_8rem]">
        <input
          type="checkbox"
          aria-label={`Selecionar ${listing.title}`}
          checked={selected}
          disabled={disabled}
          onChange={onSelect}
          className="h-4 w-4 cursor-pointer accent-indigo-500 disabled:cursor-default"
        />
        <div className="flex min-w-0 items-center gap-3">
          <ListingCover key={listing.imageUrl || "no-cover"} src={listing.imageUrl} title={listing.title} />
          <div className="min-w-0 break-words">
            <p className="text-sm font-medium text-gray-100">
              {listing.url ? <a className="hover:text-indigo-300 hover:underline" href={listing.url} target="_blank" rel="noopener noreferrer">
                {listing.title} <ExternalLink className="inline align-baseline text-gray-400" size={12} aria-hidden="true" />
              </a> : listing.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              {listing.seller || "Vendedor não identificado"}{listing.logistics && ` · ${listing.logistics}`}
            </p>
          </div>
        </div>
        <dl className="col-start-2 flex flex-wrap gap-x-5 gap-y-1 text-sm sm:contents">
          <div>
            <dt className="text-xs text-gray-400 sm:sr-only">Preço</dt>
            <dd>{currency(listing.price)}</dd>
          </div>
          <div>
            <dt className="text-xs text-gray-400 sm:sr-only">Vendas estimadas</dt>
            <dd>{estimatedSales ?? "Sem dados"}</dd>
          </div>
        </dl>
        <details className="col-start-2 col-end-[-1] text-xs text-gray-400">
          <summary className="w-fit cursor-pointer hover:text-indigo-200">Detalhes da oferta</summary>
          <div className="mt-2 space-y-3 border-l border-gray-700 pl-3">
            <p>{listing.itemId || listing.catalogId || "Sem ID"}{listing.capturedAt && ` · Capturado em ${new Date(listing.capturedAt).toLocaleString("pt-BR")}`}</p>
            {listing.delivery && <p>{listing.delivery}</p>}
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2">
                Usa Ads?
                <select
                  aria-label={`Ads de ${listing.title}`}
                  value={listing.adsStatus || "unknown"}
                  disabled={disabled}
                  onChange={event => onAdsChange(event.target.value as NonNullable<MarketListing["adsStatus"]>)}
                  className="rounded-md border border-gray-700 bg-gray-900 px-2 py-1"
                >
                  <option value="unknown">{listing.adClickId ? "Sim (pela URL)" : "Não informado"}</option>
                  <option value="yes">Sim</option>
                  <option value="no">Não</option>
                </select>
              </label>
              <button
                type="button"
                disabled={disabled}
                onClick={onRemove}
                aria-label={`Excluir ${listing.title} da lista`}
                className="inline-flex items-center gap-1 text-red-300 hover:underline disabled:opacity-40"
              >
                <Trash2 size={12} aria-hidden="true" /> Excluir ficha
              </button>
            </div>
            <details>
              <summary className="w-fit cursor-pointer hover:text-indigo-200">Métricas do AvantPro</summary>
              <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-words">{listing.metrics || "Sem métricas AvantPro nesta ficha."}</pre>
            </details>
          </div>
        </details>
      </div>
    </li>
  )
}
