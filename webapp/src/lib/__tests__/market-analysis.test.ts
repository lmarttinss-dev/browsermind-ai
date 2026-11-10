import { describe, expect, it } from "vitest"
import { filterListings, type MarketListing } from "../market-analysis"
const rows = [
  { id: "1", title: "Adaptador USB", seller: "LOJA A", itemId: "MLB123", logistics: "Full" },
  { id: "2", title: "Cabo USB", seller: null, itemId: null, logistics: null },
  { id: "3", title: "Adaptador USB", seller: "LOJA B", itemId: "MLB456", logistics: "Flex" },
] as MarketListing[]
describe("filters for choosing comparable offers", () => {
  it("combines title, seller and ID searches with logistics without changing source rows", () => {
    expect(filterListings(rows, "  loja b  ", "Flex").map(row => row.id)).toEqual(["3"])
    expect(filterListings(rows, "MLB123", "Full").map(row => row.id)).toEqual(["1"])
    expect(filterListings(rows, "usb", "unknown").map(row => row.id)).toEqual(["2"])
    expect(filterListings(rows, "missing", "")).toEqual([])
    expect(rows).toHaveLength(3)
  })
})
