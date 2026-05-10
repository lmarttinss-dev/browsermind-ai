import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { crx } from "@crxjs/vite-plugin";
import manifest from "./manifest.json";
import path from "path";

export default defineConfig({
  plugins: [react(), crx({ manifest })],
  base: "./",
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    outDir: "/mnt/c/Users/Leandro Martins/browsermind-ai-ext",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        popup: "index.html",
      },
    },
  },
});
