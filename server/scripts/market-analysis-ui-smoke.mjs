// Run from server: node --import tsx scripts/market-analysis-ui-smoke.mjs
// Requires webapp on 5180. Browser requests use fixtures; no real seller data is changed.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { createMarketReportPdf, validatePdfReport } from '../src/market-report-pdf.ts';
import { generateMarketNarrative } from '../src/market-analysis-ai.ts';
import { analyzeSelection, normalizeListing } from '../src/market-analysis.ts';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
page.setDefaultTimeout(30000);
const errors = [];
page.on('pageerror', error => errors.push(error.message));
const allFixtures = { id: 'smoke', title: 'Adaptadores USB-C · fixture de validação', url: 'https://lista.mercadolivre.com.br/adaptadores', capturedAt: new Date().toISOString(), warnings: [],
  listings: [
    { title: 'Adaptador USB-C Full', itemId: 'MLB101', seller: 'LOJA_A', price: 19.9, logistics: 'Full', sales: 80, sponsored: true },
    { title: 'Adaptador USB-C Flex', itemId: 'MLB202', seller: 'LOJA_B', price: 29.9, logistics: 'Flex', sales: 20, sponsored: false },
    { title: 'Cabo USB-C', itemId: 'MLB303', seller: 'LOJA_C', price: 99, logistics: null, sales: 999, sponsored: false },
  ].map((row, index) => normalizeListing({ positions: [index + 1], itemId: row.itemId, catalogId: null, title: row.title, seller: row.seller,
    imageUrl: index === 0 ? "https://http2.mlstatic.com/smoke-cover.svg" : index === 1 ? "https://http2.mlstatic.com/missing-cover.webp" : null,
    url: `https://produto.mercadolivre.com.br/MLB-${row.itemId.slice(3)}-_JM`, advertising: row.sponsored, metrics: `5 Vendidos\nVendas estimadas\n9\nRitmo atual (vendas/mês)\n7\nVendas mensais\n2/Mês\nVendas (30 dias)\n${row.sales}`,
    observed: { price: row.price, logistics: row.logistics, freeShipping: true, delivery: row.logistics, sponsored: row.sponsored } }, index)) };
let snapshot = { ...allFixtures, listings: [] };
let nextCapture = 0;
let pdfInput;
let requestBody;
let captureFails = false;
await page.route('**/*', async route => {
  const pathname = new URL(route.request().url()).pathname;
  if (pathname === '/smoke-cover.svg') return route.fulfill({ contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect x="20" y="10" width="40" height="60" fill="#64748b"/></svg>' });
  if (pathname === '/missing-cover.webp') return route.fulfill({ status: 404, body: '' });
  if (pathname === '/health') return route.fulfill({ json: { status: 'ok' } });
  if (pathname === '/status') return route.fulfill({ json: { active: false } });
  if (pathname === '/api/market-analysis/listings') return route.fulfill({ json: { success: true, snapshot } });
  if (pathname.endsWith('/ads') && route.request().method() === 'PATCH') {
    const id = pathname.split('/').at(-2);
    const row = snapshot.listings.find(row => row.id === id);
    row.adsStatus = route.request().postDataJSON().adsStatus;
    row.sponsored = row.adsStatus === 'yes';
    return route.fulfill({ json: { success: true, snapshot } });
  }
  if (pathname === '/api/market-analysis/listings/bulk-delete') {
    const { ids } = route.request().postDataJSON();
    const before = snapshot.listings.length;
    snapshot.listings = snapshot.listings.filter(row => !ids.includes(row.id));
    return route.fulfill({ json: { success: true, snapshot, deletedCount: before - snapshot.listings.length } });
  }
  if (pathname === '/api/market-analysis/save-current') {
    if (captureFails) return route.fulfill({ status: 409, json: { error: 'Inicie o Browser para capturar.' } });
    const listing = allFixtures.listings[nextCapture++ % allFixtures.listings.length];
    snapshot.listings = [...snapshot.listings.filter(row => row.id !== listing.id), listing];
    return route.fulfill({ json: { success: true, snapshot, savedId: listing.id } });
  }
  if (pathname === '/api/market-analysis/export-pdf') {
    const report = validatePdfReport(route.request().postDataJSON().analysis);
    pdfInput = report;
    return route.fulfill({ contentType: 'application/pdf', body: await createMarketReportPdf(report) });
  }
  if (pathname === '/api/market-analysis/analyze') {
    requestBody = route.request().postDataJSON();
    const analysis = analyzeSelection(snapshot, requestBody.savedListingIds, requestBody.profile);
    const ai = await generateMarketNarrative(requestBody.model, analysis, async () => JSON.stringify({ decision: { status: 'Entrar com plano', title: 'Entrar com plano', summary: 'A amostra combina Full e Flex; valide o custo para oferecer uma entrega competitiva.' }, logistics: 'Os dois anúncios selecionados operam com entrega estruturada.', pricing: 'Compare a faixa observada com seus custos antes de escolher o preço de entrada.', actions: ['Semana 1', 'Semana 2', '30 dias', '60 dias'].map((period, index) => ({ period, title: 'Validar a operação', description: ['Compare custo e prazo com a amostra selecionada.', 'Valide custos e taxas antes de definir seu preço.', 'Acompanhe conversão e retorno dos anúncios testados.', 'Priorize pontualidade e atendimento para ganhar avaliações.'][index] })) }));
    return route.fulfill({ json: { success: true, analysis: { ...analysis, ai, report: ai.text } } });
  }
  return route.continue();
});
try {
  await page.goto('http://localhost:5180/market-analysis');
  await page.getByRole('heading', { name: 'Panorama AvantPro', exact: true }).waitFor();
  assert.equal(await page.getByRole('button', { name: 'Analisar anúncio', exact: true }).isDisabled(), true);
  await page.getByRole('button', { name: 'Capturar anúncio aberto', exact: true }).click();
  await page.getByRole('img', { name: 'Capa de Adaptador USB-C Full', exact: true }).waitFor();
  assert.equal(await page.getByRole('checkbox').count(), 1, 'Each capture must add exactly one offer');
  await page.getByRole('button', { name: 'Capturar anúncio aberto', exact: true }).click();
  await page.getByRole('img', { name: 'Sem foto de Adaptador USB-C Flex', exact: true }).waitFor();
  await page.getByRole('button', { name: 'Capturar anúncio aberto', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Selecionar Cabo USB-C', exact: true }).waitFor();
  const outputDir = process.env.MARKET_SMOKE_OUTPUT || '/tmp/browsermind-market-smoke';
  await mkdir(outputDir, { recursive: true });
  await page.screenshot({ path: `${outputDir}/ofertas-desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  assert.equal(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, 'Offers must fit a mobile viewport');
  await page.screenshot({ path: `${outputDir}/ofertas-mobile.png` });
  await page.setViewportSize({ width: 1440, height: 1100 });
  const fullRow = page.getByRole('listitem').filter({ has: page.getByRole('checkbox', { name: 'Selecionar Adaptador USB-C Full', exact: true }) });
  const fullAds = page.getByLabel('Ads de Adaptador USB-C Full', { exact: true });
  assert.equal(await fullAds.isVisible(), false);
  await fullRow.getByText('Detalhes da oferta', { exact: true }).click();
  await fullAds.selectOption('yes');
  await page.getByText('Informação de Ads salva.', { exact: true }).waitFor();
  await page.getByRole('checkbox', { name: 'Selecionar Adaptador USB-C Full', exact: true }).check();
  await page.getByRole('textbox', { name: 'Buscar anúncios' }).fill('Flex');
  await page.getByRole('button', { name: 'Selecionar visíveis', exact: true }).click();
  await page.getByText('2 ofertas selecionadas · 1 visível', { exact: true }).waitFor();
  const fullProfile = page.getByLabel('Opera com Full', { exact: true });
  assert.equal(await fullProfile.isVisible(), false);
  await page.getByText('Configurações opcionais', { exact: true }).click();
  await fullProfile.selectOption('no');
  await page.getByRole('button', { name: 'Comparar anúncios', exact: true }).click();
  const result = page.getByRole('region', { name: 'Resultado da análise' });
  await result.getByRole('heading', { name: 'Entrar com plano', exact: true }).waitFor();
  assert.equal(await result.getByRole('heading', { name: 'Análise pelo modelo de IA', exact: true }).count(), 0, 'Do not duplicate the model report');
  const firstAction = result.getByText('Semana 1', { exact: true });
  assert.equal(await firstAction.isVisible(), false);
  await result.getByText('Plano de ação', { exact: true }).click();
  await firstAction.waitFor();
  await result.getByText('Plano de ação', { exact: true }).click();
  await result.getByText('Ofertas analisadas (2)', { exact: true }).click();
  assert.equal(await result.getByRole('link', { name: /Adaptador USB-C/ }).count(), 2);
  assert.equal(await result.getByRole('link', { name: /Cabo USB-C/ }).count(), 0);
  await result.getByText('Ofertas analisadas (2)', { exact: true }).click();
  assert.equal(typeof requestBody.model, 'string');
  const adsCard = result.locator('dl > div').filter({ hasText: 'Concorrentes com ADS' });
  assert.match(await adsCard.innerText(), /1\/2/);
  assert.match(await adsCard.innerText(), /50% patrocinam/);
  assert.deepEqual(requestBody.savedListingIds.sort(), ['listing-0', 'listing-1']);
  assert.equal(await result.getByText('Ver fontes e cobertura dos dados').count(), 1);
  assert.match(await result.innerText(), /24,90/);
  assert.doesNotMatch(await result.innerText(), /999/);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar PDF', exact: true }).click();
  const download = await downloadPromise;
  assert.match(download.suggestedFilename(), /^panorama-avantpro-.*\.pdf$/);
  await page.getByText('Preparar outra análise', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Buscar anúncios' }).fill('');
  await page.getByText('Preparar outra análise', { exact: true }).click();
  await download.saveAs(`${outputDir}/relatorio.pdf`);
  assert.equal((await readFile(`${outputDir}/relatorio.pdf`)).subarray(0, 5).toString(), '%PDF-');
  await page.locator('main').evaluate(el => { el.scrollTop = 0; });
  await page.screenshot({ path: `${outputDir}/panorama-desktop.png`, fullPage: true });
  await result.getByRole('heading', { name: 'Entrar com plano', exact: true }).evaluate(el => el.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${outputDir}/panorama-result.png`, fullPage: true });
  await page.getByText('Preparar outra análise', { exact: true }).click();
  await page.getByLabel('Opera com Full', { exact: true }).selectOption('yes');
  assert.equal(await result.count(), 0, 'Changed profile must invalidate the displayed result');
  await page.reload();
  await page.getByRole('checkbox', { name: 'Selecionar Adaptador USB-C Full', exact: true }).waitFor();
  assert.equal(await page.getByRole('checkbox').count(), 3, 'Saved offers must reload');
  await fullRow.getByText('Detalhes da oferta', { exact: true }).click();
  assert.equal(await fullAds.inputValue(), 'yes');
  await fullRow.getByText('Detalhes da oferta', { exact: true }).click();
  await page.getByRole('button', { name: 'Histórico (1)', exact: true }).click();
  await page.getByRole('button', { name: /Adaptadores USB-C · fixture/ }).click();
  await result.getByRole('heading', { name: 'Entrar com plano', exact: true }).waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await result.getByRole('heading', { name: 'Entrar com plano', exact: true }).evaluate(el => el.scrollIntoView({ block: 'start' }));
  await page.screenshot({ path: `${outputDir}/panorama-mobile.png`, fullPage: true });
  assert.equal(await page.locator('main').evaluate(el => el.scrollWidth <= el.clientWidth + 1), true, 'Main page must not overflow horizontally');
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.getByText('Preparar outra análise', { exact: true }).click();
  captureFails = true;
  await page.getByRole('button', { name: 'Capturar anúncio aberto', exact: true }).click();
  await page.getByRole('alert').filter({ hasText: 'Inicie o Browser para capturar.' }).waitFor();
  const cableRow = page.getByRole('listitem').filter({ has: page.getByRole('checkbox', { name: 'Selecionar Cabo USB-C', exact: true }) });
  await cableRow.getByText('Detalhes da oferta', { exact: true }).click();
  await page.getByRole('button', { name: 'Excluir Cabo USB-C da lista', exact: true }).click();
  await page.getByRole('checkbox', { name: 'Selecionar Cabo USB-C', exact: true }).waitFor({ state: 'hidden' });
  await page.getByRole('textbox', { name: 'Buscar anúncios' }).fill('Flex');
  await page.getByRole('button', { name: 'Selecionar todos', exact: true }).click();
  await page.getByText('2 ofertas selecionadas · 1 visível', { exact: true }).waitFor();
  const removeSelected = page.getByRole('button', { name: 'Excluir selecionados', exact: true });
  page.once('dialog', dialog => dialog.dismiss());
  await removeSelected.click();
  assert.equal(snapshot.listings.length, 2);
  page.once('dialog', async dialog => {
    assert.match(dialog.message(), /Excluir 2 anúncios selecionados/);
    await dialog.accept();
  });
  await removeSelected.click();
  await page.getByText('2 anúncios excluídos da lista de seleção.', { exact: true }).waitFor();
  assert.equal(snapshot.listings.length, 0);
  assert.equal(await removeSelected.count(), 0);
  assert.deepEqual(errors, []);
  const longReport = { ...pdfInput, ai: { ...pdfInput.ai, sections: { ...pdfInput.ai.sections,
    decision: { ...pdfInput.ai.sections.decision, title: 'Avaliar logística e precificação antes de ampliar a operação com os anúncios selecionados', summary: 'Valide a demanda observada e sua capacidade operacional antes de investir. '.repeat(9).slice(0, 650) },
    logistics: 'Compare custo e prazo de entrega com os concorrentes selecionados. '.repeat(6).slice(0, 350),
    pricing: 'A faixa observada orienta a comparação; calcule custo, comissão, impostos e frete para definir um preço viável. '.repeat(5).slice(0, 450),
    actions: pdfInput.ai.sections.actions.map(action => ({ ...action, description: 'Faça um teste controlado com orçamento definido e acompanhe conversão, margem e pontualidade antes de aumentar o investimento. '.repeat(2).slice(0, 250) })),
  } } };
  await writeFile(`${outputDir}/relatorio-longo.pdf`, await createMarketReportPdf(validatePdfReport(longReport)));
  console.log('PASS: compact offers, optional settings, selected-only comparison, export, history, mobile, bulk removal.');
  console.log(`Screenshots: ${outputDir}`);
} finally { await browser.close(); }
