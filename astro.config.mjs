import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: "https://meysam.io",
  integrations: [sitemap()],
  build: {
    inlineStylesheets: "auto",
    minify: true,
  },
  compressHTML: true,
  vite: {
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      minify: "esbuild",
      cssMinify: true,
    },
  },
});
