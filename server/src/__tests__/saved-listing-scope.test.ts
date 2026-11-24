import { describe, it, expect } from "vitest"
import express from "express"
import request from "supertest"
import { createMarketAnalysisRouter } from "../routes/market-analysis.js"

function setup() {
  const row = { positions: [1], itemId: 'MLB123', catalogId: null, title: 'Produto', seller: 'Loja', url: 'https://produto.mercadolivre.com.br/MLB-123-produto-_JM', advertising: false, metrics: 'Vendas estimadas\n9' }
  return express().use(express.json()).use('/market', createMarketAnalysisRouter(async () => ({ url: row.url, title: row.title, listings: [row], ready: true })))
}
describe('saved listings belong to one product', () => {
  it('isolates captures, refreshes, Ads, deletion and analysis between products and the general workspace', async () => {
    const app = setup()
    const global = (await request(app).post('/market/save-current').send({}).expect(200)).body
    const a = (await request(app).post('/market/save-current').send({ productId: 'a' }).expect(200)).body
    const b = (await request(app).post('/market/save-current').send({ productId: 'b' }).expect(200)).body
    expect(new Set([global.savedId, a.savedId, b.savedId]).size).toBe(3)
    for (const [query, id] of [['', global.savedId], ['?productId=a', a.savedId], ['?productId=b', b.savedId]]) {
      const rows = (await request(app).get('/market/listings' + query).expect(200)).body.snapshot.listings
      expect(rows.map((row: any) => row.id)).toEqual([id])
    }
    expect((await request(app).get('/market/listings?productId=unrelated').expect(200)).body.snapshot.listings).toEqual([])
    const refreshed = (await request(app).post('/market/save-current').send({ productId: 'a' }).expect(200)).body
    expect(refreshed.savedId).toBe(a.savedId)
    await request(app).patch('/market/listings/' + a.savedId + '/ads').send({ productId: 'b', adsStatus: 'yes' }).expect(404)
    await request(app).patch('/market/listings/' + a.savedId + '/ads').send({ productId: 'a', adsStatus: 'yes' }).expect(200)
    expect((await request(app).get('/market/listings?productId=b')).body.snapshot.listings[0].adsStatus).toBe('unknown')
    await request(app).post('/market/analyze').send({ productId: 'b', savedListingIds: [a.savedId] }).expect(400)
    await request(app).post('/market/analyze').send({ savedListingIds: [a.savedId] }).expect(400)
    const result = (await request(app).post('/market/analyze').send({ productId: 'a', savedListingIds: [a.savedId] }).expect(200)).body.analysis
    expect(result.selectedIds).toEqual([a.savedId])
    await request(app).delete('/market/listings/' + a.savedId + '?productId=b').expect(200)
    expect((await request(app).get('/market/listings?productId=a')).body.snapshot.listings).toHaveLength(1)
    await request(app).delete('/market/listings/' + a.savedId + '?productId=a').expect(200)
    expect((await request(app).get('/market/listings?productId=a')).body.snapshot.listings).toHaveLength(0)
    expect((await request(app).get('/market/listings?productId=b')).body.snapshot.listings).toHaveLength(1)
    const snapshot = (await request(app).post('/market/capture').send({ productId: 'a' }).expect(200)).body.snapshot
    await request(app).post('/market/analyze').send({ productId: 'b', snapshotId: snapshot.id, selectedIds: ['listing-0'] }).expect(410)
  })
  it('preserves known legacy selections without exposing unrelated or other-product fichas', async () => {
    const app = setup()
    const legacy = (await request(app).post('/market/save-current').send({}).expect(200)).body
    const other = (await request(app).post('/market/save-current').send({ productId: 'other' }).expect(200)).body
    const adopted = (await request(app).post('/market/adopt-legacy').send({ productId: 'a', listingIds: [legacy.savedId, other.savedId] }).expect(200)).body
    expect(adopted.snapshot.listings).toHaveLength(1)
    expect(adopted.idMap[other.savedId]).toBeUndefined()
    expect(adopted.idMap[legacy.savedId]).not.toBe(legacy.savedId)
    const again = (await request(app).post('/market/adopt-legacy').send({ productId: 'a', listingIds: [legacy.savedId, adopted.idMap[legacy.savedId]] }).expect(200)).body
    expect(again.snapshot.listings).toHaveLength(1)
    expect((await request(app).get('/market/listings?productId=b')).body.snapshot.listings).toEqual([])
    expect((await request(app).get('/market/listings')).body.snapshot.listings).toHaveLength(1)
    await request(app).get('/market/listings?productId[x]=a').expect(400)
    await request(app).post('/market/save-current').send({ productId: {} }).expect(400)
    await request(app).post('/market/adopt-legacy').send({ listingIds: [legacy.savedId] }).expect(400)
  })
})
