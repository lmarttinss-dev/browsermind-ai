import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiTarget = env.VITE_API_TARGET || "http://localhost:3210";
  return {
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5180,
    proxy: {
      "/api": apiTarget,
      "/health": apiTarget,
      "/status": apiTarget,
      "/launch": apiTarget,
      "/close": apiTarget,
      "/navigate": apiTarget,
      "/screenshot": apiTarget,
      "/extract": apiTarget,
      "/action": apiTarget,
      "/actions": apiTarget,
      "/pages": apiTarget,
      "/extension": apiTarget,
      "/avantpro": apiTarget,
    },
  },
  };
});
