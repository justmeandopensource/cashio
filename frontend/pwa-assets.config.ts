import { defineConfig, minimalPreset } from "@vite-pwa/assets-generator/config";

export default defineConfig({
  preset: {
    ...minimalPreset,
    transparent: { ...minimalPreset.transparent, padding: 0 },
    maskable: { ...minimalPreset.maskable, padding: 0 },
    apple: { ...minimalPreset.apple, padding: 0 },
  },
  images: ["public/cashio.svg"],
});
