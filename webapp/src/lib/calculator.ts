/**
 * Módulo de cálculo da Calculadora de Importação
 *
 * Todas as funções são puras (sem estado, sem efeitos colaterais)
 * para permitir testes unitários isolados.
 */

// ---------------------------------------------------------------------------
// Constantes
// ---------------------------------------------------------------------------

/** Taxa courier DHL (~22,79% sobre o valor aduaneiro BRL) */
export const COURIER_RATE = 0.2279

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ProductInput = {
  name: string
  importTax: number
  quantity: number
  unitPriceDollar: number
  shippingDollar: number
  icms: number
}

export type SalesInput = {
  isKit: boolean
  salesTax: number
  salePrice: number
  shippingFee: number
  adFee: number
  packagingCost: number
}

export type ImportCalcResult = {
  customsValueUSD: number
  customsValueBRL: number
  importTaxValue: number
  icmsBase: number
  icmsValue: number
  courierFee: number
  totalImport: number
  unitCost: number
}

export type SalesCalcResult = {
  productCost: number
  salesTaxValue: number
  adFeeValue: number
  totalExpenses: number
  profitPerUnit: number
  contributionMargin: number
  roi: number
}

export type InvestmentCalcResult = {
  totalInvestment: number
  totalRevenue: number
  totalCosts: number
  totalReturn: number
  multiplier: number
}

// ---------------------------------------------------------------------------
// Utilitários
// ---------------------------------------------------------------------------

/**
 * Trunca um número para 2 casas decimais (igual ao app de referência).
 * Usa um epsilon (1e-6) para evitar erro de ponto flutuante,
 * ex: 422.39999999999997 → 422.40 em vez de 422.39.
 */
export const trunc2 = (n: number): number =>
  Math.floor(n * 100 + 1e-6) / 100

// ---------------------------------------------------------------------------
// Etapa 1 — Cálculos de importação
// ---------------------------------------------------------------------------

/**
 * @param product  Dados do produto (quantidade, preço, impostos…)
 * @param dollarRate  Cotação do dólar (taxa de venda / ask)
 * @param courierRate  Taxa do courier DHL (padrão: COURIER_RATE)
 */
export function calcImport(
  product: ProductInput,
  dollarRate: number,
  courierRate = COURIER_RATE,
): ImportCalcResult {
  const customsValueUSD =
    product.quantity * product.unitPriceDollar + product.shippingDollar

  const customsValueBRL = trunc2(customsValueUSD * dollarRate)
  const importTaxValue = trunc2(customsValueBRL * (product.importTax / 100))
  const courierFee = trunc2(customsValueBRL * courierRate)

  // ICMS "por dentro": a alíquota incide sobre a base que já inclui o próprio ICMS
  // Base: valor aduaneiro + imp. importação (courier não entra na base)
  // icmsBase e icmsValue NÃO são truncados — o arredondamento fica por conta do toLocaleString na exibição
  const icmsBase =
    (customsValueBRL + importTaxValue) / (1 - product.icms / 100)
  const icmsValue = icmsBase * (product.icms / 100)

  const totalImport = trunc2(
    customsValueBRL + importTaxValue + icmsValue + courierFee,
  )
  const unitCost =
    product.quantity > 0 ? trunc2(totalImport / product.quantity) : 0

  return {
    customsValueUSD,
    customsValueBRL,
    importTaxValue,
    icmsBase,
    icmsValue,
    courierFee,
    totalImport,
    unitCost,
  }
}

// ---------------------------------------------------------------------------
// Etapa 2 — Cálculos de viabilidade de venda
// ---------------------------------------------------------------------------

export function calcSales(
  sales: SalesInput,
  unitCost: number,
): SalesCalcResult {
  const productCost = unitCost
  const salesTaxValue = sales.salePrice * (sales.salesTax / 100)
  const adFeeValue = sales.salePrice * (sales.adFee / 100)
  const totalExpenses =
    salesTaxValue + adFeeValue + sales.shippingFee + sales.packagingCost + productCost
  const profitPerUnit = sales.salePrice - totalExpenses
  const contributionMargin =
    sales.salePrice > 0 ? (profitPerUnit / sales.salePrice) * 100 : 0
  const roi = productCost > 0 ? (profitPerUnit / productCost) * 100 : 0

  return {
    productCost,
    salesTaxValue,
    adFeeValue,
    totalExpenses,
    profitPerUnit,
    contributionMargin,
    roi,
  }
}

// ---------------------------------------------------------------------------
// Etapa 3 — Montinho ao Montão
// ---------------------------------------------------------------------------

export function calcInvestment(
  totalImport: number,
  unitCost: number,
  salePrice: number,
  quantity: number,
  totalExpenses: number,
): InvestmentCalcResult {
  const totalInvestment = totalImport
  const totalRevenue = salePrice * quantity
  const totalCosts = totalExpenses * quantity - unitCost * quantity
  const totalReturn = totalRevenue - totalCosts
  const multiplier =
    totalInvestment > 0 ? (totalReturn - totalInvestment) / totalInvestment : 0

  return {
    totalInvestment,
    totalRevenue,
    totalCosts,
    totalReturn,
    multiplier,
  }
}
