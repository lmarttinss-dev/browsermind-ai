import { describe, it, expect } from "vitest"
import { parseSuppliersFromReport } from "../parse-suppliers.js"

describe("parseSuppliersFromReport", () => {
  it("deve parsear relatório com formato emoji + ordinal", () => {
    const report = `## 🏆 Top 3 Fornecedores

### 🥇 1º — Shenzhen ABC Electronics

- **Link do produto:** https://www.alibaba.com/product-detail/ABC-TWS-Earbuds_123456789.html
- **Preço indicado:** US$ 3.50 - 5.00
- **MOQ (pedido mínimo):** 100 unidades
- **Rating:** 4.8/5 ⭐
- **Trade Assurance:** Sim (US$ 50.000)
- **Anos de operação:** 7
- **Taxa de resposta:** 95%
- **Capacidades:** OEM / ODM
- **Certificações:** ISO 9001, CE, FCC

### 🥈 2º — Dongguan XYZ Tech

- **Link do produto:** https://www.alibaba.com/product-detail/XYZ-Bluetooth_987654321.html?spm=abc123
- **Preço indicado:** US$ 4.20 - 6.50
- **MOQ (pedido mínimo):** 50 unidades
- **Rating:** 4.7/5 ⭐
- **Trade Assurance:** Sim
- **Anos de operação:** 5
- **Taxa de resposta:** 92%
- **Capacidades:** ODM
- **Certificações:** CE, ROHS

### 🥉 3º — Guangzhou LMN Audio

- **Link do produto:** //www.alibaba.com/product-detail/LMN-Sport-Earphone_555666777.html
- **Preço indicado:** US$ 2.80 - 4.00
- **MOQ (pedido mínimo):** 200 unidades
- **Rating:** 4.6/5 ⭐
- **Trade Assurance:** Sim
- **Anos de operação:** 4
- **Taxa de resposta:** 88%
- **Capacidades:** OEM / ODM / Customização
- **Certificações:** ISO 14001, CE`

    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(3)

    // Primeiro fornecedor
    expect(result[0].name).toBe("Shenzhen ABC Electronics")
    expect(result[0].url).toBe("https://www.alibaba.com/product-detail/ABC-TWS-Earbuds_123456789.html")
    expect(result[0].unitPrice).toBe("US$ 3.50 - 5.00")
    expect(result[0].moq).toBe("100 unidades")
    expect(result[0].rating).toBe(4.8)
    expect(result[0].tradeAssurance).toBe(true)
    expect(result[0].yearsInBusiness).toBe(7)
    expect(result[0].responseRate).toBe("95%")
    expect(result[0].capabilities).toBe("OEM / ODM")
    expect(result[0].certifications).toBe("ISO 9001, CE, FCC")

    // Segundo fornecedor — URL com query params deve ser limpa
    expect(result[1].name).toBe("Dongguan XYZ Tech")
    expect(result[1].url).toBe("https://www.alibaba.com/product-detail/XYZ-Bluetooth_987654321.html")
    expect(result[1].rating).toBe(4.7)

    // Terceiro fornecedor — URL protocol-relative deve ganhar https:
    expect(result[2].name).toBe("Guangzhou LMN Audio")
    expect(result[2].url).toBe("https://www.alibaba.com/product-detail/LMN-Sport-Earphone_555666777.html")
    expect(result[2].yearsInBusiness).toBe(4)
  })

  it("deve parsear links em formato markdown [text](url)", () => {
    const report = `### 🥇 1º — Supplier With Markdown Link

- **Link do produto:** [Ver produto](https://www.alibaba.com/product-detail/Product-Name_111222333.html)
- **Preço indicado:** US$ 5.00
- **MOQ (pedido mínimo):** 100
- **Rating:** 4.5/5
- **Trade Assurance:** Sim
- **Anos de operação:** 3
- **Taxa de resposta:** 80%
- **Capacidades:** OEM
- **Certificações:** CE`

    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe("https://www.alibaba.com/product-detail/Product-Name_111222333.html")
  })

  it("deve parsear links em formato markdown com protocol-relative", () => {
    const report = `### 🥇 1º — Supplier Protocol Relative

- **Link do produto:** [Alibaba](//www.alibaba.com/product-detail/Item_444555666.html?spm=xxx&priceId=yyy)
- **Preço indicado:** US$ 3.00
- **MOQ (pedido mínimo):** 50
- **Rating:** 4.9/5
- **Trade Assurance:** Sim
- **Anos de operação:** 10
- **Taxa de resposta:** 98%
- **Capacidades:** OEM / ODM
- **Certificações:** ISO 9001`

    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(1)
    expect(result[0].url).toBe("https://www.alibaba.com/product-detail/Item_444555666.html")
  })

  it("deve parsear quando heading usa apenas ordinal sem emoji", () => {
    const report = `### 1º — First Supplier

- **Link do produto:** https://www.alibaba.com/product-detail/First_111.html
- **Rating:** 4.5/5
- **Trade Assurance:** Sim
- **Anos de operação:** 3

### 2º — Second Supplier

- **Link do produto:** https://www.alibaba.com/product-detail/Second_222.html
- **Rating:** 4.6/5
- **Trade Assurance:** Sim
- **Anos de operação:** 5`

    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(2)
    expect(result[0].name).toBe("First Supplier")
    expect(result[0].url).toBe("https://www.alibaba.com/product-detail/First_111.html")
    expect(result[1].name).toBe("Second Supplier")
    expect(result[1].url).toBe("https://www.alibaba.com/product-detail/Second_222.html")
  })

  it("deve retornar URL vazia quando não há link na seção", () => {
    const report = `### 🥇 1º — No Link Supplier

- **Preço indicado:** US$ 2.00
- **Rating:** 4.0/5
- **Trade Assurance:** Sim
- **Anos de operação:** 2`

    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("No Link Supplier")
    expect(result[0].url).toBe("")
  })

  it("deve parsear quando o link está em formato <a href>", () => {
    const report = `### 🥇 1º — HTML Link Supplier

- **Link do produto:** <a href="//www.alibaba.com/product-detail/HTML-Item_999.html?spm=abc">Ver</a>
- **Preço indicado:** US$ 4.00
- **Rating:** 4.7/5
- **Trade Assurance:** Sim
- **Anos de operação:** 6`

    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(1)
    // Deve capturar da tag href
    expect(result[0].url).toContain("alibaba.com/product-detail/HTML-Item_999.html")
  })

  it("deve retornar array vazio para relatório sem fornecedores", () => {
    const report = `## Resumo da Busca\n\nNenhum fornecedor encontrado.`
    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(0)
  })

  it("não deve incluir capturedAt no resultado", () => {
    const report = `### 🥇 1º — Test Supplier

- **Link do produto:** https://www.alibaba.com/product-detail/Test_123.html
- **Rating:** 4.5/5`

    const result = parseSuppliersFromReport(report)
    expect(result[0]).not.toHaveProperty("capturedAt")
  })

  it("deve limpar markdown link do nome do fornecedor", () => {
    const report = `### 🥇 1º — [Shenzhen Chengdaxin Technology Co., Ltd.](https://chengdaxin.en.alibaba.com/company_profile.html)

- **Link do produto:** https://www.alibaba.com/product-detail/Item_123.html
- **Rating:** 4.8/5
- **Trade Assurance:** Sim
- **Anos de operação:** 8`

    const result = parseSuppliersFromReport(report)
    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Shenzhen Chengdaxin Technology Co., Ltd.")
    expect(result[0].url).toBe("https://www.alibaba.com/product-detail/Item_123.html")
  })
})
