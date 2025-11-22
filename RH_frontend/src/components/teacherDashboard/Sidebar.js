import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const Sidebar = ({ sidebarOpen, userData, activeTab, setActiveTab }) => {
  if (!sidebarOpen) return null;

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        {
          text: "Cancelar",
          style: "cancel",
        },
        {
          text: "Sí, cerrar sesión",
          onPress: () => {
            // Aquí va la lógica de logout
            console.log("Cerrar sesión");
          },
        },
      ]
    );
  };

  return (
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
        {/* OPCIÓN MI PERFIL */}
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

        {/* OPCIÓN INCIDENCIAS - ESTA ES LA QUE FALTABA */}
        <TouchableOpacity
          style={[
            styles.sidebarBtn,
            activeTab === "incidencias" && styles.sidebarBtnActive,
          ]}
          onPress={() => setActiveTab("incidencias")}
        >
          <Ionicons
            name="document-text-outline"
            size={20}
            color={activeTab === "incidencias" ? "#4f46e5" : "#64748b"}
          />
          <Text
            style={[
              styles.sidebarText,
              activeTab === "incidencias" && styles.sidebarTextActive,
            ]}
          >
            Incidencias
          </Text>
        </TouchableOpacity>

        {/* OTRAS OPCIONES */}
        <TouchableOpacity style={styles.sidebarBtn}>
          <Ionicons name="calendar-outline" size={20} color="#64748b" />
          <Text style={styles.sidebarText}>Horarios</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.sidebarBtn}>
          <Ionicons name="school-outline" size={20} color="#64748b" />
          <Text style={styles.sidebarText}>Mis Cursos</Text>
        </TouchableOpacity>

        {/* CERRAR SESIÓN */}
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
  );
};

export default Sidebar;
