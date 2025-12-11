import log from "loglevel";

log.setDefaultLevel(import.meta.env.DEV ? "debug" : "warn");

if (import.meta.env.VITE_LOG_LEVEL) {
  log.setLevel(import.meta.env.VITE_LOG_LEVEL);
}

export default log;
