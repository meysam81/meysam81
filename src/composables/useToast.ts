import { ref, onUnmounted } from "vue";

/**
 * Composable for managing toast notification visibility.
 * Provides show/hide functionality with automatic timeout.
 *
 * @example
 * ```typescript
 * var toast = useToast();
 * toast.show("Link copied!");
 * // toast.visible.value is true for 2 seconds
 * ```
 */
export function useToast(duration: number = 2000) {
  var visible = ref(false);
  var message = ref("");
  var timeoutId: ReturnType<typeof setTimeout> | null = null;

  function clearToastTimeout(): void {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  }

  function show(msg: string = "Copied!"): void {
    clearToastTimeout();
    message.value = msg;
    visible.value = true;
    timeoutId = setTimeout(function hideToast() {
      visible.value = false;
    }, duration);
  }

  function hide(): void {
    clearToastTimeout();
    visible.value = false;
  }

  // Cleanup timeout on component unmount
  onUnmounted(clearToastTimeout);

  return {
    visible,
    message,
    show,
    hide,
  };
}
