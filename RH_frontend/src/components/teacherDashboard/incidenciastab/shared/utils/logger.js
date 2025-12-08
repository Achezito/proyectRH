// utils/logger.js
class Logger {
  static isDevelopment = __DEV__; // React Native
  // o para web: static isDevelopment = process.env.NODE_ENV === 'development';

  static levels = {
    ERROR: "error",
    WARN: "warn",
    INFO: "info",
    DEBUG: "debug",
  };

  static currentLevel = Logger.isDevelopment
    ? Logger.levels.DEBUG
    : Logger.levels.ERROR;

  static shouldLog(level) {
    const priorities = [
      Logger.levels.ERROR,
      Logger.levels.WARN,
      Logger.levels.INFO,
      Logger.levels.DEBUG,
    ];
    return priorities.indexOf(level) <= priorities.indexOf(Logger.currentLevel);
  }

  static error(tag, message, data = null) {
    if (Logger.shouldLog(Logger.levels.ERROR)) {
      console.error(`[❌ ERROR - ${tag}] ${message}`, data || "");
    }
  }

  static warn(tag, message, data = null) {
    if (Logger.shouldLog(Logger.levels.WARN)) {
      console.warn(`[⚠️ WARN - ${tag}] ${message}`, data || "");
    }
  }

  static info(tag, message, data = null) {
    if (Logger.shouldLog(Logger.levels.INFO)) {
      console.info(`[ℹ️ INFO - ${tag}] ${message}`, data || "");
    }
  }

  static debug(tag, message, data = null) {
    if (Logger.shouldLog(Logger.levels.DEBUG)) {
      console.log(`[🐛 DEBUG - ${tag}] ${message}`, data || "");
    }
  }

  // Para requests HTTP
  static api(tag, method, url, status, data = null) {
    const emoji = status >= 200 && status < 300 ? "✅" : "❌";
    if (Logger.shouldLog(Logger.levels.DEBUG)) {
      console.log(
        `[🌐 API - ${tag}] ${emoji} ${method} ${url} - ${status}`,
        data || ""
      );
    }
  }
}

export default Logger;
