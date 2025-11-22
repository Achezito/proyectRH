import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { styles } from "./styles";

const Header = ({ sidebarOpen, setSidebarOpen, userData }) => {
  return (
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
  );
};

export default Header;
