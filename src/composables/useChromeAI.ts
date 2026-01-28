// Chrome Built-in AI Summarizer
// Available in Chrome 138+ with Gemini Nano
// Zero download, instant inference, 100% private

import { ref } from "vue";
import { useLogger } from "@/composables/useLogger";

// Type definitions for Chrome AI APIs
interface AISummarizerCapabilities {
  available: "readily" | "after-download" | "no";
}

interface AISummarizer {
  summarize(text: string, options?: { context?: string }): Promise<string>;
  destroy(): void;
}

interface AISummarizerFactory {
  capabilities(): Promise<AISummarizerCapabilities>;
  create(options?: {
    type?: "key-points" | "tl;dr" | "teaser" | "headline";
    format?: "markdown" | "plain-text";
    length?: "short" | "medium" | "long";
  }): Promise<AISummarizer>;
}

// Extend globalThis for Chrome AI
declare global {
  interface Window {
    ai?: {
      summarizer?: AISummarizerFactory;
    };
  }
}

export function useChromeAI() {
  var logger = useLogger("ChromeAI");
  var isAvailable = ref<boolean | null>(null);
  var isLoading = ref(false);
  var error = ref<string | null>(null);

  var summarizerInstance: AISummarizer | null = null;

  async function checkAvailability(): Promise<boolean> {
    if (isAvailable.value !== null) {
      return isAvailable.value;
    }

    if (typeof window === "undefined" || !window.ai?.summarizer) {
      logger.debug("Chrome AI not available in this environment");
      isAvailable.value = false;
      return false;
    }

    try {
      var capabilities = await window.ai.summarizer.capabilities();
      isAvailable.value = capabilities.available !== "no";
      logger.info("Chrome AI availability:", capabilities.available);
      return isAvailable.value;
    } catch (e) {
      logger.warn("Failed to check Chrome AI capabilities:", e);
      isAvailable.value = false;
      return false;
    }
  }

  async function summarize(
    text: string,
    options?: {
      type?: "key-points" | "tl;dr" | "teaser" | "headline";
      length?: "short" | "medium" | "long";
    },
  ): Promise<string> {
    if (!(await checkAvailability())) {
      throw new Error("Chrome AI Summarizer not available");
    }

    isLoading.value = true;
    error.value = null;

    try {
      if (!summarizerInstance) {
        logger.debug("Creating summarizer instance");
        summarizerInstance = await window.ai!.summarizer!.create({
          type: options?.type ?? "key-points",
          format: "plain-text",
          length: options?.length ?? "medium",
        });
      }

      logger.debug("Summarizing text", { length: text.length });
      var result = await summarizerInstance.summarize(text);
      logger.info("Summarization complete");
      return result;
    } catch (e) {
      var message = e instanceof Error ? e.message : "Summarization failed";
      error.value = message;
      logger.error("Summarization error:", message);
      throw e;
    } finally {
      isLoading.value = false;
    }
  }

  function destroy() {
    if (summarizerInstance) {
      summarizerInstance.destroy();
      summarizerInstance = null;
      logger.debug("Summarizer instance destroyed");
    }
  }

  return {
    checkAvailability,
    summarize,
    destroy,
    isAvailable,
    isLoading,
    error,
  };
}
