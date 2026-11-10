import { Schema, model } from "mongoose"
import type { MarketListing } from "../market-analysis.js"

const schema = new Schema({ id: { type: String, required: true, unique: true }, identity: { type: String, required: true, unique: true },
  listing: { type: Schema.Types.Mixed, required: true } }, { timestamps: true })
const SavedListing = model("SavedMarketListing", schema)
export type SavedListingRepository = {
  list(): Promise<MarketListing[]>
  save(identity: string, listing: MarketListing): Promise<void>
  remove(ids: string[]): Promise<number>
}
export const savedListingRepository: SavedListingRepository = {
  async list() { return (await SavedListing.find().sort({ updatedAt: -1 }).lean()).map(row => row.listing as MarketListing) },
  async save(identity, listing) { await SavedListing.updateOne({ identity }, { $set: { id: listing.id, listing } }, { upsert: true }) },
  async remove(ids) {
    const { deletedCount } = await SavedListing.deleteMany({ id: { $in: ids } })
    return deletedCount
  },
}
