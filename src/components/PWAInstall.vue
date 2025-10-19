<template>
  <button
    v-if="showInstallPrompt"
    @click="installPWA"
    class="btn-primary animate-float"
    aria-label="Install as app"
  >
    📱 Install App
  </button>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import log from 'loglevel';

const deferredPrompt = ref(null);
const showInstallPrompt = ref(false);

function installPWA() {
  if (deferredPrompt.value) {
    deferredPrompt.value.prompt();
    deferredPrompt.value.userChoice.then((choiceResult) => {
      if (choiceResult.outcome === 'accepted') {
        log.info('User accepted the install prompt');
      }
      deferredPrompt.value = null;
      showInstallPrompt.value = false;
    });
  }
}

function handleBeforeInstallPrompt(e) {
  e.preventDefault();
  deferredPrompt.value = e;
  showInstallPrompt.value = true;
}

function handleAppInstalled() {
  log.info('PWA was installed');
  showInstallPrompt.value = false;
  deferredPrompt.value = null;
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  window.addEventListener('appinstalled', handleAppInstalled);
});
</script>
