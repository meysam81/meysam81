import { ref } from "vue";
import { useLogger } from "./useLogger";

export function useClipboard() {
  var logger = useLogger("useClipboard");
  var copied = ref(false);
  var copyTimeout: ReturnType<typeof setTimeout> | null = null;

  async function copy(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text);
      copied.value = true;

      // Reset copied state after 2 seconds
      if (copyTimeout) {
        clearTimeout(copyTimeout);
      }
      copyTimeout = setTimeout(function resetCopied() {
        copied.value = false;
      }, 2000);

      logger.debug("Copied to clipboard");
      return true;
    } catch (err) {
      // Fallback for older browsers
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();

      try {
        document.execCommand("copy");
        copied.value = true;

        if (copyTimeout) {
          clearTimeout(copyTimeout);
        }
        copyTimeout = setTimeout(function resetCopied() {
          copied.value = false;
        }, 2000);

        logger.debug("Copied to clipboard (fallback)");
        return true;
      } catch (fallbackErr) {
        logger.error("Failed to copy", fallbackErr);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  return {
    copied,
    copy,
  };
}
