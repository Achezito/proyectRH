// config/index.js
import Constants from "expo-constants";

// Configuración para todos los entornos
const CONFIG = {
  // Configuración desde app.config.js
  ...Constants.expoConfig.extra,

  // Detección más robusta del entorno
  isDevelopment:
    __DEV__ || Constants.expoConfig.extra?.environment === "development",
  isProduction:
    !__DEV__ || Constants.expoConfig.extra?.environment === "production",
};

// Validación
if (!CONFIG.supabaseUrl || !CONFIG.supabaseAnonKey) {
  console.warn("⚠️ Missing Supabase configuration in app.config.js");
}

export default CONFIG;
