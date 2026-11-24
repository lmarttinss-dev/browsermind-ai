// Run with the webapp on 5180: node --import tsx scripts/listing-capture-ui-smoke.mjs
// All API requests and external resources are mocked. No marketplace pages are opened.
import { chromium } from 'playwright'
import assert from 'node:assert/strict'
import { normalizeListing } from '../src/market-analysis.ts'

const origin = process.env.WEBAPP_URL || 'http://localhost:5180'
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] })
const page = await browser.newPage()
const snapshot = { id: 'saved', url: '', title: 'Anúncios salvos', capturedAt: new Date().toISOString(), listings: [], warnings: [] }
const snapshots = new Map([['', snapshot]])
const scopedSnapshot = productId => {
  if (!snapshots.has(productId)) snapshots.set(productId, { ...snapshot, listings: [] })
  return snapshots.get(productId)
}
let captureFails = false
let browserUrl = 'https://www.mercadolivre.com.br/usb/p/MLB999?wid=MLB123'
let captures = 0
let listingRequests = 0
const listing = { ...normalizeListing({ positions: [1], itemId: 'MLB123', catalogId: 'MLB999', title: 'Adaptador USB', seller: 'Loja teste', url: browserUrl, advertising: false, metrics: 'Vendas estimadas\n9\nRitmo atual (vendas/mês)\n7', observed: { price: 29.9, logistics: 'Full', freeShipping: null, delivery: null, sponsored: false } }, 0), id: 'captured-listing' }
await page.route('**/*', async route => {
  const url = new URL(route.request().url())
  if (url.origin !== new URL(origin).origin) return route.abort()
  const path = url.pathname
  if (path === '/health') return route.fulfill({ json: { status: 'ok' } })
  if (path === '/status') return route.fulfill({ json: { active: true, url: browserUrl, title: 'Anúncio público simulado' } })
  if (path === '/api/config') return route.fulfill({ json: { defaultModel: 'gpt-4.1' } })
  if (path === '/api/market-analysis/listings') { listingRequests++; return route.fulfill({ json: { snapshot: scopedSnapshot(url.searchParams.get('productId') || '') } }) }
  if (path === '/api/market-analysis/adopt-legacy') {
    const { productId, listingIds } = route.request().postDataJSON()
    const scoped = scopedSnapshot(productId)
    return route.fulfill({ json: { snapshot: scoped, idMap: Object.fromEntries(scoped.listings.filter(row => listingIds.includes(row.id)).map(row => [row.id, row.id])) } })
  }
  if (path === '/api/market-analysis/save-current') {
    captures++
    if (captureFails) return route.fulfill({ status: 409, json: { error: 'AvantPro indisponível no teste.' } })
    const productId = route.request().postDataJSON().productId || ''
    const scoped = scopedSnapshot(productId)
    scoped.listings = [{ ...listing, id: listing.id + ':' + productId }]
    return route.fulfill({ json: { snapshot: scoped, savedId: scoped.listings[0].id } })
  }
  if (path.startsWith('/api/pipeline/')) {
    const id = path.split('/')[3]
    return route.fulfill({ json: { product: { _id: id, title: 'Produto ' + id, stage: 'triagem', price: 29.9, score: 0, monthlySales: 0, analysisReport: '', marketReport: '', supplierReport: '', suppliers: [], kitItems: [], isKit: false, competitionLevel: 'Baixa', potentialMargin: '', url: '', imageUrl: '', category: '', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() } } })
  }
  if (path.startsWith('/api/') || ['/screenshot', '/avantpro', '/extract'].some(prefix => path.startsWith(prefix))) return route.fulfill({ json: {} })
  return route.continue()
})
try {
  await page.goto(origin + '/listing-comparison')
  await page.getByRole('link', { name: 'Escolher produto', exact: true }).waitFor()
  assert.equal(await page.locator('.market-table').count(), 0, 'General entry must not display fichas')
  assert.equal(listingRequests, 0, 'General entry must not load unassigned fichas')
  await page.goto(origin + '/browser')
  await page.getByRole('heading', { name: 'Assistente de navegação', exact: true }).waitFor()
  assert.equal(await page.locator('.market-table').count(), 0, 'Assistant must not display fichas')
  assert.equal(await page.getByRole('link', { name: 'Voltar à comparação', exact: true }).count(), 0, 'Assistant without a product must not link to unassigned fichas')
  assert.equal(listingRequests, 0)
  await page.goto(origin + '/pipeline/product-a?tab=comparar')
  await page.getByRole('heading', { name: 'Comparar anúncios', exact: true }).waitFor()
  await page.getByRole('link', { name: 'Abrir assistente de navegação', exact: true }).click()
  assert.match(page.url(), /comparisonProductId=product-a/)
  await page.getByRole('heading', { name: 'Assistente de navegação', exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Capturar anúncio com AvantPro', exact: true }).count(), 0, 'Assistant must not show a capture button')
  await page.getByRole('link', { name: 'Voltar à comparação', exact: true }).click()
  await page.getByRole('heading', { name: 'Comparar anúncios', exact: true }).waitFor()
  await page.getByRole('button', { name: 'Capturar anúncio com AvantPro', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Anúncio salvo e selecionado' }).waitFor()
  const checkbox = page.getByRole('checkbox', { name: 'Selecionar Adaptador USB', exact: true })
  await checkbox.waitFor()
  assert.equal(await checkbox.isChecked(), true)
  assert.match(await page.locator('tbody').innerText(), /Vendas estimadas/)
  await page.getByRole('button', { name: 'Capturar anúncio com AvantPro', exact: true }).click()
  await page.getByRole('status').filter({ hasText: 'Anúncio salvo e selecionado' }).waitFor()
  assert.equal(await page.getByRole('checkbox').count(), 1, 'Recapture must update the same offer')
  captureFails = true
  await page.getByRole('button', { name: 'Capturar anúncio com AvantPro', exact: true }).click()
  await page.getByRole('alert').filter({ hasText: 'AvantPro indisponível' }).waitFor()
  assert.equal(await checkbox.isChecked(), true, 'Failed capture must preserve selection')
  await page.goto(origin + '/pipeline/product-b?tab=comparar')
  await page.getByText('0/0 selecionados · 0 visíveis', { exact: true }).waitFor()
  assert.equal(await page.getByRole('checkbox', { name: 'Selecionar Adaptador USB', exact: true }).count(), 0, 'Unrelated products must not show the captured ficha')
  for (const scoped of [snapshot, scopedSnapshot('product-a')]) scoped.listings = Array.from({ length: 30 }, (_, index) => ({ ...listing, id: 'scroll-' + index, title: 'Anúncio de teste ' + index }))
  for (const [target, width] of [['/pipeline/product-a?tab=comparar', 1280], ['/pipeline/product-a?tab=comparar', 390]]) {
    await page.setViewportSize({ width, height: 900 })
    await page.goto(origin + target)
    await page.getByRole('checkbox', { name: 'Selecionar Anúncio de teste 0', exact: true }).waitFor()
    const table = page.locator('.market-table')
    await table.scrollIntoViewIfNeeded()
    const scrollState = () => page.evaluate(() => [...document.querySelectorAll('#workspace, .market-page, .product-detail-page, .market-table')].map(el => ({ className: el.className, top: el.scrollTop, height: el.clientHeight, total: el.scrollHeight })))
    await table.evaluate(el => el.scrollIntoView({ block: 'start' }))
    await page.mouse.move(Math.min(width - 30, 650), 350)
    const before = await scrollState()
    await page.mouse.wheel(0, 600)
    await page.waitForTimeout(250)
    const after = await scrollState()
    const tableIndex = before.findIndex(el => el.className.includes('market-table'))
    assert.equal(after[tableIndex].top, 0, 'The table must not trap vertical scrolling: ' + target)
    assert.ok(after.some((el, index) => index !== tableIndex && el.top > before[index].top), 'Wheel over the table must scroll the page: ' + target + JSON.stringify({ before, after }))
    const analyzeButton = page.getByRole('button', { name: /^Analisar \d+ anúncios selecionados$/ })
    await analyzeButton.scrollIntoViewIfNeeded()
    const buttonBox = await analyzeButton.boundingBox()
    assert.ok(buttonBox && buttonBox.y >= 0 && buttonBox.y < 900, 'The end of the comparison must be reachable')

  }
  browserUrl = 'https://www.mercadolivre.com.br/my-account'
  await page.goto(origin + '/pipeline/product-a?tab=comparar')
  await page.getByText('Abra uma página pública de anúncio do Mercado Livre.', { exact: true }).waitFor()
  assert.equal(await page.getByRole('button', { name: 'Capturar anúncio com AvantPro', exact: true }).isDisabled(), true)
  assert.equal(captures, 3, 'Private pages must not trigger capture')
  console.log('PASS: capture, AvantPro fields, product return, recapture, failure preservation, product isolation, desktop/mobile scrolling, private-page guard')
} finally { await browser.close() }
