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
// Model: onnx-community/Qwen3-0.6B-ONNX
// - q4f16 (570MB): WebGPU only (uses MatMulNBits)
// - q4 (919MB): WebGPU only (uses MatMulNBits)
// - int8 (618MB): WASM compatible
// - fp16 (1.2GB): Both backends
var MODEL_ID = "onnx-community/Qwen3-0.6B-ONNX";

// Quantization types by backend compatibility
// WebGPU supports MatMulNBits (q4, q4f16), WASM does not
var WEBGPU_DTYPE = "q4f16" as const; // Smallest WebGPU-compatible (570MB)
var WASM_DTYPE = "int8" as const; // WASM-compatible, no MatMulNBits (618MB)

// Model sizes in MB for UI display
export var MODEL_SIZES = {
  webgpu: 570, // q4f16
  wasm: 618, // int8
} as const;
var modelInstance: any = null;
var loadingPromise: Promise<any> | null = null;
var webgpuChecked = false;
var webgpuAvailable = false;
var envConfigured = false;

// Configure ONNX environment for single-threaded WASM (no SharedArrayBuffer required)
async function configureOnnxEnv() {
  if (envConfigured) {
    return;
  }

  var { env } = await import("@huggingface/transformers");

  // Critical: Disable multi-threading to avoid SharedArrayBuffer requirement
  // SharedArrayBuffer requires Cross-Origin-Isolation headers (COOP/COEP)
  env.backends.onnx.wasm.numThreads = 1;

  // Disable web worker proxy - this prevents loading the threaded WASM
  env.backends.onnx.wasm.proxy = false;

  envConfigured = true;
}

// Check if Cross-Origin-Isolation is enabled (required for SharedArrayBuffer)
function isCrossOriginIsolated(): boolean {
  if (typeof self === "undefined") {
    return false;
  }
  return (self as any).crossOriginIsolated === true;
}

// Check WebGPU availability once, cache result
// Note: WebGPU requires Cross-Origin-Isolation for the threaded WASM backend
async function checkWebGPU(): Promise<boolean> {
  if (webgpuChecked) {
    return webgpuAvailable;
  }

  webgpuChecked = true;

  // WebGPU with onnxruntime requires SharedArrayBuffer, which needs
  // Cross-Origin-Isolation (COOP/COEP headers)
  if (!isCrossOriginIsolated()) {
    webgpuAvailable = false;
    return false;
  }

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
      // Configure ONNX environment BEFORE importing pipeline
      // This must happen first to prevent loading threaded WASM
      await configureOnnxEnv();

      var { pipeline } = await import("@huggingface/transformers");

      // Check WebGPU availability BEFORE downloading
      var hasWebGPU = await checkWebGPU();
      logger.info("WebGPU available:", hasWebGPU);

      try {
        if (hasWebGPU) {
          // WebGPU: Use q4f16 (570MB) - optimized for WebGPU with MatMulNBits
          logger.debug("Loading with WebGPU backend, dtype:", WEBGPU_DTYPE);
          backend.value = "webgpu";
          modelInstance = await pipeline("text-generation", MODEL_ID, {
            dtype: WEBGPU_DTYPE,
            device: "webgpu",
            progress_callback: handleProgress,
          });
        } else {
          // WASM: Use fp16 (1.2GB) - compatible with WASM backend
          // Note: q4/q4f16 use MatMulNBits which is WebGPU-only
          logger.debug("Loading with WASM backend, dtype:", WASM_DTYPE);
          backend.value = "wasm";
          modelInstance = await pipeline("text-generation", MODEL_ID, {
            dtype: WASM_DTYPE,
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
          logger.warn(
            "WebGPU load failed, trying WASM fallback with",
            WASM_DTYPE,
          );
          try {
            backend.value = "wasm";
            modelInstance = await pipeline("text-generation", MODEL_ID, {
              dtype: WASM_DTYPE,
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
    var crossOriginIsolated = isCrossOriginIsolated();
    var hasWebGPU = await checkWebGPU();

    var webgpuReason = "Available";
    if (!crossOriginIsolated) {
      webgpuReason = "Cross-Origin-Isolation not enabled";
    } else if (!hasWebGPU) {
      webgpuReason = "WebGPU not supported by browser";
    }

    var recommendedBackend = hasWebGPU ? "webgpu" : "wasm";
    return {
      webgpu: hasWebGPU,
      wasm: true, // WASM is always available in modern browsers
      recommended: recommendedBackend,
      crossOriginIsolated: crossOriginIsolated,
      webgpuReason: webgpuReason,
      estimatedSizeMB:
        MODEL_SIZES[recommendedBackend as keyof typeof MODEL_SIZES],
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
