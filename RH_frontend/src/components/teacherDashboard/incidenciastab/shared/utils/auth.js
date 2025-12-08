import AsyncStorage from "@react-native-async-storage/async-storage";
import { jwtDecode } from "jwt-decode";
import { Alert } from "react-native"; // <-- IMPORTAR ALERT

// Claves para almacenamiento
const AUTH_TOKEN_KEY = "auth_token_data";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_DATA_KEY = "user_data";

// Variable para evitar múltiples refrescos simultáneos
let isRefreshing = false;
let refreshPromise = null;

// En auth.js
export const getAuthToken = async () => {
  try {
    const tokenData = await AsyncStorage.getItem(AUTH_TOKEN_KEY);

    if (!tokenData) {
      console.log("⚠️ No hay token almacenado");
      return null; // ← Devuelve null en lugar de string vacío
    }

    const parsed = JSON.parse(tokenData);
    const { access_token, expires_at, token_type } = parsed;

    if (!access_token) {
      console.log("⚠️ Token no encontrado en datos");
      return null;
    }

    // Devuelve SOLO el access_token, sin "Bearer"
    return access_token;
  } catch (error) {
    console.error("❌ Error obteniendo token:", error);
    return null;
  }
};

const handleLegacyToken = async (tokenData) => {
  const { access_token, expires_at, token_type } = tokenData;
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = expires_at || 0;

  if (expiresAt && now >= expiresAt) {
    console.log("❌ Token legacy expirado");
    const refreshed = await attemptTokenRefresh();
    if (refreshed) {
      const newTokenData = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const newParsed = newTokenData ? JSON.parse(newTokenData) : null;
      return `${newParsed?.token_type || "bearer"} ${newParsed?.access_token}`;
    }
    return "";
  }

  return `${token_type || "bearer"} ${access_token}`;
};

// Intentar refrescar el token usando tu endpoint de refresh
const attemptTokenRefresh = async () => {
  // Prevenir múltiples refrescos simultáneos
  if (isRefreshing && refreshPromise) {
    console.log("🔄 Ya se está refrescando, esperando...");
    return await refreshPromise;
  }

  isRefreshing = true;

  refreshPromise = (async () => {
    try {
      const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);

      if (!refreshToken) {
        console.log("⚠️ No hay refresh token disponible");
        return false;
      }

      console.log("🔄 Intentando refrescar token...");

      // IMPORTANTE: Verifica que esta URL sea correcta para tu backend
      const response = await fetch("http://172.18.4.188:5000/auth/refresh", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        console.log("❌ Error refrescando token:", response.status);

        // Si es error 401, el refresh token también expiró
        if (response.status === 401) {
          console.log("🔐 Refresh token expirado, cerrando sesión...");
          await clearAuthData();
          // Mostrar alerta al usuario
          Alert.alert(
            "Sesión Expirada",
            "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
            [{ text: "OK" }]
          );
        }

        return false;
      }

      const newTokenData = await response.json();
      console.log("✅ Nuevos datos recibidos:", Object.keys(newTokenData));

      // Guardar el nuevo token
      await saveAuthData(newTokenData);
      console.log("✅ Token refrescado exitosamente");
      return true;
    } catch (error) {
      console.error("❌ Error en attemptTokenRefresh:", error.message);
      return false;
    } finally {
      isRefreshing = false;
      refreshPromise = null;
    }
  })();

  return await refreshPromise;
};

// Guardar datos de autenticación después del login
export const saveAuthData = async (authResponse) => {
  try {
    const { access_token, refresh_token, expires_at, token_type, user } =
      authResponse;

    console.log("💾 Guardando auth data:", {
      access_token: access_token ? "Presente" : "Ausente",
      refresh_token: refresh_token ? "Presente" : "Ausente",
      token_type,
      expires_at,
    });

    // Guardar token principal
    await AsyncStorage.setItem(
      AUTH_TOKEN_KEY,
      JSON.stringify({
        access_token,
        expires_at,
        token_type, // Mantener el tipo que envía el backend
      })
    );

    // Guardar refresh token por separado
    if (refresh_token) {
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refresh_token);
    }

    // Guardar datos del usuario
    if (user) {
      await AsyncStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    }

    console.log("✅ Datos de autenticación guardados en AsyncStorage");
    return true;
  } catch (error) {
    console.error("❌ Error guardando datos de autenticación:", error.message);
    return false;
  }
};

// Limpiar datos de autenticación
export const clearAuthData = async () => {
  try {
    await AsyncStorage.multiRemove([
      AUTH_TOKEN_KEY,
      REFRESH_TOKEN_KEY,
      USER_DATA_KEY,
    ]);
    console.log("🧹 Datos de autenticación limpiados");
    return true;
  } catch (error) {
    console.error("❌ Error limpiando datos:", error.message);
    return false;
  }
};

// Obtener datos del usuario
export const getUserData = async () => {
  try {
    const userData = await AsyncStorage.getItem(USER_DATA_KEY);
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error("❌ Error obteniendo datos de usuario:", error.message);
    return null;
  }
};

// Verificar si hay sesión activa
export const isAuthenticated = async () => {
  const token = await getAuthToken();
  return !!token && token !== "";
};

// Función helper para fetch con manejo automático de token
export const fetchWithAuth = async (url, options = {}) => {
  try {
    const token = await getAuthToken();

    if (!token) {
      throw new Error("No hay token de autenticación disponible");
    }

    console.log("🔑 Usando token:", token.substring(0, 30) + "...");

    const headers = {
      Authorization: token,
      "Content-Type": "application/json",
      ...options.headers,
    };

    console.log("🌐 Haciendo request a:", url);
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Si la respuesta es 401, intentar refrescar y reintentar
    if (response.status === 401) {
      console.log("🔐 Token inválido (401), intentando refrescar...");

      const refreshed = await attemptTokenRefresh();
      if (refreshed) {
        // Obtener nuevo token
        const newToken = await getAuthToken();

        if (!newToken) {
          throw new Error("No se pudo obtener nuevo token después del refresh");
        }

        // Reintentar la request con el nuevo token
        console.log("🔄 Reintentando request con nuevo token...");
        const newResponse = await fetch(url, {
          ...options,
          headers: {
            ...headers,
            Authorization: newToken,
          },
        });

        return newResponse;
      } else {
        throw new Error(
          "Sesión expirada. Por favor, inicia sesión nuevamente."
        );
      }
    }

    return response;
  } catch (error) {
    console.error("❌ Error en fetchWithAuth:", error.message);
    throw error;
  }
};
