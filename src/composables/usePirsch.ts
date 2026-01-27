// Client-side Pirsch analytics event tracking
// Uses the global pirsch() function from pa.js

export function usePirsch() {
  function trackEvent(
    name: string,
    metadata?: Record<string, string | number>,
  ) {
    if (
      typeof window !== "undefined" &&
      typeof (window as any).pirsch === "function"
    ) {
      (window as any).pirsch(name, { meta: metadata });
    }
  }

  return {
    trackEvent,
    // Predefined AI events
    trackAIModelLoaded: function trackAIModelLoaded() {
      trackEvent("ai_model_loaded");
    },
    trackAIToggleOn: function trackAIToggleOn(tool: string) {
      trackEvent("ai_toggle_on", { tool });
    },
    trackAIQuery: function trackAIQuery(tool: string) {
      trackEvent("ai_query", { tool });
    },
    trackAIError: function trackAIError(tool: string, errorMsg: string) {
      trackEvent("ai_error", { tool, error: errorMsg });
    },
  };
}
