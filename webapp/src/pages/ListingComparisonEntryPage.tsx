import { Link } from "react-router-dom"

export function ListingComparisonEntryPage() {
  return <section className="market-page min-w-0 shrink-0 space-y-5">
    <header className="market-heading">
      <h1>Comparar anúncios</h1>
      <p className="text-sm text-gray-400 mt-2">Abra um produto da esteira para comparar seus anúncios.</p>
    </header>
    <Link to="/pipeline" className="inline-flex rounded-lg bg-indigo-600 px-4 py-2 text-sm text-white hover:bg-indigo-500">Escolher produto</Link>
  </section>
}
