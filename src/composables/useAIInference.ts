// Browser-based LLM inference using Transformers.js + Qwen 2.5 0.5B
// Features:
// - Lazy model loading (on-demand)
// - Progress tracking for download UI
// - WebGPU with WASM fallback
// - Singleton pattern (one model instance)

import { ref, computed } from "vue";
import { useLogger } from "@/composables/useLogger";

var MODEL_ID = "Qwen/Qwen2.5-0.5B-Instruct";
var modelInstance: any = null;
var loadingPromise: Promise<any> | null = null;

export function useAIInference() {
  var logger = useLogger("AIInference");
  var progress = ref(0);
  var status = ref<"idle" | "loading" | "ready" | "error">("idle");
  var error = ref<string | null>(null);
  var downloadedMB = ref(0);
  var totalMB = ref(0);

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

  async function loadModelWithWebGPU() {
    var { pipeline } = await import("@huggingface/transformers");
    return pipeline("text-generation", MODEL_ID, {
      dtype: "q4",
      device: "webgpu",
      progress_callback: handleProgress,
    });
  }

  async function loadModelWithWasm() {
    var { pipeline } = await import("@huggingface/transformers");
    return pipeline("text-generation", MODEL_ID, {
      dtype: "q4",
      progress_callback: handleProgress,
    });
  }

  async function loadModel() {
    if (modelInstance) {
      status.value = "ready";
      return await Promise.resolve(modelInstance);
    }

    if (loadingPromise) {
      return await loadingPromise;
    }

    status.value = "loading";
    error.value = null;
    logger.info("Starting model load");

    loadingPromise = (async function doLoadModel() {
      try {
        logger.debug("Attempting WebGPU inference");
        modelInstance = await loadModelWithWebGPU();
        status.value = "ready";
        progress.value = 100;
        logger.info("Model loaded successfully with WebGPU");
        return modelInstance;
      } catch (webgpuError) {
        logger.warn(
          "WebGPU failed, falling back to WASM",
          webgpuError instanceof Error ? webgpuError.message : webgpuError,
        );

        // Fallback to WASM if WebGPU fails
        try {
          modelInstance = await loadModelWithWasm();
          status.value = "ready";
          progress.value = 100;
          logger.info("Model loaded successfully with WASM fallback");
          return modelInstance;
        } catch (fallbackError) {
          status.value = "error";
          error.value =
            fallbackError instanceof Error
              ? fallbackError.message
              : "Failed to load AI model";
          loadingPromise = null;
          logger.error("Model load failed", error.value);
          throw fallbackError;
        }
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

  return {
    loadModel,
    generate,
    progress,
    status,
    error,
    isLoading,
    isReady,
    downloadedMB,
    totalMB,
  };
}
