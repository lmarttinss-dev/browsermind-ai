import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/browsermind"

export async function connectDatabase() {
  try {
    mongoose.connection.on("disconnected", () => {
      console.warn("⚠️  MongoDB desconectado — tentando reconectar...")
    })
    mongoose.connection.on("reconnected", () => {
      console.log("✅ MongoDB reconectado")
    })
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    })
    console.log("✅ MongoDB conectado:", MONGODB_URI)
  } catch (error) {
    console.error("❌ Erro ao conectar MongoDB:", (error as Error).message)
    console.warn("⚠️  Server iniciando sem MongoDB — rotas de pipeline não funcionarão")
  }
}
