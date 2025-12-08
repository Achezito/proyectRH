// config/api.js
import CONFIG from "./index";

// Si todavía necesitas Flask (migrando gradualmente)
export const API_BASE_URL =
  CONFIG.apiBaseUrl ||
  (CONFIG.isDevelopment
    ? "http://10.194.1.108:5000"
    : "https://tu-dominio-real.com");

export const isDevelopment = CONFIG.isDevelopment;
export const isProduction = CONFIG.isProduction;

// Configuración de Supabase (recomendado usar esto en lugar de Flask)
export const supabaseConfig = {
  url: CONFIG.supabaseUrl,
  anonKey: CONFIG.supabaseAnonKey,
};
