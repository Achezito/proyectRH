import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { styles } from "./styles";

const ChangePasswordCard = ({ docenteId }) => {
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      Alert.alert("Error", "Por favor, completa todos los campos");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      Alert.alert("Error", "Las contraseñas nuevas no coinciden");
      return;
    }

    if (passwordData.newPassword.length < 8) {
      Alert.alert("Error", "La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setChangingPassword(true);

    try {
      const requestBody = {
        docente_id: docenteId,
        newPassword: passwordData.newPassword,
        confirmPassword: passwordData.confirmPassword,
      };

      const url = `http://10.194.1.108:5000/docente/api/docentes/cambiar-contrasena`;

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();

      if (response.ok) {
        Alert.alert(
          "Éxito",
          result.message || "Contraseña actualizada correctamente"
        );
        setPasswordData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        Alert.alert("Error", result.error || "Error al cambiar la contraseña");
      }
    } catch (error) {
      console.error("❌ Error detallado:", error);
      Alert.alert("Error", "Error: " + error.message);
    } finally {
      setChangingPassword(false);
    }
  };

  const passwordFields = [
    { label: "Contraseña actual", key: "currentPassword" },
    { label: "Nueva contraseña", key: "newPassword" },
    { label: "Confirmar contraseña", key: "confirmPassword" },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="lock-outline" size={24} color="#4f46e5" />
        <Text style={styles.cardTitle}>Cambiar Contraseña</Text>
      </View>

      <View style={styles.formGrid}>
        {passwordFields.map(({ label, key }) => (
          <View key={key} style={styles.inputContainer}>
            <Text style={styles.label}>{label}</Text>
            <TextInput
              secureTextEntry
              style={[styles.input, styles.editableInput]}
              value={passwordData[key]}
              onChangeText={(text) =>
                setPasswordData({ ...passwordData, [key]: text })
              }
              placeholder={`Ingresa tu ${label.toLowerCase()}`}
              placeholderTextColor="#94a3b8"
            />
          </View>
        ))}
      </View>

      <TouchableOpacity
        style={[
          styles.primaryButton,
          changingPassword && styles.primaryButtonDisabled,
        ]}
        onPress={handleChangePassword}
        disabled={changingPassword}
      >
        {changingPassword ? (
          <ActivityIndicator size="small" color="white" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Actualizar Contraseña</Text>
            <Feather name="arrow-right" size={20} color="white" />
          </>
        )}
      </TouchableOpacity>
    </View>
  );
};

export default ChangePasswordCard;
