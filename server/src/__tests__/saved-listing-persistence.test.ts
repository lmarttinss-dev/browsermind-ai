import { beforeAll, afterAll, describe, it, expect } from "vitest"
import mongoose from "mongoose"
import { MongoMemoryServer } from "mongodb-memory-server"
import { savedListingRepository as store } from "../models/saved-market-listing.js"
import { normalizeListing } from "../market-analysis.js"

let database: MongoMemoryServer
beforeAll(async () => {
  database = await MongoMemoryServer.create({ instance: { launchTimeout: 45000 } })
  await mongoose.connect(database.getUri())
  await mongoose.model('SavedMarketListing').init()
}, 60000)
afterAll(async () => { await mongoose.disconnect(); await database?.stop() })
describe('product-scoped listing persistence', () => {
  it('persists the same offer independently in multiple products and keeps legacy rows unassigned', async () => {
    const row = normalizeListing({ positions: [1], itemId: 'MLB123', catalogId: null, title: 'Produto', seller: 'Loja', url: null, advertising: false, metrics: '' }, 0)
    await mongoose.model('SavedMarketListing').collection.insertOne({ id: 'legacy', identity: 'MLB123', listing: { ...row, id: 'legacy' } })
    await store.save('MLB123', { ...row, id: 'a' }, 'product-a')
    await store.save('MLB123', { ...row, id: 'b' }, 'product-b')
    expect((await store.list('product-a')).map(row => row.id)).toEqual(['a'])
    expect((await store.list('product-b')).map(row => row.id)).toEqual(['b'])
    expect((await store.list()).map(row => row.id)).toEqual(['legacy'])
    await store.save('MLB123', { ...row, id: 'a', metrics: 'updated' }, 'product-a')
    expect(await store.list('product-a')).toHaveLength(1)
    expect((await store.list('product-b'))[0].metrics).toBe('')
    await store.remove('a', 'product-b')
    expect(await store.list('product-a')).toHaveLength(1)
    await store.remove('a', 'product-a')
    expect(await store.list('product-a')).toHaveLength(0)
    expect(await store.list('product-b')).toHaveLength(1)
    await store.save('MLB123', { ...row, id: 'legacy', metrics: 'legacy updated' })
    expect(await store.list()).toHaveLength(1)
    expect((await store.list())[0].metrics).toBe('legacy updated')
  })
})
