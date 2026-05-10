import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5180,
    proxy: {
      "/api": "http://localhost:3210",
      "/health": "http://localhost:3210",
      "/status": "http://localhost:3210",
      "/launch": "http://localhost:3210",
      "/close": "http://localhost:3210",
      "/navigate": "http://localhost:3210",
      "/screenshot": "http://localhost:3210",
      "/extract": "http://localhost:3210",
      "/action": "http://localhost:3210",
      "/actions": "http://localhost:3210",
      "/pages": "http://localhost:3210",
      "/extension": "http://localhost:3210",
      "/avantpro": "http://localhost:3210",
    },
  },
});
