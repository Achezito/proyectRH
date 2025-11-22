import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons, Feather } from "@expo/vector-icons";
import { styles } from "./styles";

const ProfileTab = ({ userData, docenteId }) => {
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: userData?.nombre || "",
    apellido: userData?.apellido || "",
    correo_institucional: userData?.correo_institucional || "",
    docencia: userData?.docencia || "",
    cumpleaños: userData?.cumpleaños || "",
    tipo_contrato: userData?.tipo_contrato || "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleChangePassword = async () => {
    console.log("🔐 Iniciando cambio de contraseña...");

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

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>¡Bienvenido de vuelta!</Text>
        <Text style={styles.welcomeSubtitle}>
          Gestiona tu perfil y configuración
        </Text>
      </View>

      {/* PERSONAL INFO CARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="person-outline" size={24} color="#4f46e5" />
          <Text style={styles.cardTitle}>Información Personal</Text>
        </View>

        <View style={styles.formGrid}>
          {Object.entries(formData).map(([key, value]) => (
            <View key={key} style={styles.inputContainer}>
              <Text style={styles.label}>
                {key.charAt(0).toUpperCase() + key.slice(1).replace("_", " ")}
              </Text>
              <TextInput
                style={styles.input}
                editable={false}
                value={value}
                placeholderTextColor="#94a3b8"
              />
            </View>
          ))}
        </View>
      </View>

      {/* CHANGE PASSWORD CARD */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <MaterialIcons name="lock-outline" size={24} color="#4f46e5" />
          <Text style={styles.cardTitle}>Cambiar Contraseña</Text>
        </View>

        <View style={styles.formGrid}>
          {[
            ["Contraseña actual", "currentPassword"],
            ["Nueva contraseña", "newPassword"],
            ["Confirmar contraseña", "confirmPassword"],
          ].map(([label, key]) => (
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
              <Text style={styles.primaryButtonText}>
                Actualizar Contraseña
              </Text>
              <Feather name="arrow-right" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default ProfileTab;
