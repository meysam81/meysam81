// Browser-based LLM inference using Transformers.js + Qwen3
// Features:
// - WebGPU detection BEFORE download
// - Lazy model loading (on-demand)
// - Progress tracking for download UI
// - WASM fallback for browsers without WebGPU
// - Singleton pattern (one model instance)

import { ref, computed } from "vue";
import { useLogger } from "@/composables/useLogger";

// Use onnx-community models - they have pre-converted ONNX files for Transformers.js
// Options: onnx-community/Qwen3-0.6B-ONNX (~400MB q4), onnx-community/Qwen3-1.7B-ONNX (~1GB q4)
var MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";
var modelInstance: any = null;
var loadingPromise: Promise<any> | null = null;
var webgpuChecked = false;
var webgpuAvailable = false;

// Check WebGPU availability once, cache result
async function checkWebGPU(): Promise<boolean> {
  if (webgpuChecked) {
    return webgpuAvailable;
  }

  webgpuChecked = true;

  if (typeof navigator === "undefined" || !("gpu" in navigator)) {
    webgpuAvailable = false;
    return false;
  }

  try {
    var adapter = await (navigator as any).gpu.requestAdapter();
    webgpuAvailable = adapter !== null;
    return webgpuAvailable;
  } catch {
    webgpuAvailable = false;
    return false;
  }
}

export function useAIInference() {
  var logger = useLogger("AIInference");
  var progress = ref(0);
  var status = ref<"idle" | "loading" | "ready" | "error">("idle");
  var error = ref<string | null>(null);
  var downloadedMB = ref(0);
  var totalMB = ref(0);
  var backend = ref<"webgpu" | "wasm" | null>(null);

  var isLoading = computed(function computeIsLoading() {
    return status.value === "loading";
  });

  var isReady = computed(function computeIsReady() {
    return status.value === "ready";
  });

  function handleProgress(p: any) {
    if (p.status === "progress" && p.total) {
      progress.value = Math.round((p.loaded / p.total) * 100);
      downloadedMB.value = Math.round(p.loaded / 1024 / 1024);
      totalMB.value = Math.round(p.total / 1024 / 1024);
    }
  }

  function loadModel() {
    if (modelInstance) {
      status.value = "ready";
      return Promise.resolve(modelInstance);
    }

    if (loadingPromise) {
      return loadingPromise;
    }

    status.value = "loading";
    error.value = null;
    logger.info("Starting model load");

    loadingPromise = (async function doLoadModel() {
      var { pipeline, env } = await import("@huggingface/transformers");

      // Disable multi-threading to avoid SharedArrayBuffer requirement
      // (SharedArrayBuffer requires Cross-Origin-Isolation headers)
      env.backends.onnx.wasm.numThreads = 1;

      // Check WebGPU availability BEFORE downloading
      var hasWebGPU = await checkWebGPU();
      logger.info("WebGPU available:", hasWebGPU);

      try {
        if (hasWebGPU) {
          logger.debug("Loading with WebGPU backend");
          backend.value = "webgpu";
          modelInstance = await pipeline("text-generation", MODEL_ID, {
            dtype: "q4",
            device: "webgpu",
            progress_callback: handleProgress,
          });
        } else {
          logger.debug("Loading with WASM backend (WebGPU not available)");
          backend.value = "wasm";
          modelInstance = await pipeline("text-generation", MODEL_ID, {
            dtype: "q4",
            device: "wasm",
            progress_callback: handleProgress,
          });
        }

        status.value = "ready";
        progress.value = 100;
        logger.info("Model loaded successfully with", backend.value);
        return modelInstance;
      } catch (loadError) {
        // If WebGPU was attempted but failed, try WASM fallback
        if (hasWebGPU && backend.value === "webgpu") {
          logger.warn("WebGPU load failed, trying WASM fallback");
          try {
            backend.value = "wasm";
            modelInstance = await pipeline("text-generation", MODEL_ID, {
              dtype: "q4",
              device: "wasm",
              progress_callback: handleProgress,
            });
            status.value = "ready";
            progress.value = 100;
            logger.info("Model loaded with WASM fallback");
            return modelInstance;
          } catch (wasmError) {
            status.value = "error";
            error.value =
              wasmError instanceof Error
                ? wasmError.message
                : "Failed to load AI model";
            loadingPromise = null;
            logger.error("WASM fallback also failed", error.value);
            throw wasmError;
          }
        }

        status.value = "error";
        error.value =
          loadError instanceof Error
            ? loadError.message
            : "Failed to load AI model";
        loadingPromise = null;
        logger.error("Model load failed", error.value);
        throw loadError;
      }
    })();

    return loadingPromise;
  }

  async function generate(
    prompt: string,
    options?: { maxTokens?: number; temperature?: number },
  ) {
    var model = await loadModel();
    var maxTokens = options?.maxTokens ?? 150;
    var temperature = options?.temperature ?? 0.1;

    logger.debug("Generating response", { maxTokens, temperature });

    var output = await model(prompt, {
      max_new_tokens: maxTokens,
      temperature: temperature,
      do_sample: temperature > 0,
    });

    return output[0]?.generated_text ?? "";
  }

  // Check WebGPU without loading model - useful for UI hints
  async function checkBackendSupport() {
    var hasWebGPU = await checkWebGPU();
    return {
      webgpu: hasWebGPU,
      wasm: true, // WASM is always available in modern browsers
      recommended: hasWebGPU ? "webgpu" : "wasm",
    };
  }

  return {
    loadModel,
    generate,
    checkBackendSupport,
    progress,
    status,
    error,
    isLoading,
    isReady,
    downloadedMB,
    totalMB,
    backend,
  };
}
