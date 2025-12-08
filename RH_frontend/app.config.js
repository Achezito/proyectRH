// app.config.js
export default ({ config }) => {
  const environment = process.env.APP_ENV || "development";

  const envConfigs = {
    development: {
      supabaseUrl: "https://rtwcoftbxtqnpheakuuu.supabase.co",
      supabaseAnonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDU5MjMsImV4cCI6MjA2ODEyMTkyM30.ZmZ69YPEoNVA2r6x8zbkdYvUgO-PnaOrjmrNgEKGbWM",
      apiBaseUrl: "http://10.194.1.108:5000",
      environment: "development",
    },
    production: {
      // PARA GITHUB PAGES - usa las mismas credenciales o cambia
      supabaseUrl: "https://rtwcoftbxtqnpheakuuu.supabase.co",
      supabaseAnonKey:
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ0d2NvZnRieHRxbnBoZWFrdXV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDU5MjMsImV4cCI6MjA2ODEyMTkyM30.ZmZ69YPEoNVA2r6x8zbkdYvUgO-PnaOrjmrNgEKGbWM",
      apiBaseUrl: "http://10.194.1.108:5000", // O tu backend real
      environment: "production",
    },
  };

  const selectedConfig = envConfigs[environment];

  return {
    ...config,
    // IMPORTANTE: Configuración para GitHub Pages
    web: {
      ...config.web,
      bundler: "metro",
      output: "static",
      baseUrl: "/proyectRH", // Base path para GitHub Pages
    },
    experiments: {
      typedRoutes: true,
    },
    extra: {
      ...config.extra,
      ...selectedConfig,
    },
  };
};
