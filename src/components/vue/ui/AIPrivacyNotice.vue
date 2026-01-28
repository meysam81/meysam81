<script setup lang="ts"></script>

<template>
  <div class="ai-privacy-notice">
    <svg
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
    <span class="ai-privacy-notice__text">
      100% local · Nothing leaves your browser
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

.ai-privacy-notice__icon {
  color: var(--color-success);
  flex-shrink: 0;
}

.ai-privacy-notice__text {
  white-space: nowrap;
}
</style>
