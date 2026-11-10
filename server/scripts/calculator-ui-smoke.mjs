// With the webapp running on port 5180: node scripts/calculator-ui-smoke.mjs
// Business API requests are mocked; no user data is changed.
import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1050 } });
const errors = [];
page.on('pageerror', error => errors.push(error.message));
let rateRequests = 0;
let currentRate = 9;
let failRate = false;
let failSave = true;
let lastSave;
const state = {
  version: 1, dollarRate: 5.35, productMode: 'multiple',
  product: { name: 'Adaptador USB salvo', importTax: 60, quantity: 100, unitPriceDollar: 0.3, shippingDollar: 79.48, icms: 17 },
  sales: { isKit: true, salesTax: 7, salePrice: 34.9, shippingFee: 6.95, adFee: 13, packagingCost: 0.5 },
  isKit: true, kitQuantity: 3,
  source: { supplierIndex: 0, quoteIndex: 0, supplierName: 'Fornecedor salvo' },
  savedAt: '2026-10-28T03:00:00Z',
};
const product = {
  _id: '507f1f77bcf86cd799439011', title: 'Adaptador USB', url: 'https://example.com/product',
  price: 99, imageUrl: '', category: '', categoryId: null, stage: 'triagem', score: 7,
  monthlySales: 100, competitionLevel: 'Baixa', potentialMargin: '20%',
  analysisReport: '# Análise', analyzedAt: '2026-10-28T03:00:00Z', order: 0,
  suppliers: [{ name: 'Fornecedor atual', quotes: [{ unitPrice: '0.9', moq: '250', totalShippingCost: '55', quotedAt: '2026-10-28' }] }],
  supplierReport: '', marketReport: '', isKit: false, kitItems: [],
  calculatorState: state,
};
await page.route('**/*', async route => {
  const url = new URL(route.request().url());
  if (url.hostname === 'economia.awesomeapi.com.br') {
    rateRequests++;
    if (failRate) return route.abort();
    return route.fulfill({ json: { USDBRL: { ask: String(currentRate) } } });
  }
  if (url.pathname.startsWith('/api/')) {
    if (url.pathname.endsWith('/calculator') && route.request().method() === 'PATCH') {
      if (failSave) {
        failSave = false;
        return route.fulfill({ status: 500, json: { error: 'Falha simulada ao salvar' } });
      }
      lastSave = route.request().postDataJSON();
      product.calculatorState = { ...lastSave.calculatorState, savedAt: new Date().toISOString() };
    }
    if (url.pathname === '/api/categories') return route.fulfill({ json: { success: true, categories: [] } });
    if (url.pathname === '/api/pipeline') return route.fulfill({ json: { success: true, products: { triagem: [product], analise: [], aprovado: [], importando: [], concluido: [] } } });
    return route.fulfill({ json: { success: true, product } });
  }
  if (url.pathname === '/status') return route.fulfill({ json: { active: false } });
  if (url.pathname === '/health') return route.fulfill({ json: { status: 'ok' } });
  return route.continue();
});
try {
  await page.goto(`http://localhost:5180/pipeline/${product._id}`);
  await page.getByRole('link', { name: 'Abrir cálculo salvo' }).click();
  await page.getByText('HOJE', { exact: true }).waitFor();
  const values = await page.locator('input').evaluateAll(inputs => inputs.map(input => input.value));
  for (const value of ['9', 'Adaptador USB salvo', '60', '100', '0.3', '79.48', '17', '7', '3', '34.9', '6.95', '13', '0.5']) {
    assert(values.includes(value), `Missing restored input: ${value}`);
  }
  assert.equal(rateRequests, 1, 'Saved calculations must fetch the current exchange rate');
  assert.match(await page.getByRole('button', { name: 'Vários', exact: true }).getAttribute('class'), /bg-orange-500/);
  assert.match(await page.getByRole('button', { name: 'Sim', exact: true }).getAttribute('class'), /bg-emerald-500/);
  await page.locator('input[value="100"]').fill('120');
  const save = page.getByRole('button', { name: 'Salvar cálculo no produto', exact: true }).first();
  await save.click();
  await page.getByRole('alert').filter({ hasText: 'Falha simulada ao salvar' }).waitFor();
  await save.click();
  await page.getByText('Cálculo completo salvo no produto!', { exact: true }).waitFor();
  assert.equal(lastSave.calculatorState.product.quantity, 120);
  assert.equal(lastSave.calculatorState.kitQuantity, 3);
  assert.equal(lastSave.calculatorState.dollarRate, 9);
  assert.deepEqual(lastSave.calculatorState.source, state.source);
  await page.getByRole('button', { name: 'Continuar Calculando', exact: true }).click();
  await save.waitFor();
  await page.getByRole('button', { name: 'Ver na esteira →', exact: true }).click();
  await page.getByRole('link', { name: 'Abrir cálculo salvo' }).click();
  await page.getByText('HOJE', { exact: true }).waitFor();
  assert.equal(await page.locator('input[value="120"]').count(), 1);
  assert.equal(rateRequests, 2);
  currentRate = 6.2;
  await page.reload();
  await page.getByText('HOJE', { exact: true }).waitFor();
  assert.equal(await page.locator('input[value="120"]').count(), 1);
  assert.equal(await page.locator('input[value="6.2"]').count(), 1);
  assert.equal(rateRequests, 3);

  currentRate = 9;
  // Choosing a new quote explicitly must still prefill from that quote.
  await page.goto(`http://localhost:5180/calculator?productId=${product._id}&supplier=0&quote=0`);
  await page.getByText('HOJE', { exact: true }).waitFor();
  assert.equal(await page.locator('input[value="250"]').count(), 1);
  assert.equal(await page.locator('input[value="0.9"]').count(), 1);
  assert.equal(await page.locator('input[value="9"]').count() >= 1, true);
  assert.equal(rateRequests, 4);

  await page.goto('http://localhost:5180/pipeline');
  await page.getByRole('link', { name: 'Abrir cálculo salvo' }).click();
  await page.getByText('HOJE', { exact: true }).waitFor();
  assert.equal(await page.locator('input[value="120"]').count(), 1);
  assert.equal(rateRequests, 5);

  // A rate-service failure still leaves the saved simulation usable.
  failRate = true;
  await page.reload();
  await page.getByText('SALVO', { exact: true }).waitFor();
  assert.equal(await page.locator('input[value="9"]').count() >= 1, true);
  assert.equal(await page.locator('input[value="120"]').count(), 1);
  assert.equal(rateRequests, 6);
  // Reproduce the workbook's scenarios using the national purchase cost.
  await page.locator('label[for="purchase-currency-BRL"]').click();
  await page.getByRole('button', { name: 'Não', exact: true }).click();
  await page.getByLabel('Preço unitário (em reais)', { exact: true }).fill('27.05');
  await page.getByLabel('Preço de venda (R$)', { exact: true }).fill('47.90');
  await page.getByLabel('Comissão do Mercado Livre (%)', { exact: true }).fill('0.13');
  await page.getByLabel('Frete pago pelo vendedor (R$)', { exact: true }).fill('0');
  await page.getByLabel('Custo de embalagem (R$)', { exact: true }).fill('0');
  await page.getByLabel('Custo do envio Mercado Livre (manual) (R$)', { exact: true }).fill('12.95');
  await page.getByText('R$ 4,48', { exact: true }).waitFor();
  await page.getByText('9,4%', { exact: true }).waitFor();

  const marginMode = page.getByRole('button', { name: 'Por margem desejada', exact: true });
  await marginMode.click();
  await page.getByText('R$ 45,53', { exact: true }).waitFor();
  const marginField = page.getByLabel('Margem de lucro desejada (%)', { exact: true });
  await marginField.fill('93');
  await page.getByText('A soma da comissão, do imposto e da margem desejada deve ser menor que 100%.').waitFor();
  assert(await save.isDisabled());
  await marginField.fill('5');
  await page.getByLabel('Outros custos por venda (R$)', { exact: true }).fill('2');
  await page.getByText('R$ 47,80', { exact: true }).waitFor();
  await save.click();
  await page.getByText('Cálculo completo salvo no produto!', { exact: true }).waitFor();
  assert.equal(lastSave.salePrice, 47.80);
  assert.equal(lastSave.calculatorState.sales.salePrice, 47.90);
  await page.reload();
  await page.getByText('R$ 47,80', { exact: true }).waitFor();
  assert.equal(await marginMode.getAttribute('aria-pressed'), 'true');
  assert.equal(await marginField.inputValue(), '5');
  assert.equal(await page.getByLabel('Outros custos por venda (R$)', { exact: true }).inputValue(), '2');
  await page.getByRole('button', { name: 'Por preço de venda', exact: true }).click();
  assert.equal(await page.getByLabel('Preço de venda (R$)', { exact: true }).inputValue(), '47.9');

  assert.deepEqual(errors, []);
  console.log('PASS: saved links in detail/card, all inputs, kit/mode/source, current rate on reopen/reload, saved-rate fallback, error retry, save/edit/reload, new quote, and both Mercado Livre pricing modes');
} finally {
  await browser.close();
}
