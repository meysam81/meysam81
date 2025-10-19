import { defineConfig } from "astro/config";

export default defineConfig({
  site: "https://meysam.io",
  build: {
    inlineStylesheets: "auto",
  },
  compressHTML: true,
  vite: {
    resolve: {
      alias: {
        "@": "/src",
      },
    },
  },
});
