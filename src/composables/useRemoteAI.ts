// Remote AI Inference with HuggingFace → Cloudflare fallback
// Privacy-conscious: requires explicit user consent

import { ref } from "vue";
import { useLogger } from "@/composables/useLogger";

type ConsentLevel = "none" | "once" | "always";
var CONSENT_STORAGE_KEY = "ai-remote-consent";

interface RemoteAIConfig {
  huggingface: {
    model: string;
    endpoint: string;
  };
  cloudflare: {
    model: string;
    endpoint: string;
  };
}

// Default configuration - no API keys needed for public inference endpoints
var CONFIG: RemoteAIConfig = {
  huggingface: {
    // Use HF Inference API router for best model selection
    model: "HuggingFaceH4/zephyr-7b-beta",
    endpoint:
      "https://api-inference.huggingface.co/models/HuggingFaceH4/zephyr-7b-beta",
  },
  cloudflare: {
    // Cloudflare's free tier model
    model: "@cf/meta/llama-3.2-1b-instruct",
    endpoint: "/api/ai", // Server-side proxy to avoid exposing API keys
  },
};

export function useRemoteAI() {
  var logger = useLogger("RemoteAI");
  var consent = ref<ConsentLevel>(loadConsent());
  var isLoading = ref(false);
  var error = ref<string | null>(null);
  var lastProvider = ref<"huggingface" | "cloudflare" | null>(null);

  function loadConsent(): ConsentLevel {
    if (typeof localStorage === "undefined") {
      return "none";
    }
    var stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (stored === "always" || stored === "once") {
      return stored;
    }
    return "none";
  }

  function setConsent(level: ConsentLevel) {
    consent.value = level;
    if (typeof localStorage !== "undefined") {
      if (level === "always") {
        localStorage.setItem(CONSENT_STORAGE_KEY, level);
      } else if (level === "none") {
        localStorage.removeItem(CONSENT_STORAGE_KEY);
      }
      // "once" is not persisted - single session only
    }
    logger.info("Consent set to:", level);
  }

  function hasConsent(): boolean {
    return consent.value === "always" || consent.value === "once";
  }

  async function callHuggingFace(
    prompt: string,
    maxTokens: number,
  ): Promise<string> {
    logger.debug("Trying HuggingFace API");

    var response = await fetch(CONFIG.huggingface.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens,
          temperature: 0.7,
          return_full_text: false,
        },
      }),
    });

    if (!response.ok) {
      var errorText = await response.text();
      logger.warn("HuggingFace API error:", response.status, errorText);
      throw new Error(`HuggingFace API error: ${response.status}`);
    }

    var data = await response.json();

    // HF returns array of generated texts
    if (Array.isArray(data) && data[0]?.generated_text) {
      return data[0].generated_text;
    }

    throw new Error("Unexpected HuggingFace response format");
  }

  async function callCloudflare(
    prompt: string,
    maxTokens: number,
  ): Promise<string> {
    logger.debug("Trying Cloudflare API");

    var response = await fetch(CONFIG.cloudflare.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        prompt,
        maxTokens,
        provider: "cloudflare",
      }),
    });

    if (!response.ok) {
      var errorText = await response.text();
      logger.warn("Cloudflare API error:", response.status, errorText);
      throw new Error(`Cloudflare API error: ${response.status}`);
    }

    var data = await response.json();
    return data.result || data.response || "";
  }

  async function generate(
    prompt: string,
    options?: { maxTokens?: number },
  ): Promise<string> {
    if (!hasConsent()) {
      throw new Error("User consent required for remote AI");
    }

    isLoading.value = true;
    error.value = null;
    var maxTokens = options?.maxTokens ?? 150;

    try {
      // Try HuggingFace first
      try {
        var hfResult = await callHuggingFace(prompt, maxTokens);
        lastProvider.value = "huggingface";
        logger.info("Response from HuggingFace");
        return hfResult;
      } catch {
        logger.warn("HuggingFace failed, trying Cloudflare fallback");
      }

      // Fallback to Cloudflare
      var cfResult = await callCloudflare(prompt, maxTokens);
      lastProvider.value = "cloudflare";
      logger.info("Response from Cloudflare");
      return cfResult;
    } catch (e) {
      var message = e instanceof Error ? e.message : "Remote AI request failed";
      error.value = message;
      logger.error("All remote providers failed:", message);
      throw e;
    } finally {
      isLoading.value = false;

      // Reset "once" consent after use
      if (consent.value === "once") {
        consent.value = "none";
      }
    }
  }

  function revokeConsent() {
    setConsent("none");
  }

  return {
    generate,
    setConsent,
    hasConsent,
    revokeConsent,
    consent,
    isLoading,
    error,
    lastProvider,
  };
}
