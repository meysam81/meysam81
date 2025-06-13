import { createApp } from "vue";
import App from "./App.vue";
import "./style.css";
import log from "loglevel";

if (import.meta.env.DEV) {
  log.setDefaultLevel("debug");
} else {
  log.setDefaultLevel("warn");
}

log.info("🚀 Professional CV Portfolio - Initializing Meysam Azad's application...");

function initializeApp() {
  var app = createApp(App);

  app.config.errorHandler = function handleError(err, instance, info) {
    log.error("Application error:", err, info);
  };

  app.config.warnHandler = function handleWarn(msg, instance, trace) {
    if (import.meta.env.DEV) {
      log.warn("Application warning:", msg, trace);
    }
  };

  app.config.performance = true;

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

log.info("✨ CV Portfolio successfully mounted and ready for professional presentation");
