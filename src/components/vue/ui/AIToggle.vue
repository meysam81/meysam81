<script setup lang="ts">
defineProps<{
  modelValue: boolean;
  disabled?: boolean;
}>();

var emit = defineEmits<{
  "update:modelValue": [value: boolean];
}>();

function handleToggle(event: Event) {
  var target = event.target as HTMLInputElement;
  emit("update:modelValue", target.checked);
}
</script>

<template>
  <div class="ai-toggle">
    <label class="ai-toggle__label">
      <input
        type="checkbox"
        class="ai-toggle__input"
        :checked="modelValue"
        :disabled="disabled"
        @change="handleToggle"
      />
      <span class="ai-toggle__switch"></span>
      <span class="ai-toggle__content">
        <svg
          class="ai-toggle__icon"
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path
            d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
          />
        </svg>
        <span class="ai-toggle__text">AI Mode</span>
      </span>
    </label>
    <span class="ai-toggle__privacy">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="12"
        height="12"
        viewBox="0 0 24 24"
        fill="currentColor"
      >
        <path
          d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"
        />
      </svg>
      Local only
    </span>
  </div>
</template>

<style scoped>
.ai-toggle {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.ai-toggle__label {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  cursor: pointer;
}

.ai-toggle__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.ai-toggle__switch {
  position: relative;
  width: 44px;
  height: 24px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  transition: background var(--transition-fast);
}

.ai-toggle__switch::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background: var(--color-text);
  border-radius: var(--radius-full);
  transition: transform var(--transition-fast);
}

.ai-toggle__input:checked + .ai-toggle__switch {
  background: var(--color-accent);
}

.ai-toggle__input:checked + .ai-toggle__switch::after {
  transform: translateX(20px);
}

.ai-toggle__input:disabled + .ai-toggle__switch {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-toggle__input:focus-visible + .ai-toggle__switch {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
}

.ai-toggle__content {
  display: flex;
  align-items: center;
  gap: var(--space-xxs);
}

.ai-toggle__icon {
  color: var(--color-accent-light);
}

.ai-toggle__text {
  font-size: var(--text-sm);
  font-weight: 500;
  color: var(--color-text);
}

.ai-toggle__privacy {
  display: flex;
  align-items: center;
  gap: var(--space-xxxs);
  font-size: var(--text-xs);
  color: var(--color-text-muted);
  background: var(--color-success-bg-subtle);
  padding: var(--space-xxxs) var(--space-xs);
  border-radius: var(--radius-full);
}

.ai-toggle__privacy svg {
  color: var(--color-success);
}
</style>
