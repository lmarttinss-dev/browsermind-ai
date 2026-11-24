const PREFIX = "browsermind-listing-comparison-v1"
export function comparisonKeys(productId?: string) {
  const history = productId ? `${PREFIX}:product:${productId}` : PREFIX
  return { history, selection: `${history}:selection` }
}
export function readComparisonSelection(storage: Pick<Storage, "getItem">, productId?: string): Set<string> {
  try {
    const value: unknown = JSON.parse(storage.getItem(comparisonKeys(productId).selection) || "[]")
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : [])
  } catch { return new Set() }
}
export function selectCapturedListing(storage: Pick<Storage, "getItem" | "setItem">, id: string, productId?: string) {
  const selected = readComparisonSelection(storage, productId)
  selected.add(id)
  storage.setItem(comparisonKeys(productId).selection, JSON.stringify([...selected]))
}
export function comparisonDestination(productId?: string) {
  return productId ? `/pipeline/${encodeURIComponent(productId)}?tab=comparar` : "/listing-comparison"
}
