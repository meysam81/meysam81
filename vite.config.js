import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";
import { visualizer } from "rollup-plugin-visualizer";
import { VitePWA } from "vite-plugin-pwa";
import viteCompression from "vite-plugin-compression";

export default defineConfig(function configureVite({ command }) {
  var isProduction = command == "build";

  return {
    plugins: [
      vue({
        template: {
          compilerOptions: {
            isCustomElement: function isCustomElement(tag) {
              return tag.startsWith("custom-");
            },
          },
        },
      }),

      isProduction &&
        viteCompression({
          algorithm: "gzip",
          ext: ".gz",
        }),

      isProduction &&
        viteCompression({
          algorithm: "brotliCompress",
          ext: ".br",
        }),

      isProduction &&
        VitePWA({
          registerType: "autoUpdate",
          workbox: {
            globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
            maximumFileSizeToCacheInBytes: 3000000,
          },
        }),

      isProduction &&
        visualizer({
          filename: "dist/stats.html",
          open: false,
          gzipSize: true,
          brotliSize: true,
        }),
    ].filter(Boolean),

    resolve: {
      alias: {
        "@": resolve(__dirname, "src"),
        "~": resolve(__dirname, "node_modules"),
      },
    },

    css: {
      devSourcemap: !isProduction,
      preprocessorOptions: {
        scss: {
          additionalData: '@import "@/styles/variables.scss";',
        },
      },
    },

    server: {
      port: 3000,
      host: true,
      cors: true,
      hmr: {
        overlay: true,
      },
      compress: true,
    },

    preview: {
      port: 4173,
      host: true,
    },

    build: {
      target: ["es2020", "chrome80", "firefox78", "safari13"],
      outDir: "dist",
      assetsDir: "assets",
      minify: "terser",
      sourcemap: false,
      cssCodeSplit: true,

      terserOptions: {
        compress: {
          drop_console: isProduction,
          drop_debugger: isProduction,
          pure_funcs: isProduction ? ["console.log", "console.info"] : [],
        },
        format: {
          comments: false,
        },
      },

      rollupOptions: {
        output: {
          manualChunks: function manualChunks(id) {
            if (id.includes("node_modules")) {
              if (id.includes("vue")) {
                return "vue-vendor";
              }
              if (id.includes("xlsx") || id.includes("exceljs")) {
                return "excel-libs";
              }
              if (id.includes("lodash") || id.includes("ramda")) {
                return "utils";
              }
              if (id.includes("axios") || id.includes("fetch")) {
                return "http";
              }
              if (id.includes("router")) {
                return "router";
              }
              return "vendor";
            }
          },

          chunkFileNames: function chunkFileNames() {
            return "js/[name]-[hash].js";
          },

          entryFileNames: "js/[name]-[hash].js",
          assetFileNames: function assetFileNames(assetInfo) {
            var info = assetInfo.name.split(".");
            var extType = info[info.length - 1];
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
              extType = "img";
            }
            return extType + "/[name]-[hash][extname]";
          },
        },

        external: function external() {
          return false;
        },
      },

      chunkSizeWarningLimit: 1000,
      assetsInlineLimit: 4096,
    },

    optimizeDeps: {
      include: ["vue", "vue-router"],
      exclude: ["vue-demi"],
    },

    esbuild: {
      drop: isProduction ? ["console", "debugger"] : [],
      legalComments: "none",
    },

    define: {
      __CURRENT_YEAR__: new Date().getFullYear(),
      __VERSION__: JSON.stringify(process.env.npm_package_version || "1.0.0"),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __IS_PRODUCTION__: isProduction,
    },
  };
});
