import { SupplierRecord } from "./models/supplier.js"

// Atomic per supplier, resumable and safe to run repeatedly. Legacy fields are
// retained as a read-only snapshot; an existing links array is never overwritten.
export async function migrateSupplierLinks() {
  const records = await SupplierRecord.find({ links: { $exists: false } }).lean()
  for (const record of records) {
    const { productId, priceAmount, currency, unitPrice, moq, deliveryTime, paymentTerms, domesticFreight, originCountry, incoterm, transportMode, sample, notes } = record
    const links = productId ? [{ productId, priceAmount, currency, unitPrice, moq, deliveryTime, paymentTerms, domesticFreight, originCountry, incoterm, transportMode, sample, notes }] : []
    await SupplierRecord.updateOne({ _id: record._id, links: { $exists: false } }, { $set: { links } })
  }
}
