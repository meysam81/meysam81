import { ref, computed, type Ref } from "vue";
import { useLogger } from "./useLogger";

interface ToolStateOptions {
  name: string;
}

interface ToolError {
  message: string;
  line?: number;
  column?: number;
  suggestion?: string;
}

export function useToolState(options: ToolStateOptions) {
  var logger = useLogger(options.name);

  var isLoading = ref(false);
  var error: Ref<ToolError | null> = ref(null);
  var successMessage = ref("");

  var hasError = computed(function computeHasError() {
    return error.value !== null;
  });

  var hasSuccess = computed(function computeHasSuccess() {
    return successMessage.value !== "";
  });

  function setLoading(loading: boolean): void {
    isLoading.value = loading;
  }

  function setError(err: ToolError | string | null): void {
    if (typeof err === "string") {
      error.value = { message: err };
    } else {
      error.value = err;
    }
    if (err) {
      successMessage.value = "";
      logger.error("Error: " + (typeof err === "string" ? err : err.message));
    }
  }

  function setSuccess(message: string): void {
    successMessage.value = message;
    error.value = null;
    logger.debug("Success: " + message);
  }

  function clearMessages(): void {
    error.value = null;
    successMessage.value = "";
  }

  function reset(): void {
    isLoading.value = false;
    error.value = null;
    successMessage.value = "";
  }

  return {
    isLoading,
    error,
    successMessage,
    hasError,
    hasSuccess,
    setLoading,
    setError,
    setSuccess,
    clearMessages,
    reset,
    logger,
  };
}
