// src/screens/administrador/DocentesScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Alert,
} from "react-native";
import {
  Users,
  Search,
  Filter,
  Download,
  Edit,
  Eye,
  UserCheck,
  UserX,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import Header from "../../components/header";

import { SafeAreaView } from "react-native-safe-area-context";

const API_BASE_URL = "http://10.194.1.108:5000/api/admin";

export default function ConfiguracionScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [docentes, setDocentes] = useState([]);
  const [search, setSearch] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("todos");

  const cargarDocentes = async () => {
    try {
      setLoading(true);
      // Aquí irá la llamada a la API
      // Por ahora datos de ejemplo
      const docentesEjemplo = [
        {
          id: 24,
          nombre: "Jaime",
          apellido: "Pérez",
          correo_institucional: "jaime@test.com",
          estado: "active",
          tipo_colaborador: "Colaborador",
          docencia: "Matemáticas",
        },
        {
          id: 25,
          nombre: "Patricio",
          apellido: "López",
          correo_institucional: "patricio@test.com",
          estado: "inactive",
          tipo_colaborador: "Administrativo",
          docencia: "Ciencias",
        },
      ];

      setDocentes(docentesEjemplo);
    } catch (error) {
      console.error("Error:", error);
      Alert.alert("Error", "No se pudieron cargar los docentes");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    cargarDocentes();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainWrapper}>
          <Sidebar active="docentes" />
          <View style={styles.contentWrapper}>
            <Header title="Gestión de Docentes" />
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Cargando docentes...</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainWrapper}>
        <Sidebar active="docentes" />
        <View style={styles.contentWrapper}>
          <Header title="Gestión de Docentes" />

          {/* CONTENIDO BÁSICO */}
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  cargarDocentes();
                }}
              />
            }
          >
            <View style={styles.content}>
              <Text style={styles.title}>Gestión de Docentes</Text>
              <Text style={styles.subtitle}>
                Aquí podrás gestionar todos los docentes del sistema
              </Text>

              <View style={styles.statsContainer}>
                <View style={styles.statCard}>
                  <Users size={24} color="#059669" />
                  <Text style={styles.statNumber}>{docentes.length}</Text>
                  <Text style={styles.statLabel}>Total Docentes</Text>
                </View>
              </View>

              <View style={styles.comingSoon}>
                <Text style={styles.comingSoonText}>🚧 En desarrollo...</Text>
                <Text style={styles.comingSoonSubtext}>
                  Esta funcionalidad estará disponible pronto
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mainWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "column",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: "row",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  comingSoon: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 32,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  comingSoonText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#f59e0b",
    marginBottom: 8,
  },
  comingSoonSubtext: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
});
