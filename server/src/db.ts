import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/browsermind"

export async function connectDatabase() {
  try {
    await mongoose.connect(MONGODB_URI)
    console.log("✅ MongoDB conectado:", MONGODB_URI)
  } catch (error) {
    console.error("❌ Erro ao conectar MongoDB:", error)
    process.exit(1)
  }
}
