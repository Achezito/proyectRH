export default ({ config }) => {
  const environment = process.env.APP_ENV || "development";

  const envConfigs = {
    development: {
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
      supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
      environment: "development",
    },
    production: {
      supabaseUrl: process.env.REACT_APP_SUPABASE_URL,
      supabaseAnonKey: process.env.REACT_APP_SUPABASE_ANON_KEY,
      apiBaseUrl: process.env.REACT_APP_API_BASE_URL,
      environment: "production",
    },
  };

  const selectedConfig = envConfigs[environment];

  return {
    ...config,
    web: {
      ...config.web,
      bundler: "metro",
      output: "static",
      baseUrl: "/proyectRH",
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
