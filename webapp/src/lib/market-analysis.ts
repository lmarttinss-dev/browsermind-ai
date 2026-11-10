export type AccountProfile = Record<"account" | "sales" | "full" | "flex" | "reviews" | "medal", "yes" | "no" | "unknown">
export type MarketListing = {
  id: string; itemId: string | null; catalogId: string | null; title: string; seller: string | null; url: string | null;
  capturedAt?: string;
  avantproFields?: { label: string; value: string | null; scope: string; period: string | null }[];
  adClickId?: string | null;
  adsStatus?: "yes" | "no" | "unknown";
  imageUrl?: string | null;
  metrics: string; price: number | null; logistics: "Full" | "Flex" | "Normal" | "Outros" | null;
  freeShipping: boolean | null; delivery: string | null; sponsored: boolean; sales30d: number | null; salesScope: string;
}
export type MarketSnapshot = { id: string; url: string; title: string; capturedAt: string; listings: MarketListing[]; warnings: string[] }
export type MarketAnalysis = {
  ai?: { model: string; text: string; generatedAt: string; sections?: {
    decision: { status: string; title: string; summary: string }; logistics: string; pricing: string;
    actions: { period: string; title: string; description: string }[];
  } };
  analyzedAt: string; capturedAt: string; snapshotId: string; sourceUrl: string; title: string; total: number;
  sales30d: number | null; salesCoverage: number; sellers: number; sponsored: number; adsPercentage?: number; adsCoverage?: number; adsUnknown?: number;
  logistics: Record<"Full" | "Flex" | "Normal" | "Outros" | "unknown", number>;
  pricing: { count: number; min: number | null; max: number | null; median: number | null };
  profile: AccountProfile; readiness: { key: string; label: string; value: string; status: string }[];
  selectedIds: string[]; selected: MarketListing[]; verdict: string;
  actions: { period: string; title: string; description: string }[]; warnings: string[]; report: string;
}
export const emptyProfile = (): AccountProfile => ({ account: "unknown", sales: "unknown", full: "unknown", flex: "unknown", reviews: "unknown", medal: "unknown" })
export const currency = (value: number | null) => value === null ? "Sem dados" : value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
export function filterListings(rows: MarketListing[], search: string, logistics: string) {
  const term = search.trim().toLocaleLowerCase("pt-BR")
  return rows.filter(row => (!term || [row.title, row.seller, row.itemId].some(value => value?.toLocaleLowerCase("pt-BR").includes(term))) && (!logistics || (row.logistics || "unknown") === logistics))
}
