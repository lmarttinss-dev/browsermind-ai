import { describe, it, expect } from "vitest"
import {
  trunc2,
  calcImport,
  calcSales,
  calcInvestment,
  COURIER_RATE,
  type ProductInput,
  type SalesInput,
} from "@/lib/calculator"

// -----------------------------------------------------------------------
// trunc2
// -----------------------------------------------------------------------
describe("trunc2", () => {
  it("deve truncar para 2 casas decimais", () => {
    expect(trunc2(814.2650602409639)).toBe(814.26)
  })

  it("deve manter valor já com 2 casas", () => {
    expect(trunc2(422.40)).toBe(422.40)
  })

  it("deve corrigir erro de ponto flutuante (422.39999999999997)", () => {
    // Simula o erro comum 82.50 * 5.12 em JS
    const resultado = 82.5 * 5.12
    expect(trunc2(resultado)).toBe(422.40)
  })

  it("deve funcionar com número inteiro", () => {
    expect(trunc2(100)).toBe(100)
  })

  it("deve funcionar com zero", () => {
    expect(trunc2(0)).toBe(0)
  })
})

// -----------------------------------------------------------------------
// calcImport — Etapa 1
// -----------------------------------------------------------------------
describe("calcImport (Etapa 1)", () => {
  const produto: ProductInput = {
    name: "Produto Teste",
    importTax: 60,
    quantity: 1,
    unitPriceDollar: 82.50,
    shippingDollar: 0,
    icms: 17,
  }

  it("deve calcular corretamente com os valores do app de referência (dólar 5.12)", () => {
    const r = calcImport(produto, 5.12)

    expect(r.customsValueUSD).toBe(82.50)
    expect(r.customsValueBRL).toBe(422.40)
    expect(r.importTaxValue).toBe(253.44)
    expect(r.courierFee).toBe(96.26)
    expect(r.icmsBase).toBeCloseTo(814.26506, 4)
    expect(r.icmsValue).toBeCloseTo(138.42506, 4)
    expect(r.totalImport).toBe(910.52)
    expect(r.unitCost).toBe(910.52)
  })

  it("deve exibir ICMS arredondado para 138.43 com toLocaleString", () => {
    const r = calcImport(produto, 5.12)
    const exibido = r.icmsValue.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    expect(exibido).toBe("138,43")
  })

  it("deve exibir total como 910,52 com toLocaleString", () => {
    const r = calcImport(produto, 5.12)
    const exibido = r.totalImport.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    expect(exibido).toBe("910,52")
  })

  it("deve calcular com múltiplas unidades", () => {
    const r = calcImport({ ...produto, quantity: 50, unitPriceDollar: 1.65 }, 5.12)

    // customsValueUSD = 50 * 1.65 + 0 = 82.50
    expect(r.customsValueUSD).toBe(82.50)
    expect(r.customsValueBRL).toBe(422.40)
    // Custo unitário = totalImport / 50
    expect(r.unitCost).toBeCloseTo(18.21, 2)
  })

  it("deve retornar unitCost 0 quando quantity é 0", () => {
    const r = calcImport({ ...produto, quantity: 0 }, 5.12)
    expect(r.unitCost).toBe(0)
  })

  it("deve considerar frete em dólar", () => {
    const r = calcImport({ ...produto, shippingDollar: 15.0 }, 5.12)
    // customsValueUSD = 82.50 + 15.0 = 97.50
    expect(r.customsValueUSD).toBe(97.50)
    expect(r.customsValueBRL).toBe(499.20) // 97.50 * 5.12
  })

  it("deve aceitar taxa courier personalizada", () => {
    const r = calcImport(produto, 5.12, 0.162) // taxa antiga de 16.2%
    expect(r.courierFee).toBe(68.42) // trunc2(422.40 * 0.162)
    expect(r.totalImport).toBe(882.68)
  })

  it("deve funcionar com dollarRate = 5.00 (valor redondo)", () => {
    const r = calcImport(produto, 5.0)
    expect(r.customsValueBRL).toBe(412.50)
    expect(r.importTaxValue).toBe(247.50)
    expect(r.courierFee).toBe(94) // trunc2(412.50 * 0.2279)
  })

  it("deve funcionar com valores zerados", () => {
    const r = calcImport(
      { name: "", importTax: 0, quantity: 0, unitPriceDollar: 0, shippingDollar: 0, icms: 0 },
      5.12,
    )
    expect(r.customsValueUSD).toBe(0)
    expect(r.customsValueBRL).toBe(0)
    expect(r.totalImport).toBe(0)
    expect(r.unitCost).toBe(0)
  })

  it("deve recalcular corretamente quando dollarRate muda", () => {
    const r1 = calcImport(produto, 5.00)
    const r2 = calcImport(produto, 6.00)
    // Com dólar mais alto, customsValueBRL deve ser maior
    expect(r2.customsValueBRL).toBeGreaterThan(r1.customsValueBRL)
    expect(r2.totalImport).toBeGreaterThan(r1.totalImport)
  })
})

// -----------------------------------------------------------------------
// calcSales — Etapa 2
// -----------------------------------------------------------------------
describe("calcSales (Etapa 2)", () => {
  const sales: SalesInput = {
    isKit: false,
    salesTax: 4,
    salePrice: 150,
    shippingFee: 9,
    adFee: 11,
    packagingCost: 5,
  }

  it("deve calcular corretamente os valores de venda", () => {
    const r = calcSales(sales, 910.52)

    expect(r.productCost).toBe(910.52)
    expect(r.salesTaxValue).toBe(6) // 150 * 4%
    expect(r.adFeeValue).toBe(16.50) // 150 * 11%
    expect(r.totalExpenses).toBe(910.52 + 6 + 16.50 + 9 + 5) // = 947.02
    expect(r.profitPerUnit).toBeCloseTo(150 - 947.02, 2) // = -797.02
    expect(r.contributionMargin).toBeCloseTo((-797.02 / 150) * 100, 2)
    expect(r.roi).toBeCloseTo((-797.02 / 910.52) * 100, 2)
  })

  it("deve retornar contributionMargin 0 quando salePrice é 0", () => {
    const r = calcSales({ ...sales, salePrice: 0 }, 100)
    expect(r.contributionMargin).toBe(0)
  })

  it("deve retornar roi 0 quando productCost é 0", () => {
    const r = calcSales(sales, 0)
    expect(r.roi).toBe(0)
  })

  it("deve calcular margem positiva quando preço cobre os custos", () => {
    const r = calcSales({ ...sales, salePrice: 2000 }, 500)
    expect(r.profitPerUnit).toBeGreaterThan(0)
    expect(r.contributionMargin).toBeGreaterThan(0)
    expect(r.roi).toBeGreaterThan(0)
  })

  it("deve calcular prejuízo quando preço não cobre os custos", () => {
    const r = calcSales(sales, 910.52)
    expect(r.profitPerUnit).toBeLessThan(0)
    expect(r.contributionMargin).toBeLessThan(0)
    expect(r.roi).toBeLessThan(0)
  })
})

// -----------------------------------------------------------------------
// calcInvestment — Etapa 3
// -----------------------------------------------------------------------
describe("calcInvestment (Etapa 3 — Montinho ao Montão)", () => {
  it("deve calcular o Montão igual ao app de referência", () => {
    // Mesmo cenário: totalImport = 910.52, salePrice = 150, quantity = 1
    const r = calcInvestment(910.52, 910.52, 150, 1, 947.02)

    expect(r.totalInvestment).toBe(910.52)
    expect(r.totalRevenue).toBe(150)
    // totalCosts = 947.02 * 1 - 910.52 * 1 = 36.50
    expect(r.totalCosts).toBeCloseTo(36.50, 2)
    // totalReturn = 150 - 36.50 = 113.50
    expect(r.totalReturn).toBeCloseTo(113.50, 2)
    // multiplier = (113.50 - 910.52) / 910.52 = -0.875...
    expect(r.multiplier).toBeCloseTo(-0.8754, 3)
  })

  it("deve calcular retorno positivo quando venda supera todos os custos", () => {
    const r = calcInvestment(500, 10, 100, 100, 15)

    expect(r.totalInvestment).toBe(500)
    expect(r.totalRevenue).toBe(10000)
    // totalCosts = 15 * 100 - 10 * 100 = 500
    expect(r.totalCosts).toBe(500)
    // totalReturn = 10000 - 500 = 9500
    expect(r.totalReturn).toBe(9500)
    // multiplier = (9500 - 500) / 500 = 18
    expect(r.multiplier).toBe(18)
  })

  it("deve retornar multiplier 0 quando totalInvestment é 0", () => {
    const r = calcInvestment(0, 0, 100, 10, 0)
    expect(r.multiplier).toBe(0)
  })
})

// -----------------------------------------------------------------------
// Pipeline completo (Etapa 1 + 2 + 3)
// -----------------------------------------------------------------------
describe("Pipeline completo", () => {
  const produto: ProductInput = {
    name: "Camiseta",
    importTax: 60,
    quantity: 50,
    unitPriceDollar: 1.65,
    shippingDollar: 0,
    icms: 17,
  }

  const sales: SalesInput = {
    isKit: false,
    salesTax: 4,
    salePrice: 39.90,
    shippingFee: 9,
    adFee: 11,
    packagingCost: 2.50,
  }

  it("deve executar as 3 etapas sem erro e produzir valores consistentes", () => {
    const importResult = calcImport(produto, 5.12)
    const salesResult = calcSales(sales, importResult.unitCost)
    const investResult = calcInvestment(
      importResult.totalImport,
      importResult.unitCost,
      sales.salePrice,
      produto.quantity,
      salesResult.totalExpenses,
    )

    // Etapa 1
    expect(importResult.customsValueUSD).toBe(82.50)
    expect(importResult.totalImport).toBeGreaterThan(0)

    // Etapa 2
    expect(salesResult.productCost).toBe(importResult.unitCost)
    expect(salesResult.totalExpenses).toBeGreaterThan(0)

    // Etapa 3
    expect(investResult.totalInvestment).toBe(importResult.totalImport)
    expect(investResult.totalRevenue).toBe(sales.salePrice * produto.quantity)
  })
})
