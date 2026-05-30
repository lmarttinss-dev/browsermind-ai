import mongoose, { Schema, Document } from "mongoose"

export type ComparisonDocument = Document & {
  stage: string
  productIds: string[]
  productHash: string
  ranking: Array<{ productId: string; position: number; reason: string }>
  report: string
  productsCompared: number
  model: string
  createdAt: Date
}

const comparisonSchema = new Schema<ComparisonDocument>(
  {
    stage: { type: String, required: true },
    productIds: { type: [String], required: true },
    productHash: { type: String, required: true },
    ranking: {
      type: [{ productId: String, position: Number, reason: String }],
      default: [],
    },
    report: { type: String, default: "" },
    productsCompared: { type: Number, default: 0 },
    model: { type: String, default: "" },
  },
  { timestamps: true }
)

comparisonSchema.index({ stage: 1, productHash: 1 })

export const Comparison = mongoose.model<ComparisonDocument>("Comparison", comparisonSchema)
