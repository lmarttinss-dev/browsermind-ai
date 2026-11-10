import { afterAll, beforeAll, describe, expect, it } from "vitest"
import { chromium, type Browser, type Page } from "playwright"
import express from "express"
import request from "supertest"
import { extractIndividualListing, parseAvantproFields } from "../individual-listing.js"
import { createMarketAnalysisRouter } from "../routes/market-analysis.js"

let browser: Browser
let page: Page
beforeAll(async () => { browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] }); page = await browser.newPage() }, 60000)
afterAll(async () => { await browser?.close() })
const html = `<h1 class="ui-pdp-title">Adaptador USB-C</h1>
<div class="ui-pdp-gallery__figure"><img src="https://http2.mlstatic.com/cover.webp"></div>
<div class="ui-pdp-price__second-line"><span class="andes-money-amount"><span class="andes-money-amount__fraction">26</span><span class="andes-money-amount__cents">49</span></span></div>
<a class="ui-pdp-seller__link-trigger">LOJA_A</a><span aria-label="Está no Full"></span><div class="ui-pdp-stock-information">Armazenado e enviado pelo FULL</div>
<div class="avantpro-panel">5 Vendidos<br>5 Estoque<br>Vendas estimadas<br>9<br>Ritmo atual (vendas/mês)<br>7<br>Visitas<br>0<br>Vendas mensais<br>2/Mês<br>Anúncio criado em<br>16/09/2026</div>
<div class="ui-pdp-recommendations"><div class="avantpro-product-container">Vendas estimadas: 9999</div></div>`

describe('individual offer capture', () => {
  it('captures only the current offer, retains distinct labels and excludes recommendations', async () => {
    await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: html }))
    await page.goto('https://www.mercadolivre.com.br/usb/p/MLB999?pdp_filters=item_id%3AMLB123#wid=MLB123')
    const row = await page.evaluate(extractIndividualListing)
    expect(row).toMatchObject({ itemId: 'MLB123', catalogId: 'MLB999', seller: 'LOJA_A', imageUrl: 'https://http2.mlstatic.com/cover.webp' })
    expect(row.observed).toMatchObject({ price: 26.49, logistics: 'Full' })
    expect(row.metrics).not.toContain('9999')
    const fields = parseAvantproFields(row.metrics)
    expect(fields.find(field => field.label === 'Vendidos')?.value).toBe('5')
    expect(fields.find(field => field.label === 'Vendas estimadas')?.value).toBe('9')
    expect(fields.find(field => field.label === 'Ritmo atual (vendas/mês)')?.value).toBe('7')
    expect(fields.find(field => field.label === 'Vendas mensais')?.value).toBe('2/Mês')
    expect(fields.find(field => field.label === 'Visitas')?.value).toBe('0')
    expect(fields.every(field => field.scope === 'unknown' && field.period === null)).toBe(true)
  })
  it('prefers the actual seller over generic links and preserves AvantPro fallback', async () => {
    await page.goto('https://www.mercadolivre.com.br/usb/p/MLB999?wid=MLB123')
    await page.setContent('<h1 class="ui-pdp-title">Produto</h1><a class="ui-pdp-seller__link-trigger">Ver mais dados deste vendedor</a><div class="ui-pdp-seller__label-sold">Vendido por <a>LOJA CORRETA</a></div><div class="ui-pdp-recommendations"><span class="ui-pdp-seller__label-sold">Outra loja</span></div>')
    expect((await page.evaluate(extractIndividualListing)).seller).toBe('LOJA CORRETA')
    await page.setContent('<h1 class="ui-pdp-title">Produto</h1><span class="ui-pdp-seller__label-text-with-icon">Vendido por LOJA SEM LINK</span>')
    expect((await page.evaluate(extractIndividualListing)).seller).toBe('LOJA SEM LINK')
    await page.setContent('<h1 class="ui-pdp-title">Produto</h1><div class="avantpro-panel">Nome do vendedor<br>LOJA AVANTPRO</div>')
    expect((await page.evaluate(extractIndividualListing)).seller).toBe('LOJA AVANTPRO')
    await page.setContent('<h1 class="ui-pdp-title">Produto</h1><a class="ui-pdp-seller__link-trigger">Ver mais dados deste vendedor</a>')
    expect((await page.evaluate(extractIndividualListing)).seller).toBeNull()
  })
  it('detects nonempty ad_click_id in query or fragment without mistaking offer IDs for Ads', async () => {
    for (const suffix of ['?pdp_filters=item_id:MLB123#ad_click_id=NjUwMmZkNjEtYjQ2Mi00OWVmLWJlNjItZDk1ZTM0ZWE3ZTQy&is_advertising=true', '?ad_click_id=click-query&wid=MLB123']) {
      await page.goto('https://www.mercadolivre.com.br/usb/up/MLBU2954769327' + suffix)
      const row = await page.evaluate(extractIndividualListing)
      expect(row.adClickId).toBeTruthy()
      expect(row.advertising).toBe(true)
      expect(row.observed?.sponsored).toBe(true)
      expect(row.itemId).toBe('MLB123')
    }
    for (const suffix of ['?wid=MLB123', '?wid=MLB123#ad_click_id=', '?wid=MLB123&ad_click_id=%20']) {
      await page.goto('https://www.mercadolivre.com.br/usb/up/MLBU2954769327' + suffix)
      const row = await page.evaluate(extractIndividualListing)
      expect(row.adClickId).toBeNull()
      expect(row.advertising).toBe(false)
    }
  })
  it('reads AvantPro badges including shadow DOM and uses Outros when absent', async () => {
    await page.goto('https://www.mercadolivre.com.br/usb/p/MLB999?wid=MLB123')
    await page.setContent('<h1 class="ui-pdp-title">Produto</h1><span aria-label="Está no Flex"></span>')
    expect((await page.evaluate(extractIndividualListing)).observed?.logistics).toBe('Flex')
    await page.setContent('<h1 class="ui-pdp-title">Produto</h1><div id="host"></div><div class="ui-pdp-recommendations"><span aria-label="Está no Full"></span></div>')
    expect((await page.evaluate(extractIndividualListing)).observed?.logistics).toBe('Outros')
    await page.evaluate(() => { document.querySelector('#host')!.attachShadow({ mode: 'open' }).innerHTML = '<span aria-label="Está no Full"></span>' })
    expect((await page.evaluate(extractIndividualListing)).observed?.logistics).toBe('Full')
  })
  it('rejects search pages and unsupported domains', async () => {
    await page.goto('https://lista.mercadolivre.com.br/usb')
    await page.setContent('<h1>Resultados</h1><div class="poly-card">Sugestão</div>')
    await expect(page.evaluate(extractIndividualListing)).rejects.toThrow('não é um anúncio individual')
    await page.goto('https://example.com')
    await expect(page.evaluate(extractIndividualListing)).rejects.toThrow('Mercado Livre')
  })
  it('saves multiple offers, refreshes an existing ID, analyzes only saved selections and removes offers', async () => {
    let row = { positions: [1], itemId: 'MLB123', catalogId: 'MLB999', title: 'Produto A', seller: 'LOJA_A', url: 'https://www.mercadolivre.com.br/p/MLB999?wid=MLB123', advertising: false, metrics: 'Vendas estimadas\n9\nRitmo atual (vendas/mês)\n7\nVendas mensais\n2/Mês' }
    const narrate = async (model: string, analysis: any) => ({ model, text: analysis.selected.map((row: any) => row.itemId).join(','), generatedAt: new Date().toISOString() })
    const app = express().use(express.json()).use('/market', createMarketAnalysisRouter(async () => ({ url: row.url, title: row.title, listings: [row], ready: true }), narrate))
    const first = (await request(app).post('/market/save-current').expect(200)).body
    await request(app).patch('/market/listings/' + first.savedId + '/ads').send({ adsStatus: 'invalid' }).expect(400)
    await request(app).patch('/market/listings/missing/ads').send({ adsStatus: 'yes' }).expect(404)
    await request(app).patch('/market/listings/' + first.savedId + '/ads').send({ adsStatus: 'yes' }).expect(200)
    row = { ...row, metrics: 'Vendas estimadas\n10' }
    const refreshed = (await request(app).post('/market/save-current').expect(200)).body
    expect(refreshed.snapshot.listings[0].adsStatus).toBe("yes")
    expect(refreshed.snapshot.listings[0].sponsored).toBe(true)
    expect(refreshed.savedId).toBe(first.savedId)
    expect(refreshed.snapshot.listings).toHaveLength(1)
    row = { ...row, itemId: 'MLB456', seller: 'LOJA_B', url: 'https://www.mercadolivre.com.br/p/MLB999?wid=MLB456' }
    const second = (await request(app).post('/market/save-current').expect(200)).body
    expect(second.snapshot.listings).toHaveLength(2)
    expect((await request(app).get('/market/listings').expect(200)).body.snapshot.listings).toHaveLength(2)
    const result = (await request(app).post('/market/analyze').send({ savedListingIds: [first.savedId], model: 'gpt-4.1' }).expect(200)).body.analysis
    expect(result.sponsored).toBe(1)
    expect(result.adsCoverage).toBe(1)
    expect(result.ai.text).toBe('MLB123')
    expect(result.sales30d).toBeNull()
    expect(result.selected[0].avantproFields.find((field: any) => field.label === 'Vendas estimadas').value).toBe('10')
    await request(app).post('/market/analyze').send({ savedListingIds: [first.savedId, first.savedId], model: 'gpt-4.1' }).expect(400)
    await request(app).delete('/market/listings/' + first.savedId).expect(200)
    await request(app).post('/market/analyze').send({ savedListingIds: [first.savedId], model: 'gpt-4.1' }).expect(400)
    expect((await request(app).get('/market/listings')).body.snapshot.listings).toHaveLength(1)
  })
})
