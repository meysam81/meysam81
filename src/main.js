import log from "loglevel";

log.setLevel("info");

if (import.meta.env.DEV) {
  log.setLevel("debug");
}
