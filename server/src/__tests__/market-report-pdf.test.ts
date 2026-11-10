import { describe, expect, it } from "vitest"
import express from "express"
import request from "supertest"
import { marketReportHtml, validatePdfReport } from "../market-report-pdf.js"
import { normalizeListing, analyzeSelection, emptyProfile } from "../market-analysis.js"
import { createMarketAnalysisRouter } from "../routes/market-analysis.js"

const analysis = analyzeSelection({ id: 'test', title: 'Teste', url: 'https://example.com', capturedAt: new Date().toISOString(), warnings: [], listings: [normalizeListing({ positions: [1], itemId: 'MLB123', catalogId: null, title: 'Produto', seller: 'Loja', url: null, advertising: false, metrics: '' }, 0)] }, ['listing-0'], emptyProfile())
const sections = { decision: { status: 'Entrar com plano', title: '<script>alert(1)</script>', summary: 'Avalie o preço e a logística.' }, logistics: 'Compare os prazos.', pricing: 'Simule os custos.', actions: ['Semana 1', 'Semana 2', '30 dias', '60 dias'].map(period => ({ period, title: 'Ação', description: 'Validar a oferta.' })) }
describe('PDF report', () => {
  it('uses two fixed pages, escaped text and the reference sections', () => {
    const data = validatePdfReport({ ...analysis, ai: { sections } })
    const html = marketReportHtml(data)
    expect(html.match(/<section class="page">/g)).toHaveLength(2)
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
    expect(html).not.toContain('<script>')
    for (const title of ['Matriz de prontidão', 'Logística dos concorrentes', 'Precificação', 'Plano de ação passo a passo', 'Concorrentes com ADS']) expect(html).toContain(title)
    expect(html).not.toContain('https://example.com')
  })
  it('rejects invalid reports and preserves historical narrative safely', async () => {
    expect(() => validatePdfReport({ ...analysis, total: 0 })).toThrow()
    expect(() => validatePdfReport({ ...analysis, sponsored: 201 })).toThrow()
    expect(() => validatePdfReport({ ...analysis, pricing: { min: NaN } })).toThrow()
    expect(marketReportHtml(validatePdfReport({ ...analysis, ai: { text: '<img onerror=alert(1)>' } }))).toContain('&lt;img onerror=alert(1)&gt;')
    const app = express().use(express.json()).use('/market', createMarketAnalysisRouter(async () => { throw new Error('Not used') }))
    await request(app).post('/market/export-pdf').send({ analysis: { total: 0 } }).expect(400)
  })
})
