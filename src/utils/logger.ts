import log from "loglevel";

log.setDefaultLevel(log.levels.WARN);

if (import.meta.env.DEV) {
  log.setLevel(log.levels.DEBUG);
}

export default log;
