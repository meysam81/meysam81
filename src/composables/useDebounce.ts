import { ref, watch, type Ref } from "vue";

export function useDebounce<T>(value: Ref<T>, delay: number = 300): Ref<T> {
  var debouncedValue = ref(value.value) as Ref<T>;
  var timeout: ReturnType<typeof setTimeout> | null = null;

  watch(value, function handleValueChange(newValue) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function updateDebounced() {
      debouncedValue.value = newValue;
    }, delay);
  });

  return debouncedValue;
}

export function useDebounceFn<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number = 300,
): T {
  var timeout: ReturnType<typeof setTimeout> | null = null;

  return function debouncedFn(this: unknown, ...args: Parameters<T>) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function executeFn() {
      fn.apply(this, args);
    }, delay);
  } as T;
}
