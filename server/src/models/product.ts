import mongoose, { Schema, Document } from "mongoose"

export const PIPELINE_STAGES = ["triagem", "analise", "aprovado", "importando", "concluido"] as const
export type PipelineStage = typeof PIPELINE_STAGES[number]

export const COMPETITION_LEVELS = ["Baixa", "Média", "Alta", "Saturado"] as const
export type CompetitionLevel = typeof COMPETITION_LEVELS[number]

export type PipelineProduct = Document & {
  title: string
  url: string
  imageUrl: string
  price: number
  category: string
  stage: PipelineStage
  score: number
  monthlySales: number
  competitionLevel: CompetitionLevel
  potentialMargin: string
  analysisReport: string
  analyzedAt: Date
  order: number
  createdAt: Date
  updatedAt: Date
}

const productSchema = new Schema<PipelineProduct>(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    imageUrl: { type: String, default: "" },
    price: { type: Number, default: 0 },
    category: { type: String, default: "" },
    stage: { type: String, enum: PIPELINE_STAGES, default: "triagem" },
    score: { type: Number, default: 0, min: 0, max: 10 },
    monthlySales: { type: Number, default: 0 },
    competitionLevel: { type: String, enum: COMPETITION_LEVELS, default: "Média" },
    potentialMargin: { type: String, default: "" },
    analysisReport: { type: String, default: "" },
    analyzedAt: { type: Date, default: Date.now },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
)

productSchema.index({ stage: 1, order: 1 })

export const Product = mongoose.model<PipelineProduct>("Product", productSchema)
