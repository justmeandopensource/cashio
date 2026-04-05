import { defineConfig, type UserConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";
import path from "path";
import process from "process";
import { fileURLToPath } from "url";

const certFile = process.env.SSL_CERTFILE;
const keyFile = process.env.SSL_KEYFILE;
const httpsConfig =
  certFile && keyFile && fs.existsSync(certFile) && fs.existsSync(keyFile)
    ? { cert: fs.readFileSync(certFile), key: fs.readFileSync(keyFile) }
    : undefined;

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        skipWaiting: true,
        clientsClaim: true,
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /\/api\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
      manifest: {
        name: "Cashio",
        short_name: "Cashio",
        description: "Personal Finance Manager",
        theme_color: "#35a9a3",
        background_color: "#35a9a3",
        display: "standalone",
        icons: [
          { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    host: "0.0.0.0",
    port: httpsConfig ? 443 : 3000,
    https: httpsConfig,
    allowedHosts: ["cashio.test", "cashio.local"],
  },
  build: {
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@chakra-ui/react",
            "@emotion/react",
            "@emotion/styled",
            "framer-motion",
          ],
          "vendor-data": [
            "@tanstack/react-query",
            "axios",
            "zustand",
            "react-hook-form",
          ],
          "charts-nivo": [
            "@nivo/core",
            "@nivo/bar",
            "@nivo/line",
            "@nivo/pie",
            "@nivo/tooltip",
          ],
          "charts-recharts": ["recharts"],
        },
      },
    },
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
