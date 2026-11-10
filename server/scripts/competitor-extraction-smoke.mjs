// Run from server: node --import tsx scripts/competitor-extraction-smoke.mjs
// Uses the production tsx loader: Vitest alone does not reproduce esbuild's __name helper.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { extractIndividualListing, parseAvantproFields } from '../src/individual-listing.ts';
import { extractCompetitorListings } from '../src/competitor-listings.ts';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
try {
  const page = await browser.newPage();
  await page.setContent('<li class="ui-search-layout__item"><a class="poly-component__title" href="https://produto.mercadolivre.com.br/MLB-123-_JM">Adaptador</a><div class="avantpro-product-container">Vendedor<br>LOJA_A</div><div id="host"></div></li>');
  await page.evaluate(() => {
    const shadow = document.querySelector('#host').attachShadow({ mode: 'open' });
    shadow.innerHTML = '<div data-avantpro>Vendas (30 dias)<br>42</div><div id="nested"></div>';
    shadow.querySelector('#nested').attachShadow({ mode: 'open' }).innerHTML = '<div data-avantpro>Estoque: 15</div>';
  });
  assert.doesNotMatch(extractCompetitorListings.toString(), /\b__name\b/, 'Serialized function must not reference tsx runtime helpers');
  const rows = await page.evaluate(extractCompetitorListings);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].seller, 'LOJA_A');
  assert.match(rows[0].metrics, /42/);
  assert.match(rows[0].metrics, /Estoque: 15/);
  await page.route('**/*', route => route.fulfill({ contentType: 'text/html; charset=utf-8', body: '<h1 class="ui-pdp-title">Produto individual</h1><div class="avantpro-panel">Vendas estimadas<br>9<br>Ritmo atual (vendas/mês)<br>7<br>Vendas mensais<br>2/Mês</div>' }));
  await page.goto('https://produto.mercadolivre.com.br/MLB-123-_JM');
  const individual = await page.evaluate(extractIndividualListing);
  assert.equal(individual.itemId, 'MLB123');
  assert.equal(parseAvantproFields(individual.metrics).find(field => field.label === 'Ritmo atual (vendas/mês)').value, '7');
  console.log('PASS: production tsx loader serializes extraction correctly, including nested shadow DOM.');
} finally { await browser.close(); }
