import React, { useState, useEffect } from "react";
import { View, Text, ActivityIndicator, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles";
import Sidebar from "./Sidebar";
import Header from "./header";
import ProfileTab from "./profiletab";
import IncidenciasTab from "./incidenciastab";

const API_BASE_URL = "http://10.194.1.108:5000/docente";

export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [docenteId, setDocenteId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("incidencias");
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTeacherId();
  }, []);

  const loadTeacherId = async () => {
    try {
      const id = await AsyncStorage.getItem("docenteId");
      console.log("📱 ID recuperado de AsyncStorage:", id); // Debug

      if (id) {
        const parsedId = parseInt(id, 10);
        console.log("🔢 ID parseado:", parsedId); // Debug

        if (!isNaN(parsedId)) {
          setDocenteId(parsedId);
          loadTeacherData(parsedId);
        } else {
          setError("ID de docente inválido");
          setLoading(false);
        }
      } else {
        setError("No se encontró ID de docente");
        setLoading(false);
      }
    } catch (e) {
      console.error("❌ Error cargando ID:", e);
      setError("Error al cargar datos del docente");
      setLoading(false);
    }
  };

  const loadTeacherData = async (id) => {
    try {
      console.log(`🌐 Haciendo petición a: ${API_BASE_URL}/api/docentes/${id}`); // Debug

      const res = await fetch(`${API_BASE_URL}/api/docentes/${id}`);

      if (!res.ok) {
        throw new Error(`Error HTTP: ${res.status}`);
      }

      const data = await res.json();
      setUserData(data);
      setError(null);
    } catch (e) {
      console.error("❌ Error cargando datos:", e);
      setError("Error al cargar datos del servidor");
    } finally {
      setLoading(false);
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

  if (error) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={[styles.loadingText, { color: "red" }]}>{error}</Text>
        <Text style={styles.loadingText}>
          Por favor, cierra la app y vuelve a iniciar sesión.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#4f46e5" barStyle="light-content" />

      <Sidebar
        sidebarOpen={sidebarOpen}
        userData={userData}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      <View style={styles.main}>
        <Header
          sidebarOpen={sidebarOpen}
          setSidebarOpen={setSidebarOpen}
          userData={userData}
        />

        {activeTab === "profile" && (
          <ProfileTab userData={userData} docenteId={docenteId} />
        )}

        {activeTab === "incidencias" && (
          <IncidenciasTab docenteId={docenteId} userData={userData} />
        )}
      </View>
    </View>
  );
}
