import React, { useState, useContext } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Building2, AlertCircle } from "lucide-react-native";
import { AuthContext, useAuth } from "../context/AuthContext"; // Importa el contexto

export default function LoginPage() {
  const navigation = useNavigation();
  const { setUser } = useAuth(); // Usa useContext directamente
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

const handleLogin = async () => {
  setError("");
  setIsLoading(true);

  console.log("Intentando login con:", email);

  try {
    const res = await fetch("http://localhost:5000/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    console.log("Respuesta fetch:", res.status);
    const data = await res.json();

    if (!res.ok) {
      // Manejar errores específicos de estado de cuenta
      if (res.status === 403) {
        if (data.error.includes("pendiente")) {
          // Redirigir a pantalla de pending-approval
          navigation.navigate("pending-approval");
          return;
        } else if (data.error.includes("rechazada")) {
          // Redirigir a pantalla de rejected
          navigation.navigate("Rejected");
          return;
        }
      }
      throw new Error(data.error || "Error desconocido");
    }

    console.log("Login exitoso:", data.user);
    // COMENTA ESTAS DOS LÍNEAS:
    // setUser(data.user);
    // navigation.navigate("Home");
    
    // El AuthContext detectará automáticamente el login y redirigirá
  } catch (err) {
    console.error("Error en login:", err);
    setError(err instanceof Error ? err.message : "Error al conectar con el servidor");
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
            <Text style={styles.title}>Iniciar Sesión</Text>
            <Text style={styles.subtitle}>
              Sistema de Gestión de Incidencias de RH
            </Text>
          </View>

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
                <Text style={styles.buttonText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>
                ¿No tienes una cuenta?{" "}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                <Text style={styles.registerLink}>Registrarse</Text>
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