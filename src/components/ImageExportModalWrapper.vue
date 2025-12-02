<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import ImageExportModal from './ImageExportModal.vue';
import type { ValidationResult } from '@/utils/idea-validator';

const isOpen = ref(false);
const result = ref<ValidationResult | null>(null);
const ideaName = ref('');

function handleOpenModal(event: CustomEvent<{ result: ValidationResult; ideaName: string }>) {
  result.value = event.detail.result;
  ideaName.value = event.detail.ideaName;
  isOpen.value = true;
}

function handleClose() {
  isOpen.value = false;
}

onMounted(() => {
  window.addEventListener('open-image-export-modal', handleOpenModal as EventListener);
});

onUnmounted(() => {
  window.removeEventListener('open-image-export-modal', handleOpenModal as EventListener);
});
</script>

<template>
  <ImageExportModal
    :is-open="isOpen"
    :result="result"
    :idea-name="ideaName"
    @close="handleClose"
  />
</template>
