<script setup lang="ts">
defineProps<{
  progress: number;
  downloadedMB?: number;
  totalMB?: number;
}>();
</script>

<template>
  <div class="ai-loading-bar">
    <div class="ai-loading-bar__header">
      <slot>
        <span class="ai-loading-bar__text">
          Downloading AI model...
          <span v-if="downloadedMB !== undefined && totalMB !== undefined">
            {{ downloadedMB }} MB / {{ totalMB }} MB
          </span>
        </span>
      </slot>
    </div>
    <div class="ai-loading-bar__track">
      <div
        class="ai-loading-bar__fill"
        :style="{ width: `${Math.min(100, Math.max(0, progress))}%` }"
      ></div>
    </div>
  </div>
</template>

<style scoped>
.ai-loading-bar {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
}

.ai-loading-bar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.ai-loading-bar__text {
  font-size: var(--text-sm);
  color: var(--color-text-muted);
}

.ai-loading-bar__track {
  width: 100%;
  height: 4px;
  background: var(--color-border);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.ai-loading-bar__fill {
  height: 100%;
  background: linear-gradient(
    90deg,
    var(--color-accent) 0%,
    var(--color-accent-light) 100%
  );
  border-radius: var(--radius-full);
  transition: width var(--transition-fast);
}
</style>
