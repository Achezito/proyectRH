const createExpoWebpackConfigAsync = require("@expo/webpack-config");

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Alias para react-native-vector-icons
  config.resolve = {
    ...config.resolve,
    alias: {
      ...config.resolve.alias,
      "react-native-vector-icons": "react-native-vector-icons/dist/VectorIcons",
      "react-native-vector-icons/MaterialIcons":
        "@expo/vector-icons/MaterialIcons",
      "react-native-vector-icons/Ionicons": "@expo/vector-icons/Ionicons",
      "react-native-vector-icons/Feather": "@expo/vector-icons/Feather",
      "react-native-vector-icons/FontAwesome": "@expo/vector-icons/FontAwesome",
      "react-native-vector-icons/FontAwesome5":
        "@expo/vector-icons/FontAwesome5",
      "react-native-vector-icons/Entypo": "@expo/vector-icons/Entypo",
      "react-native-vector-icons/MaterialCommunityIcons":
        "@expo/vector-icons/MaterialCommunityIcons",
    },
  };

  return config;
};
