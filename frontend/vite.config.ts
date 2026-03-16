import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const certFile = process.env.SSL_CERTFILE;
const keyFile = process.env.SSL_KEYFILE;
const httpsConfig =
  certFile && keyFile && fs.existsSync(certFile) && fs.existsSync(keyFile)
    ? { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }
    : undefined;

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: httpsConfig ? 443 : 3000,
    https: httpsConfig,
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
