import mongoose, { Schema, Document } from "mongoose"

export type Category = Document & {
  name: string
  slug: string
  description: string
  color: string
  mlCategoryUrl: string
  createdAt: Date
  updatedAt: Date
}

/** Normaliza um nome em slug (lowercase, sem acentos, hífens) */
export function normalizeCategorySlug(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const categorySchema = new Schema<Category>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    slug: { type: String, unique: true, trim: true },
    description: { type: String, default: "" },
    color: { type: String, default: "#3b82f6" },
    mlCategoryUrl: { type: String, default: "" },
  },
  { timestamps: true }
)

// Gera o slug automaticamente a partir do nome
categorySchema.pre("save", async function () {
  if (this.isModified("name") || !this.slug) {
    this.slug = normalizeCategorySlug(this.name)
  }
})

export const Category = mongoose.model<Category>("Category", categorySchema)
