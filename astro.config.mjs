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
  integrations: [
    sitemap(),
    mdx(),
    {
      name: "pagefind-integration",
      hooks: {
        "astro:build:done": async function buildDone({ dir }) {
          var { execSync } = await import("child_process");
          execSync(`bunx pagefind --site ${dir.pathname}`, {
            stdio: "inherit",
          });
        },
      },
    },
  ],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  image: {
    service: {
      entrypoint: "astro/assets/services/sharp",
    },
    remotePatterns: [{ protocol: "https" }],
  },
  build: {
    inlineStylesheets: "auto",
    minify: true,
    assets: "_astro",
  },
  compressHTML: true,
  vite: {
    plugins: [
      tailwindcss(),
      compression({
        algorithm: "brotliCompress",
        exclude: [/\.(br)$/, /\.(gz)$/],
        threshold: 1024,
      }),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      external: ["/pagefind/pagefind.js"],
      minify: "esbuild",
      cssMinify: true,
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: function manualChunks(id) {
            if (id.includes("node_modules")) {
              return "vendor";
            }
          },
        },
      },
      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
    },
    css: {
      transformer: "lightningcss",
    },
  },
});
