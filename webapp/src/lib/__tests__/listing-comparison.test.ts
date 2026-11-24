import { describe, expect, it } from "vitest"
import { comparisonDestination, comparisonKeys, readComparisonSelection, selectCapturedListing } from "../listing-comparison"
import { isPublicMercadoLivreListingUrl } from "../../../../shared/public-listing-url"

describe("capture selection and public listing scope", () => {
  it("retains existing selections, refreshes without duplicates and isolates products", () => {
    const data = new Map<string, string>()
    const storage = { getItem: (key: string) => data.get(key) || null, setItem: (key: string, value: string) => { data.set(key, value) } }
    selectCapturedListing(storage, "first", "product-a")
    selectCapturedListing(storage, "second", "product-a")
    selectCapturedListing(storage, "first", "product-a")
    selectCapturedListing(storage, "third", "product-b")
    selectCapturedListing(storage, "global")
    expect([...readComparisonSelection(storage, "product-a")]).toEqual(["first", "second"])
    expect([...readComparisonSelection(storage, "product-b")]).toEqual(["third"])
    expect([...readComparisonSelection(storage)]).toEqual(["global"])
    expect(comparisonKeys("product-a").selection).toBe("browsermind-listing-comparison-v1:product:product-a:selection")
    expect(comparisonDestination("product-a")).toBe("/pipeline/product-a?tab=comparar")
  })
  it("handles corrupt saved selections", () => {
    expect(readComparisonSelection({ getItem: () => "invalid" }).size).toBe(0)
    expect([...readComparisonSelection({ getItem: () => '["valid",null,2]' })]).toEqual(["valid"])
  })
  it("accepts only public offer URL shapes", () => {
    for (const url of ["https://www.mercadolivre.com.br/usb/p/MLB999?wid=MLB123", "https://www.mercadolivre.com.br/usb/up/MLBU123", "https://produto.mercadolivre.com.br/MLB-123-produto-_JM"]) expect(isPublicMercadoLivreListingUrl(url)).toBe(true)
    for (const url of [null, "https://www.mercadolivre.com.br/my-account", "https://www.mercadolivre.com.br/vendas", "https://vendedores.mercadolivre.com.br/p/MLB123", "https://www.mercadolivre.com.br/anuncios/MLB123", "https://lista.mercadolivre.com.br/usb", "https://www.mercadolivre.com.br.evil.test/p/MLB123", "http://www.mercadolivre.com.br/p/MLB123", "https://user:password@www.mercadolivre.com.br/p/MLB123"]) expect(isPublicMercadoLivreListingUrl(url)).toBe(false)
  })
})
