import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { Building2, AlertCircle } from "lucide-react-native";
import { useAuth } from "../context/AuthContext";
import { SafeAreaView } from "react-native-safe-area-context";
import { API_BASE_URL } from "../config/api";

export default function LoginPage() {
  const navigation = useNavigation();
  const { setUser, setUserStatus } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 403) {
          if (data.error.includes("pendiente")) {
            setUser(null);
            setUserStatus("pending");
            setError(
              "Tu cuenta está en revisión. Espera la aprobación del administrador."
            );
            return;
          }

          if (data.error.includes("rechazada")) {
            setUser(null);
            setUserStatus("rejected");
            setError("Tu cuenta fue rechazada. Contacta al administrador.");
            return;
          }

          throw new Error(data.error || "Error de autenticación");
        }

        throw new Error(data.error || "Error en la solicitud");
      }

      if (data.user && data.user.id) {
        await AsyncStorage.setItem(
          "docenteId",
          data.user.docente_id.toString()
        );
        await AsyncStorage.setItem("userId", data.user.id);
        await AsyncStorage.setItem("userEmail", data.user.email);

        if (data.access_token) {
          const tokenData = {
            access_token: data.access_token,
            refresh_token: data.refresh_token,
            expires_at: data.expires_at,
            token_type: data.token_type || "bearer",
          };
          await AsyncStorage.setItem(
            "auth_token_data",
            JSON.stringify(tokenData)
          );

          if (data.refresh_token) {
            await AsyncStorage.setItem("refresh_token", data.refresh_token);
          }
        }
      } else {
        throw new Error("No se pudo obtener la información del usuario");
      }

      setUser({
        ...data.user,
        rol_id: data.user.rol_id,
      });
      setUserStatus(data.user.estado);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Error al conectar con el servidor"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    if (!email || !password) {
      setError("Por favor completa todos los campos");
      return;
    }
    handleLogin();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.logoContainer}>
                <Building2 size={40} color="#fff" />
              </View>
              <Text style={styles.title}>Iniciar Sesión</Text>
              <Text style={styles.subtitle}>
                Sistema de Gestión de Incidencias
              </Text>
            </View>

            <View style={styles.cardContent}>
              {error ? (
                <View
                  style={[
                    styles.alert,
                    error.includes("revisión") && {
                      backgroundColor: "#ecfdf5",
                      borderColor: "#a7f3d0",
                    },
                  ]}
                >
                  <AlertCircle
                    size={16}
                    color={error.includes("revisión") ? "#059669" : "#dc2626"}
                  />
                  <Text
                    style={[
                      styles.alertText,
                      error.includes("revisión") && { color: "#059669" },
                    ]}
                  >
                    {error}
                  </Text>
                </View>
              ) : null}

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Correo Electrónico</Text>
                <TextInput
                  style={[styles.input, isLoading && styles.inputDisabled]}
                  placeholder="correo@ejemplo.com"
                  placeholderTextColor="#9ca3af"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                  editable={!isLoading}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={[styles.input, isLoading && styles.inputDisabled]}
                  placeholder="••••••••"
                  placeholderTextColor="#9ca3af"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            <View style={styles.cardFooter}>
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSubmit}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <View style={styles.registerContainer}>
                <Text style={styles.registerText}>¿No tienes una cuenta? </Text>
                <TouchableOpacity
                  onPress={() => navigation.navigate("Register")}
                >
                  <Text style={styles.registerLink}>Registrarse</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 4,
    width: "100%",
    maxWidth: 400,
    alignSelf: "center",
  },
  cardHeader: {
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
  },
  logoContainer: {
    width: 64,
    height: 64,
    backgroundColor: "#ef4444",
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  cardContent: {
    padding: 24,
    paddingTop: 0,
  },
  alert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  alertText: {
    color: "#dc2626",
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  inputDisabled: {
    backgroundColor: "#f3f4f6",
    color: "#9ca3af",
  },
  cardFooter: {
    padding: 24,
    paddingTop: 0,
  },
  button: {
    backgroundColor: "#ef4444",
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: "#fca5a5",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  registerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  registerText: {
    fontSize: 14,
    color: "#6b7280",
  },
  registerLink: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
});
