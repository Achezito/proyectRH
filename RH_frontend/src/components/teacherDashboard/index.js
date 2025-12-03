import React, { useState, useEffect } from "react";
import { View, ActivityIndicator, Text, StatusBar } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles";
import Header from "./header/index";
import Sidebar from "./sidebar/index";
import ProfileTab from "./profiletab/index";
import IncidenciasTab from "./incidenciastab";

const API_BASE_URL = "http://10.194.1.108:5000/docente";

export default function TeacherDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loading, setLoading] = useState(true);
  const [docenteId, setDocenteId] = useState(null);
  const [userData, setUserData] = useState(null);
  const [activeTab, setActiveTab] = useState("incidencias");

  useEffect(() => {
    loadTeacherId();
  }, []);

  const loadTeacherId = async () => {
    try {
      const id = await AsyncStorage.getItem("docenteId");
      if (id) {
        const parsedId = parseInt(id, 10);
        if (!isNaN(parsedId)) {
          setDocenteId(parsedId);
          loadTeacherData(parsedId);
        } else {
          setLoading(false);
        }
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
      }
    } catch (e) {
      console.log(e);
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
