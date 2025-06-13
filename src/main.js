import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import log from 'loglevel';

function initializeApp() {
  var app = createApp(App);
  app.mount("#app");
}

function registerServiceWorker() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("/sw.js")
      .then(function onSuccess(registration) {
        log.info("SW registered: ", registration);
      })
      .catch(function onError(registrationError) {
        log.warn("SW registration failed: ", registrationError);
      });
  }
}

// Use requestIdleCallback to defer non-critical work
function deferNonCriticalWork() {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(registerServiceWorker);
  } else {
    setTimeout(registerServiceWorker, 100);
  }
}

// Initialize app immediately
initializeApp();

// Defer service worker registration
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", deferNonCriticalWork);
} else {
  deferNonCriticalWork();
}
