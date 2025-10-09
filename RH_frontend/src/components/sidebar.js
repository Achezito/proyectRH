import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  LayoutDashboard,
  AlertCircle,
  Users,
  Calendar,
  Clock,
  FileText,
  Settings,
} from "lucide-react-native";

const navigationItems = [
  { name: "Dashboard", route: "Dashboard", icon: LayoutDashboard },
  { name: "Incidencias", route: "Incidencias", icon: AlertCircle },
  { name: "Docentes", route: "Docentes", icon: Users },
  { name: "Días Económicos", route: "DiasEconomicos", icon: Calendar },
  { name: "Períodos", route: "Periodos", icon: Clock },
  { name: "Reportes", route: "Reportes", icon: FileText },
  { name: "Configuración", route: "Configuracion", icon: Settings },
];

export function Sidebar() {
  const navigation = useNavigation();
  const route = useRoute();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sistema RH</Text>
      </View>
      <ScrollView style={styles.nav}>
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = route.name === item.route;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.link, isActive && styles.activeLink]}
              onPress={() => navigation.navigate(item.route)}
            >
              <Icon color={isActive ? "#fff" : "#555"} size={20} />
              <Text style={[styles.linkText, isActive && styles.activeText]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      <View style={styles.footer}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>AD</Text>
        </View>
        <View>
          <Text style={styles.footerName}>Administrador</Text>
          <Text style={styles.footerEmail}>admin@rh.com</Text>
        </View>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    width: 250,
    height: "100%",
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderColor: "#ddd",
  },
  header: {
    height: 60,
    justifyContent: "center",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ef4444",
  },
  nav: {
    flex: 1,
    padding: 10,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 5,
  },
  linkText: {
    marginLeft: 10,
    color: "#555",
    fontSize: 15,
    fontWeight: "500",
  },
  activeLink: {
    backgroundColor: "#0077b6",
  },
  activeText: {
    color: "#fff",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderColor: "#eee",
    padding: 15,
  },
  avatar: {
    backgroundColor: "#0077b6",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  avatarText: {
    color: "#fff",
    fontWeight: "bold",
  },
  footerName: {
    fontSize: 14,
    fontWeight: "600",
  },
  footerEmail: {
    fontSize: 12,
    color: "#666",
  },
});
