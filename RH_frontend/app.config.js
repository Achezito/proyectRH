// app.config.js
export default ({ config }) => {
  const environment = process.env.APP_ENV || "development";

  const envConfigs = {
    development: {
      supabaseUrl: "https://rtwcoftbxtqnpheakuuu.supabase.co",
      supabaseAnonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDU5MjMsImV4cCI6MjA2ODEyMTkyM30.ZmZ69YPEoNVA2r6x8zbkdYvUgO-PnaOrjmrNgEKGbWM", // Obtener de Dashboard → API
      apiBaseUrl: "http://10.194.1.108:5000",
      environment: "development",
    },
    production: {
      // IMPORTANTE: Crear proyecto nuevo para producción
      supabaseUrl: "https://[TU-PROYECTO-PROD].supabase.co",
      supabaseAnonKey: "TU_ANON_KEY_PROD", // Key DIFERENTE
      apiBaseUrl: "https://tu-dominio-real.com",
      environment: "production",
    },
  };

  return {
    ...config,
    extra: {
      ...config.extra,
      ...envConfigs[environment],
    },
  };
};
