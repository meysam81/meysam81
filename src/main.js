import { createApp } from "vue";
import App from "./App.vue";
import log from "loglevel";
import "./style.css";

var app = createApp(App);
app.mount("#app");

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function registerSW() {
    navigator.serviceWorker
      .register("/sw.js")
      .then(function onSuccess(registration) {
        log.info("SW registered: ", registration);
      })
      .catch(function onError(registrationError) {
        log.info("SW registration failed: ", registrationError);
      });
  });
}
