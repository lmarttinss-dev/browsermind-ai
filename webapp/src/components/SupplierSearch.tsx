import { useEffect } from "react";
import { useStore } from "@/store/useStore";
import { Search, Loader2, ExternalLink, ShieldCheck, BadgeCheck, MapPin, Clock, Sparkles } from "lucide-react";

export function SupplierSearch() {
  const {
    supplierQuery, setSupplierQuery,
    supplierFilters, setSupplierFilters,
    supplierResults, supplierLoading, supplierError,
    supplierSearchUrl, supplierKeyword,
    supplierGenerateKeyword, setSupplierGenerateKeyword,
    searchSuppliers,
    browserTitle, navigateTo,
  } = useStore();

  // Pré-popula com o título da página se o campo estiver vazio
  useEffect(() => {
    if (!supplierQuery && browserTitle) {
      setSupplierQuery(browserTitle);
    }
  }, [browserTitle]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchSuppliers();
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Search form */}
      <div className="p-3 space-y-3 border-b border-gray-100">
        <form onSubmit={handleSearch} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={supplierQuery}
              onChange={(e) => setSupplierQuery(e.target.value)}
              placeholder={browserTitle || "Buscar fornecedores no Alibaba..."}
              className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
              disabled={supplierLoading}
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={supplierFilters.tradeAssurance ?? false}
                onChange={(e) => setSupplierFilters({ ...supplierFilters, tradeAssurance: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
              />
              <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
              Trade Assurance
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={supplierFilters.verified ?? false}
                onChange={(e) => setSupplierFilters({ ...supplierFilters, verified: e.target.checked })}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
              />
              <BadgeCheck className="w-3.5 h-3.5 text-blue-500" />
              Verified
            </label>
            <label className="flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={supplierGenerateKeyword}
                onChange={(e) => setSupplierGenerateKeyword(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 w-3.5 h-3.5"
              />
              <Sparkles className="w-3.5 h-3.5 text-purple-500" />
              Keyword IA
            </label>
          </div>

          <button
            type="submit"
            disabled={supplierLoading || !supplierQuery.trim()}
            className="w-full flex items-center justify-center gap-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
          >
            {supplierLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            Buscar Fornecedores
          </button>
        </form>

        {/* Keyword gerada + link */}
        {(supplierKeyword || supplierSearchUrl) && (
          <div className="flex items-center justify-between text-[10px] text-gray-400">
            {supplierKeyword && (
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Keyword: <strong className="text-gray-600">{supplierKeyword}</strong>
              </span>
            )}
            {supplierSearchUrl && (
              <a
                href={supplierSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-0.5 hover:text-primary-600 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
                Alibaba
              </a>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto">
        {supplierError && (
          <div className="m-3 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">{supplierError}</p>
          </div>
        )}

        {supplierLoading && (
          <div className="flex flex-col items-center justify-center gap-3 p-8 text-gray-400">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
            <p className="text-sm">Buscando fornecedores...</p>
          </div>
        )}

        {!supplierLoading && supplierResults.length > 0 && (
          <div className="p-3 space-y-2">
            <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
              {supplierResults.length} fornecedor{supplierResults.length > 1 ? "es" : ""} encontrado{supplierResults.length > 1 ? "s" : ""}
            </p>
            {supplierResults.map((supplier, idx) => (
              <div
                key={idx}
                className="border border-gray-200 rounded-lg p-3 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
              >
                <div className="flex gap-3">
                  {supplier.image && (
                    <img
                      src={supplier.image}
                      alt={supplier.name}
                      className="w-12 h-12 rounded object-cover shrink-0 bg-gray-100"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-sm font-medium text-gray-800 truncate">{supplier.name}</h3>
                      {supplier.url && (
                        <button
                          onClick={() => navigateTo(supplier.url)}
                          className="shrink-0 text-gray-400 hover:text-primary-600 transition-colors"
                          title="Abrir no browser"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {/* Badges */}
                    <div className="flex items-center gap-2 mt-1">
                      {supplier.isTradeAssurance && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                          <ShieldCheck className="w-2.5 h-2.5" />
                          Trade Assurance
                        </span>
                      )}
                      {supplier.isVerified && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-0.5">
                          <BadgeCheck className="w-2.5 h-2.5" />
                          Verified
                        </span>
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-[11px] text-gray-500">
                      {supplier.country && (
                        <span className="flex items-center gap-0.5">
                          <MapPin className="w-3 h-3" />
                          {supplier.country}
                        </span>
                      )}
                      {supplier.yearsInBusiness && (
                        <span className="flex items-center gap-0.5">
                          <Clock className="w-3 h-3" />
                          {supplier.yearsInBusiness} anos
                        </span>
                      )}
                      {supplier.rating && (
                        <span>⭐ {supplier.rating}</span>
                      )}
                      {supplier.responseRate && (
                        <span>{supplier.responseRate}</span>
                      )}
                    </div>

                    {/* Main products */}
                    {supplier.mainProducts.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {supplier.mainProducts.slice(0, 3).map((product, i) => (
                          <span key={i} className="text-[10px] text-gray-500 bg-gray-100 rounded px-1.5 py-0.5">
                            {product}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!supplierLoading && !supplierError && supplierResults.length === 0 && !supplierSearchUrl && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-gray-300">
            <span className="text-4xl">🏭</span>
            <p className="text-sm text-gray-400 text-center">
              Busque fornecedores no Alibaba com filtros de qualidade
            </p>
          </div>
        )}

        {!supplierLoading && !supplierError && supplierResults.length === 0 && supplierSearchUrl && (
          <div className="flex flex-col items-center justify-center gap-2 p-8 text-gray-300">
            <span className="text-4xl">🔍</span>
            <p className="text-sm text-gray-400 text-center">
              Nenhum fornecedor encontrado. Tente ajustar os filtros ou termos de busca.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
