import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";
import { fileURLToPath } from "url";

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
    port: 3000,
    allowedHosts: ["cashio.test", "cashio.local"],
  },
  build: {
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        // Rolldown (Vite 8) replaces Rollup's object-form manualChunks.
        codeSplitting: {
          groups: [
            {
              name: "vendor-react",
              test: /node_modules\/(react|react-dom|react-router(-dom)?|scheduler)\//,
            },
            {
              name: "vendor-ui",
              test: /node_modules\/(@chakra-ui|@emotion|@ark-ui|@zag-js)\//,
            },
            {
              name: "vendor-data",
              test: /node_modules\/(@tanstack\/react-query|axios|zustand|react-hook-form)\//,
            },
            { name: "charts-nivo", test: /node_modules\/(@nivo|d3-)/ },
          ],
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
