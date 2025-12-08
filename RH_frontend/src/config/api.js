// config/api.js
import CONFIG from "./index";

// URL del backend - YA FUNCIONAL CON TU CONFIG
export const API_BASE_URL = CONFIG.apiBaseUrl;

export const isDevelopment = CONFIG.isDevelopment;
export const isProduction = CONFIG.isProduction;

// Configuración de Supabase
export const supabaseConfig = {
  url: CONFIG.supabaseUrl,
  anonKey: CONFIG.supabaseAnonKey,
};

// Función helper para llamadas API
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;

  const defaultOptions = {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 30000,
  };

  const response = await fetch(url, { ...defaultOptions, ...options });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
};
