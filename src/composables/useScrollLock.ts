import { ref, watch } from "vue";

export function useScrollLock() {
  var isLocked = ref(false);

  watch(isLocked, function handleLockChange(locked) {
    document.body.style.overflow = locked ? "hidden" : "";
  });

  return {
    isLocked,
    lock: function lock() {
      isLocked.value = true;
    },
    unlock: function unlock() {
      isLocked.value = false;
    },
    toggle: function toggle() {
      isLocked.value = !isLocked.value;
    },
  };
}
