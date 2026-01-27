import log from "loglevel";

// Configure loglevel based on environment
if (typeof import.meta !== "undefined" && import.meta.env?.DEV) {
  log.setLevel("debug");
} else {
  log.setLevel("warn");
}

export function useLogger(prefix?: string) {
  var formatMessage = function formatMessage(msg: string) {
    return prefix ? "[" + prefix + "] " + msg : msg;
  };

  return {
    debug: function debug(msg: string, ...args: unknown[]) {
      log.debug(formatMessage(msg), ...args);
    },
    info: function info(msg: string, ...args: unknown[]) {
      log.info(formatMessage(msg), ...args);
    },
    warn: function warn(msg: string, ...args: unknown[]) {
      log.warn(formatMessage(msg), ...args);
    },
    error: function error(msg: string, ...args: unknown[]) {
      log.error(formatMessage(msg), ...args);
    },
  };
}
