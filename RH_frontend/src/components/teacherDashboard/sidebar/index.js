import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const Sidebar = ({ sidebarOpen, userData, activeTab, setActiveTab }) => {
  if (!sidebarOpen) return null;

  const menuItems = [
    { key: "incidencias", icon: "document-text-outline", label: "Incidencias" },
    { key: "profile", icon: "person-outline", label: "Perfil" },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{userData?.nombre?.[0] || "D"}</Text>
        </View>
        <Text style={styles.sidebarTitle}>
          {userData?.nombre_completo || "Docente"}
        </Text>
        <Text style={styles.sidebarSubtitle}>
          {userData?.correo_institucional || "correo@ejemplo.com"}
        </Text>
      </View>

      <View style={styles.sidebarMenu}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.sidebarBtn,
              activeTab === item.key && styles.sidebarBtnActive,
            ]}
            onPress={() => setActiveTab(item.key)}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={activeTab === item.key ? "#4f46e5" : "#64748b"}
            />
            <Text
              style={[
                styles.sidebarText,
                activeTab === item.key && styles.sidebarTextActive,
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.sidebarBtn, styles.logoutBtn]}
          onPress={() => console.log("Cerrar sesión")}
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
