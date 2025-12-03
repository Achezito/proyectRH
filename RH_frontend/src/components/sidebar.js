import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
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
  UserPlus,
  LogOut,
  ChevronRight,
  Bell,
  HelpCircle,
  Database,
  FileUp,
  Gift,
  Filter,
  TrendingUp,
  Menu,
  X,
  Search,
} from "lucide-react-native";
import { useAuth } from "../context/AuthContext"; // IMPORTANTE: Asegúrate de importar useAuth

const navigationItems = [
  {
    name: "Dashboard",
    route: "AdminHome",
    icon: LayoutDashboard,
    color: "#3b82f6",
    description: "Vista general del sistema",
  },
  {
    name: "Incidencias",
    route: "Incidencias",
    icon: AlertCircle,
    color: "#ef4444",
    description: "Gestionar incidencias",
  },
  {
    name: "Docentes",
    route: "Docentes",
    icon: Users,
    color: "#059669",
    description: "Listado de docentes",
    subItems: [
      { name: "Todos los docentes", route: "Docentes" },
      { name: "Importar CSV", route: "ImportCSV" },
    ],
  },
  {
    name: "Días Económicos",
    route: "DiasEconomicos",
    icon: Calendar,
    color: "#8b5cf6",
    description: "Solicitudes de días",
  },
  {
    name: "Cumpleaños",
    route: "Cumpleanos",
    icon: Gift,
    color: "#ec4899",
    description: "Gestión de cumpleaños",
  },
  {
    name: "Períodos",
    route: "Periodos",
    icon: Clock,
    color: "#f59e0b",
    description: "Períodos académicos",
  },

  {
    name: "Configuración",
    route: "Configuracion",
    icon: Settings,
    color: "#6b7280",
    description: "Configuración del sistema",
  },
];

export function Sidebar({ onNavigate, activeScreen = "AdminHome" }) {
  const navigation = useNavigation();
  const route = useRoute();
  const { logout } = useAuth(); // Obtén la función logout del contexto

  const [expandedItems, setExpandedItems] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [notifications, setNotifications] = useState(5);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // Estado para el modal de logout

  // Datos simulados de usuario
  const userData = {
    name: "Administrador",
    email: "admin@rh.com",
    role: "Super Administrador",
    avatar: "AD",
  };

  const toggleExpand = (itemName) => {
    setExpandedItems((prev) => ({
      ...prev,
      [itemName]: !prev[itemName],
    }));
  };

  // Función para manejar el logout con confirmación
  const handleLogout = () => {
    setShowLogoutModal(true);
  };

  // Función para confirmar y ejecutar el logout
  const confirmLogout = () => {
    setShowLogoutModal(false);
    logout(); // Llama a la función logout del AuthContext
  };

  const filteredItems = navigationItems.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderNavItem = (item) => {
    const Icon = item.icon;
    const isActive = activeScreen === item.route;
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isExpanded = expandedItems[item.name];

    return (
      <View key={item.name}>
        <TouchableOpacity
          style={[
            styles.link,
            isActive && styles.activeLink,
            { borderLeftColor: item.color },
          ]}
          onPress={() => {
            if (hasSubItems) {
              toggleExpand(item.name);
            } else {
              if (onNavigate) {
                onNavigate(item.route);
              } else {
                navigation.navigate(item.route);
              }
            }
          }}
        >
          <View style={styles.linkContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: item.color + "20" },
              ]}
            >
              <Icon color={isActive ? "#fff" : item.color} size={20} />
            </View>
            <View style={styles.linkTextContainer}>
              <Text style={[styles.linkText, isActive && styles.activeText]}>
                {item.name}
              </Text>
              <Text style={styles.linkDescription}>{item.description}</Text>
            </View>
          </View>

          <View style={styles.linkRight}>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifications}</Text>
              </View>
            )}
            {hasSubItems && (
              <ChevronRight
                size={16}
                color={isActive ? "#fff" : "#6b7280"}
                style={[styles.chevron, isExpanded && styles.chevronExpanded]}
              />
            )}
          </View>
        </TouchableOpacity>

        {hasSubItems && isExpanded && (
          <View style={styles.subMenu}>
            {item.subItems.map((subItem) => (
              <TouchableOpacity
                key={subItem.name}
                style={styles.subLink}
                onPress={() => {
                  if (onNavigate) {
                    onNavigate(subItem.route);
                  } else {
                    navigation.navigate(subItem.route);
                  }
                }}
              >
                <ChevronRight size={12} color="#9ca3af" />
                <Text style={styles.subLinkText}>{subItem.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header con búsqueda */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Sistema RH</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.searchButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Search size={20} color="#6b7280" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.notificationButton}
            ></TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <Search size={18} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar módulo..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor="#9ca3af"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Navegación */}
      <ScrollView style={styles.nav} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Navegación Principal</Text>
        {filteredItems.map(renderNavItem)}

        {/* Sección de Administración */}
        <View style={styles.adminSection}>
          <Text style={styles.sectionTitle}>Administración</Text>

          <TouchableOpacity
            style={[styles.link, { borderLeftColor: "#ef4444" }]}
            onPress={() =>
              onNavigate
                ? onNavigate("Usuarios")
                : navigation.navigate("Usuarios")
            }
          >
            <View style={styles.linkContent}>
              <View
                style={[styles.iconContainer, { backgroundColor: "#fee2e2" }]}
              >
                <UserPlus color="#ef4444" size={20} />
              </View>
              <View style={styles.linkTextContainer}>
                <Text style={styles.linkText}>Gestión de Usuarios</Text>
                <Text style={styles.linkDescription}>
                  Administrar usuarios del sistema
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Footer con usuario y botón de logout */}
      <View style={styles.footer}>
        <View style={styles.userInfo}>
          <View style={[styles.avatar, { backgroundColor: "#3b82f6" }]}>
            <Text style={styles.avatarText}>{userData.avatar}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.footerName}>{userData.name}</Text>
            <Text style={styles.footerRole}>{userData.role}</Text>
            <Text style={styles.footerEmail}>{userData.email}</Text>
          </View>
        </View>

        <View style={styles.footerActions}>
          <TouchableOpacity style={styles.footerActionButton}>
            <Settings size={18} color="#6b7280" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.footerActionButton}>
            <HelpCircle size={18} color="#6b7280" />
          </TouchableOpacity>
          {/* Botón de Logout - SOLO ESTE ES NECESARIO */}
          <TouchableOpacity
            style={[styles.footerActionButton, styles.logoutButton]}
            onPress={handleLogout}
          >
            <LogOut size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Modal de confirmación de logout - OPCIONAL pero recomendado */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showLogoutModal}
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={modalStyles.overlay}>
          <View style={modalStyles.container}>
            <View style={modalStyles.header}>
              <LogOut size={24} color="#ef4444" />
              <Text style={modalStyles.title}>Cerrar Sesión</Text>
            </View>

            <View style={modalStyles.content}>
              <Text style={modalStyles.message}>
                ¿Estás seguro de que quieres cerrar sesión?
              </Text>
              <Text style={modalStyles.subMessage}>
                Serás redirigido a la pantalla de inicio de sesión.
              </Text>
            </View>

            <View style={modalStyles.actions}>
              <TouchableOpacity
                style={[modalStyles.button, modalStyles.cancelButton]}
                onPress={() => setShowLogoutModal(false)}
              >
                <Text style={modalStyles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[modalStyles.button, modalStyles.confirmButton]}
                onPress={confirmLogout}
              >
                <Text style={modalStyles.confirmButtonText}>Cerrar Sesión</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 300,
    height: "100%",
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchButton: {
    padding: 6,
  },
  notificationButton: {
    padding: 6,
    position: "relative",
  },
  notificationBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "#ef4444",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#1f2937",
  },
  nav: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  adminSection: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 16,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 10,
    marginBottom: 4,
    borderLeftWidth: 4,
    borderLeftColor: "transparent",
    backgroundColor: "#fff",
  },
  activeLink: {
    backgroundColor: "#3b82f6",
    borderLeftColor: "#1d4ed8",
  },
  linkContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  linkTextContainer: {
    flex: 1,
  },
  linkText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  activeText: {
    color: "#fff",
  },
  linkDescription: {
    fontSize: 12,
    color: "#6b7280",
  },
  linkRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badge: {
    backgroundColor: "#ef4444",
    borderRadius: 12,
    minWidth: 20,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 6,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  chevron: {
    transform: [{ rotate: "0deg" }],
  },
  chevronExpanded: {
    transform: [{ rotate: "90deg" }],
  },
  subMenu: {
    marginLeft: 48,
    marginBottom: 8,
  },
  subLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    marginBottom: 2,
  },
  subLinkText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: "#e5e7eb",
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userDetails: {
    flex: 1,
  },
  footerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  footerRole: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  footerEmail: {
    fontSize: 11,
    color: "#9ca3af",
  },
  footerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  footerActionButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  logoutButton: {
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
});

// Estilos para el modal de logout (opcional)
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginLeft: 12,
  },
  content: {
    marginBottom: 24,
  },
  message: {
    fontSize: 16,
    color: "#374151",
    marginBottom: 8,
    lineHeight: 24,
  },
  subMessage: {
    fontSize: 14,
    color: "#6b7280",
    lineHeight: 20,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  button: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: "center",
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 14,
  },
  confirmButton: {
    backgroundColor: "#ef4444",
  },
  confirmButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});
