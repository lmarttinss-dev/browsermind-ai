import { chromium } from "playwright"
import { describe, expect, it } from "vitest"
import express from "express"
import request from "supertest"
import { marketReportHtml, validatePdfReport } from "../market-report-pdf.js"
import { normalizeListing, analyzeSelection, emptyProfile } from "../market-analysis.js"
import { createMarketAnalysisRouter } from "../routes/market-analysis.js"

const analysis = analyzeSelection({ id: 'test', title: 'Teste', url: 'https://example.com', capturedAt: new Date().toISOString(), warnings: [], listings: [normalizeListing({ positions: [1], itemId: 'MLB123', catalogId: null, title: 'Produto', seller: 'Loja', url: null, advertising: false, metrics: '' }, 0)] }, ['listing-0'], emptyProfile())
const sections = { decision: { status: 'Entrar com plano', title: '<script>alert(1)</script>', summary: 'Avalie o preço e a logística.' }, logistics: 'Compare os prazos.', pricing: 'Simule os custos.', actions: ['Semana 1', 'Semana 2', '30 dias', '60 dias'].map(period => ({ period, title: 'Ação', description: 'Validar a oferta.' })) }
describe('PDF report', () => {
  it('uses the shared HTML template, escaped text and no reference listing', () => {
    const data = validatePdfReport({ ...analysis, ai: { sections } })
    const html = marketReportHtml(data)
    expect(html).toContain('class="cover"')
    expect(html).not.toContain('class="contents"')
    expect(html).not.toContain('aria-label="Sumário"')
    expect(html).not.toContain('Referência:')
    expect(html).toContain('Loja')
    expect(html).not.toContain('Fontes e cobertura')
    expect(html).not.toContain('id="sources"')
    expect(html).not.toContain('href="#sources"')
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    for (const title of ['Anúncios selecionados', 'Logística dos anúncios', 'Preço e posicionamento', 'Próximos passos', 'Com sinal de Ads']) expect(html).toContain(title)
    expect(html).not.toContain('https://example.com')
  })
  it('rejects invalid reports and does not inject historical markup', async () => {
    expect(() => validatePdfReport({ ...analysis, total: 0 })).toThrow()
    expect(() => validatePdfReport({ ...analysis, sponsored: 201 })).toThrow()
    expect(() => validatePdfReport({ ...analysis, pricing: { min: NaN } })).toThrow()
    expect(marketReportHtml(validatePdfReport({ ...analysis, ai: { text: '<img onerror=alert(1)>' } }))).not.toContain('<img onerror=alert(1)>')
    const app = express().use(express.json()).use('/market', createMarketAnalysisRouter(async () => { throw new Error('Not used') }))
    await request(app).post('/market/report-html').send({ analysis }).expect(200).expect(res => expect(res.body.html).toContain('Anúncios do mesmo produto'))
    await request(app).post('/market/report-html').send({ analysis: { ...analysis, selected: [{ title: 'x', price: 'invalid' }] } }).expect(400)
    await request(app).post('/market/export-pdf').send({ analysis: { total: 0 } }).expect(400)
  })
  it('shows a complete listing table with photo, seller links, logistics, Ads and AvantPro metrics', () => {
    const selected = [{ ...analysis.selected[0], title: 'Adaptador USB', seller: 'Loja & Cia', url: 'https://www.mercadolivre.com.br/p/MLB123', imageUrl: 'https://http2.mlstatic.com/foto.webp', metrics: 'Métrica exclusiva 999', avantproFields: [{ label: 'Vendas estimadas', value: '0' }, { label: 'Vendas mensais', value: '9/Mês' }], price: 123, logistics: 'Full', freeShipping: true, delivery: 'Chega amanhã', adsStatus: 'no' as const, sponsored: true }]
    const html = marketReportHtml(validatePdfReport({ ...analysis, selected }))
    const section = html.split('<section class="report-section" id="comparison">')[1].split('<section class="report-section" id="pricing">')[0]
    expect(section).toContain('src="https://http2.mlstatic.com/foto.webp"')
    expect(section).toContain('href="https://www.mercadolivre.com.br/p/MLB123"')
    expect(section).toContain('Loja &amp; Cia</a>')
    for (const text of ['Adaptador USB', '123,00', '<table', 'Full', 'Frete grátis', 'Chega amanhã', 'Não (informado)', 'Vendas estimadas', '<dd>0</dd>', '9/Mês', 'Anúncio: MLB123', 'Captura:']) expect(section).toContain(text)
    expect(section).not.toContain('Sinal identificado')
    const unsafe = marketReportHtml(validatePdfReport({ ...analysis, selected: [{ title: 'Produto', seller: '<script>', url: 'javascript:alert(1)', imageUrl: 'https://evil.test/tracker' }] }))
    expect(unsafe).not.toContain('javascript:')
    expect(unsafe).not.toContain('https://evil.test')
    expect(unsafe).toContain('Sem foto')
    expect(unsafe).toContain('&lt;script&gt;')
  })
  it('renders the fixed template on desktop, mobile and PDF without network access', async () => {
    const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
    try {
      const page = await browser.newPage()
      await page.route('**/*', route => route.request().url() === 'https://http2.mlstatic.com/foto.png'
        ? route.fulfill({ contentType: 'image/png', body: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jG2kAAAAASUVORK5CYII=', 'base64') })
        : route.abort())
      await page.setContent(marketReportHtml(validatePdfReport({ ...analysis, selected: [{ ...analysis.selected[0], seller: 'Loja teste', url: 'https://www.mercadolivre.com.br/p/MLB123', imageUrl: 'https://http2.mlstatic.com/foto.png', avantproFields: ['Vendidos', 'Estoque', 'Vendas estimadas', 'Ritmo atual (vendas/mês)', 'Visitas', 'Vendas por dia', 'Vendas mensais', 'Conversão', 'Anúncio criado em', 'Catálogo criado em'].map(label => ({ label, value: label.includes('criado') ? '01/11/2026' : '123' })) }], ai: { sections } })))
      for (const width of [1280, 390]) {
        await page.setViewportSize({ width, height: 900 })
        expect(await page.locator('h1').innerText()).toBe('Anúncios do mesmo produto')
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
        expect(await page.locator('.contents a').count()).toBe(0)
        expect(await page.locator('#comparison img').evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1)
        expect(await page.locator('#comparison .listing-seller').innerText()).toBe('Loja teste')
        expect(await page.locator('#comparison .listing-metrics>div').count()).toBe(10)
        expect(await page.locator('#comparison tbody tr').evaluate(row => row.getBoundingClientRect().height)).toBeLessThan(200)
        expect(await page.locator('#comparison th').count()).toBe(6)
        expect(await page.locator('#comparison tbody tr td').count()).toBe(6)
      }
      await page.setViewportSize({ width: 1280, height: 1100 })
      await page.locator('#comparison').screenshot({ path: '/tmp/browsermind-selected-listings-table.png' })
      const pdf = await page.pdf({ format: 'A4', printBackground: true })
      expect(pdf.subarray(0, 4).toString()).toBe('%PDF')
    } finally { await browser.close() }
  }, 30000)

})
