// babel.config.js - REEMPLAZA TODO EL CONTENIDO con esto:
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      "react-native-reanimated/plugin",
      // Solo agrega plugins que realmente tengas instalados
    ],
  };
};
