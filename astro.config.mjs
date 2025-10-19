import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import path from "path";
import { fileURLToPath } from "url";
import compression from "vite-plugin-compression2";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: "https://meysam.io",
  integrations: [sitemap(), mdx()],
  build: {
    inlineStylesheets: "auto",
    minify: true,
  },
  compressHTML: true,
  vite: {
    plugins: [tailwindcss(), compression()],
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
