<script setup lang="ts">
import { computed } from "vue";

interface Props {
  tier?: "chrome" | "local" | "remote" | null;
}

var props = withDefaults(defineProps<Props>(), {
  tier: null,
});

var noticeConfig = computed(function computeNoticeConfig() {
  switch (props.tier) {
    case "chrome":
      return {
        icon: "lock",
        text: "Chrome AI · 100% local",
        variant: "local",
      };
    case "local":
      return {
        icon: "lock",
        text: "100% local · Nothing leaves your browser",
        variant: "local",
      };
    case "remote":
      return {
        icon: "cloud",
        text: "Remote AI · Data sent to server",
        variant: "remote",
      };
    default:
      return {
        icon: "lock",
        text: "100% local · Nothing leaves your browser",
        variant: "local",
      };
  }
});
</script>

<template>
  <div
    class="ai-privacy-notice"
    :class="`ai-privacy-notice--${noticeConfig.variant}`"
  >
    <!-- Lock icon for local -->
    <svg
      v-if="noticeConfig.icon === 'lock'"
      class="ai-privacy-notice__icon"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
      />
    </svg>
    <!-- Cloud icon for remote -->
    <svg
      v-else-if="noticeConfig.icon === 'cloud'"
      class="ai-privacy-notice__icon"
      xmlns="http://www.w3.org/2000/svg"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <path
        d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
      />
    </svg>
    <span class="ai-privacy-notice__text">
      {{ noticeConfig.text }}
    </span>
  </div>
</template>

<style scoped>
.ai-privacy-notice {
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  padding: var(--space-xxs) var(--space-xs);
  background: var(--color-bg-elevated);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.ai-privacy-notice--local .ai-privacy-notice__icon {
  color: var(--color-success, #10b981);
}

.ai-privacy-notice--remote {
  border-color: color-mix(in srgb, #f59e0b 30%, var(--color-border));
  background: color-mix(in srgb, #f59e0b 5%, var(--color-bg-elevated));
}

.ai-privacy-notice--remote .ai-privacy-notice__icon {
  color: #f59e0b;
}

.ai-privacy-notice__icon {
  flex-shrink: 0;
}

.ai-privacy-notice__text {
  white-space: nowrap;
}
</style>
