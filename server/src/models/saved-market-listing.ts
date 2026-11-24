import { Schema, model } from "mongoose"
import type { MarketListing } from "../market-analysis.js"

const schema = new Schema({ id: { type: String, required: true, unique: true }, identity: { type: String, required: true, unique: true },
  productId: { type: String, default: null, index: true },
  listing: { type: Schema.Types.Mixed, required: true } }, { timestamps: true })
const SavedListing = model("SavedMarketListing", schema)
export type SavedListingRepository = {
  list(productId?: string): Promise<MarketListing[]>
  save(identity: string, listing: MarketListing, productId?: string): Promise<void>
  remove(id: string, productId?: string): Promise<void>
}
export const savedListingRepository: SavedListingRepository = {
  async list(productId) { return (await SavedListing.find({ productId: productId || null }).sort({ updatedAt: -1 }).lean()).map(row => row.listing as MarketListing) },
  async save(identity, listing, productId) {
    const scopedIdentity = productId ? `${productId}:${identity}` : identity
    await SavedListing.updateOne({ identity: scopedIdentity, productId: productId || null }, { $set: { id: listing.id, listing, productId: productId || null } }, { upsert: true })
  },
  async remove(id, productId) { await SavedListing.deleteOne({ id, productId: productId || null }) },
}
