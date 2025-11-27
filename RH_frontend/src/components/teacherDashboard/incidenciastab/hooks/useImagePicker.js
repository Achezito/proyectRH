import { useState } from "react";
import * as ImagePicker from "expo-image-picker";

export const useImagePicker = () => {
  const [image, setImage] = useState(null);

  const pickImage = async () => {
    try {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permisos de galería denegados");
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: "images",
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setImage(result.assets[0]);
        return result.assets[0];
      }
      return null;
    } catch (error) {
      console.error("Error en pickImage:", error);
      throw error;
    }
  };

  const clearImage = () => setImage(null);

  return {
    image,
    pickImage,
    clearImage,
  };
};
