// All API requests are mocked; no marketplace or account data is accessed.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { analyzeSelection, emptyProfile, normalizeListing } from '../src/market-analysis.ts'
import { marketReportHtml, validatePdfReport } from '../src/market-report-pdf.ts'
const origin = process.env.WEBAPP_URL || 'http://localhost:5180'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
page.on("pageerror", error => console.error("UI error:", error.message))
const snapshot = { id: 'saved', title: 'Fichas', url: '', capturedAt: new Date().toISOString(), warnings: [], listings: [normalizeListing({ positions: [1], itemId: 'MLB123', catalogId: null, title: 'Produto', seller: 'Loja teste', url: null, advertising: false, metrics: '' }, 0)] }
const first = { ...analyzeSelection(snapshot, ['listing-0'], emptyProfile()), title: 'Relatório histórico A', analyzedAt: '2026-11-22T12:00:00.000Z' }
const second = { ...first, title: 'Relatório histórico B', analyzedAt: '2026-11-23T12:00:00.000Z' }
const failed = { ...first, title: 'Relatório histórico C', analyzedAt: '2026-11-21T12:00:00.000Z' }
let pendingResolve
let requests = 0
await page.addInitScript(({ first, second, failed }) => localStorage.setItem('browsermind-listing-comparison-v1:product:test-product', JSON.stringify([first, second, failed])), { first, second, failed })
await page.route('**/*', async route => {
  const url = new URL(route.request().url())
  if (url.origin !== new URL(origin).origin) return route.abort()
  const path = url.pathname
  if (path === '/health') return route.fulfill({ json: { status: 'ok' } })
  if (path === '/status') return route.fulfill({ json: { active: false } })
  if (path === '/api/config') return route.fulfill({ json: { defaultModel: 'gpt-4.1' } })
  if (path === '/api/pipeline/test-product') return route.fulfill({ json: { product: { _id: 'test-product', title: 'Produto teste', stage: 'triagem', price: 0, score: 0, monthlySales: 0, analysisReport: '', suppliers: [], isKit: false, kitItems: [], marketReport: '', competitionLevel: 'Baixa', category: '', url: '', imageUrl: '', potentialMargin: '', updatedAt: '2026-11-23T12:00:00.000Z', analyzedAt: '2026-11-23T12:00:00.000Z' } } })
  if (path === '/api/market-analysis/listings') return route.fulfill({ json: { snapshot } })
  if (path === '/api/market-analysis/report-html') {
    requests++
    const analysis = route.request().postDataJSON().analysis
    if (analysis.title.endsWith(' B')) await new Promise(resolve => { pendingResolve = resolve })
    if (analysis.title.endsWith(' C')) return route.fulfill({ status: 500, json: { error: 'Falha simulada' } })
    return route.fulfill({ json: { html: marketReportHtml(validatePdfReport(analysis)) } })
  }
  if (path.startsWith('/api/')) return route.fulfill({ json: {} })
  return route.continue()
})
const frame = () => page.frameLocator('iframe[title="Comparação de anúncios"]')
const selectHistory = async name => {
  await page.getByRole('button', { name: /^Histórico \(/ }).click()
  await page.getByRole('button', { name: new RegExp('^' + name) }).click()
}
try {
  await page.goto(origin + '/pipeline/test-product?tab=comparar')
  await selectHistory(first.title)
  await frame().getByRole('heading', { name: 'Anúncios do mesmo produto', exact: true }).waitFor()
  const firstLoadedRequests = requests
  await page.getByRole('button', { name: /^Histórico \(/ }).click()
  assert.equal(await page.locator('iframe[title="Comparação de anúncios"]').count(), 1, 'Opening the history must preserve the report')
  await page.getByRole('button', { name: new RegExp('^' + second.title) }).click()
  await page.waitForFunction(() => document.body.innerText.includes('Preparando relatório HTML') || document.body.innerText.includes('Carregando relatório selecionado'))
  assert.equal(await page.locator('iframe[title="Comparação de anúncios"]').count(), 1, 'The previous report must stay visible while the selected report loads')
  assert.ok(pendingResolve)
  pendingResolve()
  await frame().getByText(/23\/11\/2026/).first().waitFor()
  await selectHistory(first.title)
  await frame().getByText(/22\/11\/2026/).first().waitFor()
  assert.equal(requests, firstLoadedRequests + 1, 'Reopening a loaded history item must use its cached HTML')
  await selectHistory(failed.title)
  await page.getByRole('alert').waitFor()
  assert.equal(await page.locator('iframe[title="Comparação de anúncios"]').count(), 1, 'A failed history load must not erase the previous report')
  await frame().getByText(/22\/11\/2026/).first().waitFor()
  console.log('PASS: history switching, preserved report during loading and errors, cached history')
} catch (error) { console.error("Visible UI:", (await page.locator("body").innerText()).slice(0, 2000)); throw error } finally { pendingResolve?.(); await browser.close() }
