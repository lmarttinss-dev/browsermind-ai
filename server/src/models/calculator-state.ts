import { Schema, type InferSchemaType } from "mongoose"

const number = (min = 0, max = Infinity) => ({
  type: Number, required: true, min, max,
  validate: { validator: Number.isFinite, message: "Valor numérico inválido" },
})

export const calculatorStateSchema = new Schema({
  version: { type: Number, required: true, enum: [1] },
  currency: { type: String, enum: ["USD", "BRL"] },
  domesticPurchase: { type: new Schema({
    unitPrice: number(), shippingCost: number(),
  }, { _id: false }), required: function () { return this.currency === "BRL" } },
  dollarRate: number(Number.MIN_VALUE),
  productMode: { type: String, required: true, enum: ["single", "multiple"] },
  product: { type: new Schema({
    name: { type: String, default: "" },
    importTax: number(), quantity: number(1), unitPriceDollar: number(),
    shippingDollar: number(), icms: number(0, 99.99),
  }, { _id: false }), required: true },
  sales: { type: new Schema({
    isKit: { type: Boolean, required: true },
    salesTax: number(0, 100), salePrice: number(), shippingFee: number(),
    adFee: number(0, 100), packagingCost: number(),
  }, { _id: false }), required: true },
  isKit: { type: Boolean, required: true },
  kitQuantity: number(1),
  source: { type: new Schema({
    supplierIndex: number(),
    quoteIndex: { type: Number, default: null, min: 0 },
    supplierName: { type: String, default: "" },
  }, { _id: false }), default: null },
  savedAt: { type: Date, required: true },
}, { _id: false })

export type CalculatorState = InferSchemaType<typeof calculatorStateSchema>
