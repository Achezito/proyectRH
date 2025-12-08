import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  Alert,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, Feather, MaterialIcons } from "@expo/vector-icons";
import { supabase } from "C:/Users/Hpp/Desktop/proyectRH/RH_frontend/supabaseClient.js"; // Asegúrate de tener configurado supabaseClient.js

const API_BASE_URL = "http://172.18.4.188:5000/docente";

export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [docenteId, setDocenteId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("profile");
  const [changingPassword, setChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo_institucional: "",
    docencia: "",
    cumpleaños: "",
    tipo_contrato: "",
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    loadTeacherId();
  }, []);

  const loadTeacherId = async () => {
    try {
      const id = await AsyncStorage.getItem("docenteId");
      if (id) {
        setDocenteId(parseInt(id));
        loadTeacherData(parseInt(id));
      } else {
        setLoading(false);
      }
    } catch (e) {
      setLoading(false);
    }
  };

  const loadTeacherData = async (id) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/docentes/${id}`);
      const data = await res.json();
      if (res.ok) {
        setUserData(data);
        setFormData({
          nombre: data.nombre,
          apellido: data.apellido,
          correo_institucional: data.correo_institucional,
          docencia: data.docencia,
          cumpleaños: data.cumpleaños,
          tipo_contrato: data.tipo_contrato,
        });
      }
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    console.log("🔐 Iniciando cambio de contraseña...");

    // Validaciones...
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

      console.log("📤 Request body:", requestBody);

      const url = `http://10.194.1.108:5000/docente/api/docentes/cambiar-contrasena`;
      console.log("📤 Enviando solicitud a:", url);

      // QUITA el timeout por ahora
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
        // signal: controller.signal,  // ← Quita esta línea
      });

      console.log("📥 Respuesta recibida. Status:", response.status);

      const result = await response.json();
      console.log("Resultado del servidor:", result);

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

      if (error.name === "AbortError") {
        Alert.alert(
          "Error",
          "El servidor está tardando demasiado en responder."
        );
      } else {
        Alert.alert("Error", "Error: " + error.message);
      }
    } finally {
      setChangingPassword(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("docenteId");
      Alert.alert("Sesión cerrada", "Has cerrado sesión exitosamente");
      // Aquí deberías navegar a la pantalla de login
      // navigation.navigate('Login');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Cargando datos del docente...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />

      {/* SIDEBAR MEJORADO */}
      {sidebarOpen && (
        <View style={styles.sidebar}>
          <View style={styles.sidebarHeader}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userData?.nombre?.charAt(0)}
                {userData?.apellido?.charAt(0)}
              </Text>
            </View>
            <Text style={styles.sidebarTitle}>Panel Docente</Text>
            <Text style={styles.sidebarSubtitle}>
              {userData?.tipo_contrato || "Docente"}
            </Text>
          </View>

          <View style={styles.sidebarMenu}>
            <TouchableOpacity
              style={[
                styles.sidebarBtn,
                activeTab === "profile" && styles.sidebarBtnActive,
              ]}
              onPress={() => setActiveTab("profile")}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={activeTab === "profile" ? "#4f46e5" : "#64748b"}
              />
              <Text
                style={[
                  styles.sidebarText,
                  activeTab === "profile" && styles.sidebarTextActive,
                ]}
              >
                Mi Perfil
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarBtn}>
              <Ionicons name="calendar-outline" size={20} color="#64748b" />
              <Text style={styles.sidebarText}>Horarios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.sidebarBtn}>
              <Ionicons name="school-outline" size={20} color="#64748b" />
              <Text style={styles.sidebarText}>Mis Cursos</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sidebarBtn, styles.logoutBtn]}
              onPress={handleLogout}
            >
              <Ionicons name="log-out-outline" size={20} color="#ef4444" />
              <Text style={[styles.sidebarText, styles.logoutText]}>
                Cerrar Sesión
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* MAIN CONTENT */}
      <View style={styles.main}>
        {/* HEADER MEJORADO */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              style={styles.menuButton}
              onPress={() => setSidebarOpen(!sidebarOpen)}
            >
              <Feather
                name={sidebarOpen ? "x" : "menu"}
                size={24}
                color="#4f46e5"
              />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerName}>
                {userData?.nombre_completo || "Docente"}
              </Text>
              <Text style={styles.headerRole}>
                {userData?.tipo_contrato || "Docente"}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.notificationButton}>
            <Ionicons name="notifications-outline" size={24} color="#4f46e5" />
          </TouchableOpacity>
        </View>

        {/* CONTENT */}
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
                    {key.charAt(0).toUpperCase() +
                      key.slice(1).replace("_", " ")}
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
      </View>
    </View>
  );
}

/* ------------------ ESTILOS MEJORADOS ------------------ */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#f8fafc",
  },
  sidebar: {
    width: 280,
    backgroundColor: "white",
    paddingTop: 60,
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sidebarHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  sidebarMenu: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  sidebarBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  sidebarBtnActive: {
    backgroundColor: "#f1f5f9",
  },
  sidebarText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  sidebarTextActive: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  logoutBtn: {
    marginTop: 20,
  },
  logoutText: {
    color: "#ef4444",
  },
  main: {
    flex: 1,
  },
  header: {
    height: 80,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  headerTextContainer: {
    gap: 2,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerRole: {
    fontSize: 14,
    color: "#64748b",
  },
  notificationButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
  scroll: {
    padding: 25,
  },
  welcomeSection: {
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 8,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#64748b",
  },
  card: {
    backgroundColor: "white",
    padding: 25,
    borderRadius: 16,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  formGrid: {
    gap: 16,
  },
  inputContainer: {
    gap: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  editableInput: {
    backgroundColor: "white",
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowColor: "#9ca3af",
  },
  primaryButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#64748b",
  },
});
