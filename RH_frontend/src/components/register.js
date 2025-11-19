import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Building2, AlertCircle, CheckCircle2 } from "lucide-react-native";

export default function RegisterPage() {
  const navigation = useNavigation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [successMessage, setSuccessMessage] = useState("");

  const handleRegister = async () => {
    setError("");

    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("Por favor, completa todos los campos.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://10.194.1.108:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage(
          "Tu cuenta ha sido creada correctamente. Un administrador revisará tu solicitud."
        );
        setTimeout(() => {
          navigation.navigate("Login");
        }, 3000); // espera 3 segundos antes de redirigir
      } else {
        setError(data.message || "Error en el registro");
      }
    } catch (err) {
      console.error("Error en registro:", err);
      setError("Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = () => {
    handleRegister();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.cardHeader}>
            <View style={styles.logoContainer}>
              <Building2 size={40} color="#fff" />
            </View>
            <Text style={styles.title}>Registrarse</Text>
            <Text style={styles.subtitle}>
              Crea una cuenta para acceder al sistema
            </Text>
          </View>
          {successMessage ? (
            <View style={styles.success}>
              <CheckCircle2 size={16} color="#059669" />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.cardContent}>
            {error ? (
              <View style={styles.alert}>
                <AlertCircle size={16} color="#dc2626" />
                <Text style={styles.alertText}>{error}</Text>
              </View>
            ) : null}

            {/* Email Input */}
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

            {/* Password Input */}
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

            {/* Confirm Password Input */}
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Confirmar Contraseña</Text>
              <TextInput
                style={[styles.input, isLoading && styles.inputDisabled]}
                placeholder="••••••••"
                placeholderTextColor="#9ca3af"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            {/* Password Requirements */}
            <View style={styles.requirementsContainer}>
              <View style={styles.requirementItem}>
                <CheckCircle2 size={12} color="#6b7280" />
                <Text style={styles.requirementText}>Mínimo 6 caracteres</Text>
              </View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.cardFooter}>
            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Registrarme</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>¿Ya tienes una cuenta? </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.loginLink}>Iniciar sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
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
  requirementsContainer: {
    marginTop: 8,
  },
  requirementItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  requirementText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
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
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    fontSize: 14,
    color: "#6b7280",
  },
  loginLink: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
  },
});
