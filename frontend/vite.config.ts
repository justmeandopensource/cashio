import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 3000,
    allowedHosts: ["cashio.test", "cashio.local"],
  },
  resolve: {
    alias: {
      "@": path.resolve(path.dirname(fileURLToPath(import.meta.url)), "./src"),
      "@components": path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "./src/components",
      ),
      "@features": path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        "./src/features",
      ),
    },
  },
});
