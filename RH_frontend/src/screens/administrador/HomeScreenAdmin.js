import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import {
  Users,
  AlertCircle,
  Calendar,
  TrendingUp,
  Clock,
  Gift,
  FileText,
  CheckCircle,
  XCircle,
  UserCheck,
  Filter,
  ChevronRight,
} from "lucide-react-native";

import { SafeAreaView } from "react-native-safe-area-context";

// URL base de tu API Flask
const API_BASE_URL = "http://10.194.1.108:5000";

export default function DashboardPage() {
  const [activeFilter, setActiveFilter] = useState("hoy");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardData, setDashboardData] = useState({
    cards: [],
    periodoActivo: null,
    incidenciasRecientes: [],
    diasEconomicos: [],
    cumpleanosMes: [],
    topIncidencias: [],
  });

  // Función para formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch (error) {
      return dateString;
    }
  };

  // Función para formatear fecha y hora
  const formatDateTime = (dateTimeString) => {
    if (!dateTimeString) return "";
    try {
      const date = new Date(dateTimeString);
      return (
        date.toLocaleDateString("es-ES", {
          month: "short",
          day: "numeric",
        }) +
        " " +
        date.toLocaleTimeString("es-ES", {
          hour: "2-digit",
          minute: "2-digit",
        })
      );
    } catch (error) {
      return dateTimeString;
    }
  };

  // Función para obtener datos del dashboard
  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      // 1. Obtener estadísticas principales (cards)
      const statsResponse = await fetch(
        `${API_BASE_URL}/admin/dashboard/stats`
      );
      const statsData = await statsResponse.json();

      // 2. Obtener incidencias recientes
      const incidenciasResponse = await fetch(
        `${API_BASE_URL}/admin/dashboard/incidencias-recientes?limit=5`
      );
      const incidenciasData = await incidenciasResponse.json();

      // 3. Obtener días económicos
      const diasEconomicosResponse = await fetch(
        `${API_BASE_URL}/admin/dashboard/dias-economicos?limit=5`
      );
      const diasEconomicosData = await diasEconomicosResponse.json();

      // 4. Obtener cumpleaños del mes
      const cumpleanosResponse = await fetch(
        `${API_BASE_URL}/admin/dashboard/cumpleanos-mes`
      );
      const cumpleanosData = await cumpleanosResponse.json();

      // 5. Obtener top incidencias
      const topIncidenciasResponse = await fetch(
        `${API_BASE_URL}/admin/dashboard/top-incidencias?limit=5`
      );
      const topIncidenciasData = await topIncidenciasResponse.json();

      // 6. Obtener período activo
      const periodoResponse = await fetch(
        `${API_BASE_URL}/admin/dashboard/periodo-activo`
      );
      const periodoData = await periodoResponse.json();

      setDashboardData({
        cards: statsData.success ? statsData.cards : [],
        periodoActivo: periodoData.success ? periodoData.periodoActivo : null,
        incidenciasRecientes: incidenciasData.success
          ? incidenciasData.incidencias
          : [],
        diasEconomicos: diasEconomicosData.success
          ? diasEconomicosData.dias_economicos
          : [],
        cumpleanosMes: cumpleanosData.success ? cumpleanosData.cumpleanos : [],
        topIncidencias: topIncidenciasData.success
          ? topIncidenciasData.top_incidencias
          : [],
      });
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      // En caso de error, usar datos de ejemplo
      setDashboardData({
        cards: getMockCards(),
        periodoActivo: getMockPeriodo(),
        incidenciasRecientes: getMockIncidencias(),
        diasEconomicos: getMockDiasEconomicos(),
        cumpleanosMes: getMockCumpleanos(),
        topIncidencias: getMockTopIncidencias(),
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Función para actualizar datos
  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  // Cargar datos al montar el componente
  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Datos de ejemplo (fallback)
  const getMockCards = () => [
    {
      id: 1,
      title: "Total Docentes",
      value: "156",
      subtitle: "156 activos",
      color: "#059669",
      icon: "Users",
    },
    {
      id: 2,
      title: "Incidencias Pendientes",
      value: "24",
      subtitle: "Requieren atención",
      color: "#dc2626",
      icon: "AlertCircle",
    },
    {
      id: 3,
      title: "Días Económicos",
      value: "18",
      subtitle: "Solicitudes pendientes",
      color: "#7c3aed",
      icon: "Calendar",
    },
    {
      id: 4,
      title: "Tasa de Resolución",
      value: "87%",
      subtitle: "Eficiencia del sistema",
      color: "#2563eb",
      icon: "TrendingUp",
    },
    {
      id: 5,
      title: "Cumpleaños",
      value: "8",
      subtitle: "Por asignar este mes",
      color: "#ec4899",
      icon: "Gift",
    },
    {
      id: 6,
      title: "Período Activo",
      value: "16",
      subtitle: "días restantes",
      color: "#f59e0b",
      icon: "FileText",
    },
  ];

  const getMockPeriodo = () => ({
    nombre: "Enero 2025",
    fecha_inicio: "2025-01-01",
    fecha_fin: "2025-01-31",
    dias_restantes: 16,
  });

  const getMockIncidencias = () => [
    {
      id: 1,
      docente: "María García López",
      tipo: "Retardo",
      motivo: "Tráfico pesado",
      fecha: "2025-01-15 08:45",
      estado: "pendiente",
      minutos: 15,
      periodo: "Enero 2025",
    },
    {
      id: 2,
      docente: "Juan Pérez Martínez",
      tipo: "Falta",
      motivo: "Enfermedad",
      fecha: "2025-01-14",
      estado: "aprobada",
      minutos: null,
      periodo: "Enero 2025",
    },
  ];

  const getMockDiasEconomicos = () => [
    {
      id: 1,
      docente: "Carlos Hernández",
      motivo: "Asuntos personales",
      fecha: "2025-01-20",
      estado: "pendiente",
      periodo: "Enero 2025",
    },
    {
      id: 2,
      docente: "Laura Sánchez",
      motivo: "Trámite médico",
      fecha: "2025-01-18",
      estado: "aprobado",
      periodo: "Enero 2025",
    },
  ];

  const getMockCumpleanos = () => [
    {
      id: 1,
      docente: "Roberto Díaz",
      fecha_cumpleanos: "1990-01-10",
      fecha_disfrute: "2025-01-17",
      estado: "pendiente",
    },
    {
      id: 2,
      docente: "Sofía Mendoza",
      fecha_cumpleanos: "1985-01-15",
      fecha_disfrute: null,
      estado: "por_solicitar",
    },
  ];

  const getMockTopIncidencias = () => [
    {
      docente: "Miguel Torres",
      total_incidencias: 8,
      retardos: 5,
      faltas: 3,
      minutos_totales: 85,
    },
    {
      docente: "Elena Castro",
      total_incidencias: 6,
      retardos: 4,
      faltas: 2,
      minutos_totales: 65,
    },
  ];

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return "#f59e0b";
      case "aprobado":
      case "aprobada":
        return "#10b981";
      case "rechazado":
        return "#ef4444";
      case "por_solicitar":
        return "#6b7280";
      default:
        return "#6b7280";
    }
  };

  const getEstadoTexto = (estado) => {
    switch (estado) {
      case "pendiente":
        return "Pendiente";
      case "aprobado":
      case "aprobada":
        return "Aprobado";
      case "rechazado":
        return "Rechazado";
      case "por_solicitar":
        return "Por solicitar";
      default:
        return estado;
    }
  };

  const getTipoColor = (tipo) => {
    switch (tipo?.toLowerCase()) {
      case "retardo":
        return "#3b82f6";
      case "falta":
        return "#ef4444";
      case "día económico":
        return "#8b5cf6";
      case "cumpleaños":
        return "#ec4899";
      default:
        return "#6b7280";
    }
  };

  const getIconComponent = (iconName) => {
    switch (iconName) {
      case "Users":
        return Users;
      case "AlertCircle":
        return AlertCircle;
      case "Calendar":
        return Calendar;
      case "TrendingUp":
        return TrendingUp;
      case "Gift":
        return Gift;
      case "FileText":
        return FileText;
      default:
        return Users;
    }
  };

  // Render loading
  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainWrapper}>
          <View style={styles.contentWrapper}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Cargando dashboard...</Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainWrapper}>
        <View style={styles.contentWrapper}>
          {/* FILTROS DE PERIODO */}
          <View style={styles.filterContainer}>
            <View style={styles.periodoInfo}>
              <Text style={styles.periodoTitle}>Período Actual</Text>
              <Text style={styles.periodoText}>
                {dashboardData.periodoActivo?.nombre || "No hay período activo"}
              </Text>
              {dashboardData.periodoActivo && (
                <Text style={styles.periodoSubtext}>
                  {dashboardData.periodoActivo.dias_restantes || 0} días
                  restantes
                </Text>
              )}
            </View>

            <View style={styles.filterButtons}>
              {["hoy", "semana", "mes"].map((filtro) => (
                <TouchableOpacity
                  key={filtro}
                  style={[
                    styles.filterButton,
                    activeFilter === filtro && styles.filterButtonActive,
                  ]}
                  onPress={() => setActiveFilter(filtro)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      activeFilter === filtro && styles.filterButtonTextActive,
                    ]}
                  >
                    {filtro.charAt(0).toUpperCase() + filtro.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#3b82f6"]}
                tintColor="#3b82f6"
              />
            }
          >
            {/* HEADER SECTION */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Panel de Control</Text>
              <Text style={styles.subtitle}>
                Resumen general del sistema de gestión docente
              </Text>
            </View>

            {/* STATS GRID - 6 CARDS */}
            <View style={styles.statsGrid}>
              {dashboardData.cards.map((card) => {
                const IconComponent = getIconComponent(card.icon);
                return (
                  <View key={card.id} style={styles.statCard}>
                    <View style={styles.cardHeader}>
                      <IconComponent size={20} color={card.color} />
                      <Text style={styles.cardTitle}>{card.title}</Text>
                    </View>
                    <Text style={styles.cardValue}>{card.value}</Text>
                    <View style={styles.cardFooter}>
                      <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {/* MAIN CONTENT SECTION - 3 COLUMNS */}
            <View style={styles.contentSection}>
              {/* COLUMNA 1: Incidencias Recientes */}
              <View style={styles.contentColumn}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    <AlertCircle size={18} color="#dc2626" /> Incidencias
                    Recientes
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver todas</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.listCard}>
                  {dashboardData.incidenciasRecientes.length > 0 ? (
                    dashboardData.incidenciasRecientes.map((item) => (
                      <View key={item.id} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <View
                            style={[
                              styles.tipoBadge,
                              {
                                backgroundColor: getTipoColor(item.tipo) + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.tipoText,
                                { color: getTipoColor(item.tipo) },
                              ]}
                            >
                              {item.tipo}
                            </Text>
                          </View>
                          <Text style={styles.listItemName}>
                            {item.docente}
                          </Text>
                          <Text style={styles.listItemDetail}>
                            {item.motivo}
                          </Text>
                          {item.minutos && (
                            <Text style={styles.minutosText}>
                              {item.minutos} minutos de retardo
                            </Text>
                          )}
                        </View>

                        <View style={styles.listItemRight}>
                          <View
                            style={[
                              styles.estadoBadge,
                              {
                                backgroundColor:
                                  getEstadoColor(item.estado) + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.estadoText,
                                { color: getEstadoColor(item.estado) },
                              ]}
                            >
                              {getEstadoTexto(item.estado)}
                            </Text>
                          </View>
                          <Text style={styles.fechaText}>
                            {formatDateTime(item.fecha)}
                          </Text>
                          <Text style={styles.periodoText}>{item.periodo}</Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No hay incidencias recientes
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* COLUMNA 2: Días Económicos y Cumpleaños */}
              <View style={styles.contentColumn}>
                {/* Días Económicos */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    <Calendar size={18} color="#7c3aed" /> Días Económicos
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver todos</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.listCard}>
                  {dashboardData.diasEconomicos.length > 0 ? (
                    dashboardData.diasEconomicos.map((item) => (
                      <View key={item.id} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.listItemName}>
                            {item.docente}
                          </Text>
                          <Text style={styles.listItemDetail}>
                            {item.motivo}
                          </Text>
                          <Text style={styles.periodoText}>{item.periodo}</Text>
                        </View>

                        <View style={styles.listItemRight}>
                          <View
                            style={[
                              styles.estadoBadge,
                              {
                                backgroundColor:
                                  getEstadoColor(item.estado) + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.estadoText,
                                { color: getEstadoColor(item.estado) },
                              ]}
                            >
                              {getEstadoTexto(item.estado)}
                            </Text>
                          </View>
                          <Text style={styles.fechaText}>
                            {formatDate(item.fecha)}
                          </Text>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No hay días económicos solicitados
                      </Text>
                    </View>
                  )}
                </View>

                {/* Cumpleaños del Mes */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    <Gift size={18} color="#ec4899" /> Cumpleaños del Mes
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver todos</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.listCard}>
                  {dashboardData.cumpleanosMes.length > 0 ? (
                    dashboardData.cumpleanosMes.map((item) => (
                      <View key={item.id} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.listItemName}>
                            {item.docente}
                          </Text>
                          <Text style={styles.listItemDetail}>
                            Cumpleaños: {formatDate(item.fecha_cumpleanos)}
                          </Text>
                          {item.fecha_disfrute && (
                            <Text style={styles.listItemDetail}>
                              Disfrute: {formatDate(item.fecha_disfrute)}
                            </Text>
                          )}
                        </View>

                        <View style={styles.listItemRight}>
                          <View
                            style={[
                              styles.estadoBadge,
                              {
                                backgroundColor:
                                  getEstadoColor(item.estado) + "20",
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.estadoText,
                                { color: getEstadoColor(item.estado) },
                              ]}
                            >
                              {getEstadoTexto(item.estado)}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No hay cumpleaños este mes
                      </Text>
                    </View>
                  )}
                </View>
              </View>

              {/* COLUMNA 3: Top Incidencias y Resumen */}
              <View style={styles.contentColumn}>
                {/* Top Docentes con Incidencias */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    <UserCheck size={18} color="#059669" /> Top Incidencias
                  </Text>
                  <TouchableOpacity>
                    <Text style={styles.seeAllText}>Ver reporte</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.listCard}>
                  {dashboardData.topIncidencias.length > 0 ? (
                    dashboardData.topIncidencias.map((item, index) => (
                      <View key={index} style={styles.listItem}>
                        <View style={styles.listItemLeft}>
                          <Text style={styles.listItemName}>
                            {item.docente}
                          </Text>
                          <View style={styles.statsRow}>
                            <View style={styles.statItem}>
                              <Text style={styles.statNumber}>
                                {item.total_incidencias}
                              </Text>
                              <Text style={styles.statLabel}>Total</Text>
                            </View>
                            <View style={styles.statItem}>
                              <Text style={styles.statNumber}>
                                {item.retardos}
                              </Text>
                              <Text style={styles.statLabel}>Retardos</Text>
                            </View>
                            <View style={styles.statItem}>
                              <Text style={styles.statNumber}>
                                {item.faltas}
                              </Text>
                              <Text style={styles.statLabel}>Faltas</Text>
                            </View>
                            {item.minutos_totales > 0 && (
                              <View style={styles.statItem}>
                                <Text style={styles.statNumber}>
                                  {item.minutos_totales}
                                </Text>
                                <Text style={styles.statLabel}>Min</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>
                    ))
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No hay datos de incidencias
                      </Text>
                    </View>
                  )}
                </View>

                {/* Resumen Rápido */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>
                    <FileText size={18} color="#f59e0b" /> Resumen Rápido
                  </Text>
                </View>

                <View style={styles.summaryCard}>
                  {dashboardData.periodoActivo ? (
                    <>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Período actual:</Text>
                        <Text style={styles.summaryValue}>
                          {dashboardData.periodoActivo.nombre}
                        </Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Fecha inicio:</Text>
                        <Text style={styles.summaryValue}>
                          {formatDate(dashboardData.periodoActivo.fecha_inicio)}
                        </Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Fecha fin:</Text>
                        <Text style={styles.summaryValue}>
                          {formatDate(dashboardData.periodoActivo.fecha_fin)}
                        </Text>
                      </View>
                      <View style={styles.summaryItem}>
                        <Text style={styles.summaryLabel}>Días restantes:</Text>
                        <Text
                          style={[styles.summaryValue, styles.highlightValue]}
                        >
                          {dashboardData.periodoActivo.dias_restantes} días
                        </Text>
                      </View>
                    </>
                  ) : (
                    <View style={styles.emptyState}>
                      <Text style={styles.emptyStateText}>
                        No hay período activo
                      </Text>
                    </View>
                  )}
                </View>
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
  emptyState: {
    padding: 20,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 14,
    color: "#9ca3af",
    fontStyle: "italic",
  },
  // FILTROS
  filterContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  periodoInfo: {
    flex: 1,
  },
  periodoTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 2,
  },
  periodoText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  periodoSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  filterButtons: {
    flexDirection: "row",
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  filterButtonActive: {
    backgroundColor: "#3b82f6",
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  filterButtonTextActive: {
    color: "#fff",
  },
  // SCROLL CONTENT
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  headerSection: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#6b7280",
  },
  // STATS GRID
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    flex: 1,
  },
  cardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  cardSubtitle: {
    fontSize: 12,
    color: "#6b7280",
  },
  // CONTENT SECTION (3 COLUMNS)
  contentSection: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 24,
  },
  contentColumn: {
    flex: 1,
    minWidth: 300,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  seeAllText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  // LIST CARDS
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  listItemLeft: {
    flex: 1,
    paddingRight: 12,
  },
  listItemRight: {
    alignItems: "flex-end",
  },
  tipoBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 6,
  },
  tipoText: {
    fontSize: 11,
    fontWeight: "600",
  },
  listItemName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  listItemDetail: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  minutosText: {
    fontSize: 11,
    color: "#dc2626",
    fontWeight: "500",
  },
  periodoText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  estadoText: {
    fontSize: 11,
    fontWeight: "600",
  },
  fechaText: {
    fontSize: 11,
    color: "#6b7280",
  },
  // STATS ROW (para top incidencias)
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 6,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginTop: 2,
  },
  // SUMMARY CARD
  summaryCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  summaryItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  summaryLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  highlightValue: {
    color: "#059669",
  },
});
