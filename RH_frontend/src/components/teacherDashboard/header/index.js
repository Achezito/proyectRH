import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const Header = ({ sidebarOpen, setSidebarOpen, userData }) => {
  return (
    <View style={styles.header}>
      <View style={styles.headerLeft}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setSidebarOpen(!sidebarOpen)}
        >
          <Ionicons name="menu-outline" size={24} color="#4f46e5" />
        </TouchableOpacity>

        <View style={styles.headerTextContainer}>
          <Text style={styles.headerName}>
            {userData?.nombre_completo || "Docente"}
          </Text>
          <Text style={styles.headerRole}>
            {userData?.tipo_contrato || "Profesor"}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.notificationButton}>
        <Ionicons name="notifications-outline" size={20} color="#64748b" />
      </TouchableOpacity>
    </View>
  );
};

export default Header;
