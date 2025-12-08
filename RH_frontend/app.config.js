// app.config.js
module.exports = {
  expo: {
    name: "RH_frontend",
    slug: "RH_frontend",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "webpack",
    },
    plugins: ["expo-router"],

    // AQUÍ ESTÁ LO IMPORTANTE - CONFIGURACIÓN PARA PRODUCCIÓN
    extra: {
      environment: "production", // Cambiar a "production"

      // Backend Flask API - PRODUCCIÓN
      apiBaseUrl: "https://rh-backend-4hb7.onrender.com",

      // Supabase - usar las mismas credenciales que el backend
      supabaseUrl: "https://rtwcoftbxtqnpheakuuu.supabase.co",
      supabaseAnonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjU0NTkyMywiZXhwIjoyMDY4MTIxOTIzfQ.4qNCzAjJ99W6tFz-YlLAWp7ZD9yAgPBFrpDix3D-C34", // REEMPLAZAR con tu key real
    },
  },
};
