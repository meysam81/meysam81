import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import playformCompress from "@playform/compress";
import tailwindcss from "@tailwindcss/vite";
import expressiveCode from "astro-expressive-code";
import { defineConfig } from "astro/config";
import path from "path";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import { fileURLToPath } from "url";
import compression from "vite-plugin-compression2";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  site: "https://meysam.io",
  server: {
    port: 3000,
  },
  integrations: [
    sitemap(),
    expressiveCode({
      frames: {
        removeCommentsWhenCopyingTerminalFrames: false,
      },
    }),
    mdx(),
    {
      name: "pagefind-integration",
      hooks: {
        "astro:build:done": async function buildDone({ dir }) {
          var { execSync } = await import("child_process");

          // Check if bun is available, otherwise use npx
          let packageRunner = "npx";
          try {
            execSync("which bun", { stdio: "ignore" });
            packageRunner = "bunx";
          } catch {
            // bun not available, use npx
          }

          execSync(
            `${packageRunner} pagefind --site ${dir.pathname} --glob '**/blog/**/*.html'`,
            {
              stdio: "inherit",
            }
          );
        },
      },
    },
    playformCompress(),
  ],
  markdown: {
    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
  },
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
