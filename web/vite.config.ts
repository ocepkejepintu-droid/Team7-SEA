import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "node:path";

export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss()],
  resolve: { alias: { "@": resolve(__dirname, "src"), "@shared": resolve(__dirname, "../shared") } },
  server: { proxy: { "/api": "http://127.0.0.1:8791" } },
  build: { outDir: "dist", chunkSizeWarningLimit: 4000 },
  test: { include: ["src/**/*.test.ts"] },
});
