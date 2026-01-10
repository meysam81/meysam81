/**
 * Composable for handling URL parameters in tool pages.
 * Supports encoding/decoding with base64 for shareable URLs.
 *
 * @example
 * ```typescript
 * var { getParam, getDecodedParam, generateShareUrl } = useUrlParams();
 *
 * // On mount, read URL param
 * var expr = getDecodedParam("expr");
 * if (expr) {
 *   expressionInput.value = expr;
 * }
 *
 * // Generate shareable URL
 * var shareUrl = generateShareUrl({ expr: btoa(expression) });
 * ```
 */
export function useUrlParams() {
  /**
   * Get a raw URL parameter value
   */
  function getParam(key: string): string | null {
    if (typeof window === "undefined") {
      return null;
    }
    var params = new URLSearchParams(window.location.search);
    return params.get(key);
  }

  /**
   * Get a base64-decoded URL parameter value
   * Returns null if param doesn't exist or decoding fails
   * Handles Unicode characters safely
   */
  function getDecodedParam(key: string): string | null {
    var value = getParam(key);
    if (!value) {
      return null;
    }
    try {
      // Decode base64, then decode URI component for Unicode support
      return decodeURIComponent(atob(value));
    } catch {
      return null;
    }
  }

  /**
   * Set multiple URL parameters without page reload
   */
  function setParams(params: Record<string, string>): void {
    if (typeof window === "undefined") {
      return;
    }
    var url = new URL(window.location.href);
    url.search = "";
    Object.entries(params).forEach(function setParam([key, value]) {
      url.searchParams.set(key, value);
    });
    window.history.replaceState({}, "", url.toString());
  }

  /**
   * Generate a shareable URL with the given parameters
   */
  function generateShareUrl(params: Record<string, string>): string {
    if (typeof window === "undefined") {
      return "";
    }
    var url = new URL(window.location.href);
    url.search = "";
    Object.entries(params).forEach(function setParam([key, value]) {
      url.searchParams.set(key, value);
    });
    return url.toString();
  }

  /**
   * Encode a value for URL sharing using base64
   * Handles Unicode characters safely by encoding to URI component first
   */
  function encodeValue(value: string): string {
    // Encode Unicode to URI component, then to base64
    return btoa(encodeURIComponent(value));
  }

  /**
   * Decode a base64-encoded URL value
   * Returns null if decoding fails
   * Handles Unicode characters safely
   */
  function decodeValue(encoded: string): string | null {
    try {
      // Decode base64, then decode URI component for Unicode support
      return decodeURIComponent(atob(encoded));
    } catch {
      return null;
    }
  }

  return {
    getParam,
    getDecodedParam,
    setParams,
    generateShareUrl,
    encodeValue,
    decodeValue,
  };
}
