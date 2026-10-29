import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Standalone GitHub Pages build: output lands in docs/ (Pages source = main /docs).
export default defineConfig({
  root: import.meta.dirname,
  base: "/budget-tracker/",
  plugins: [react(), tailwindcss()],
  server: { port: 3104 },
  build: { outDir: "../docs", emptyOutDir: true },
});
