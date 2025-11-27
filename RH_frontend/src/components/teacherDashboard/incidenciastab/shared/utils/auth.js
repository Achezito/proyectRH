import AsyncStorage from "@react-native-async-storage/async-storage";

export const getAuthToken = async () => {
  try {
    const tokenData = await AsyncStorage.getItem(
      "sb-iltnubfjvyprcdujhkqi-auth-token"
    );
    if (tokenData) {
      const parsed = JSON.parse(tokenData);
      return parsed.access_token;
    }
    return "";
  } catch (error) {
    console.error("❌ Error obteniendo token:", error);
    return "";
  }
};
