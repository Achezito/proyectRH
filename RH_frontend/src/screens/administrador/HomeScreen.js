import React from "react";
import { View, Text, ScrollView, StyleSheet, FlatList } from "react-native";
import { AlertCircle, Users, Calendar, TrendingUp } from "lucide-react-native";
import DashboardChart from "../../components/dashboard-chart";
import StatusDistribution from "../../components/status-distribution";
import Header from "../../components/header";
import { Sidebar } from "../../components/sidebar";
import { SafeAreaView } from "react-native-safe-area-context";

export default function DashboardPage() {
  const stats = [
    {
      title: "Incidencias Activas",
      value: "24",
      change: "+12%",
      icon: AlertCircle,
      trend: "up",
    },
    {
      title: "Total Docentes",
      value: "156",
      change: "+3",
      icon: Users,
      trend: "up",
    },
    {
      title: "Días Económicos",
      value: "48",
      change: "-8%",
      icon: Calendar,
      trend: "down",
    },
    {
      title: "Tasa de Resolución",
      value: "87%",
      change: "+5%",
      icon: TrendingUp,
      trend: "up",
    },
  ];

  const incidenciasRecientes = [
    {
      docente: "María García López",
      motivo: "Falta injustificada",
      fecha: "2025-01-05",
      estado: "Pendiente",
    },
    {
      docente: "Juan Pérez Martínez",
      motivo: "Retardo",
      fecha: "2025-01-04",
      estado: "En Proceso",
    },
    {
      docente: "Ana Rodríguez Silva",
      motivo: "Ausencia médica",
      fecha: "2025-01-03",
      estado: "Resuelta",
    },
  ];

  const diasEconomicos = [
    {
      docente: "Carlos Hernández",
      motivo: "Asunto personal",
      fecha: "2025-01-10",
      estado: "Aprobado",
    },
    {
      docente: "Laura Sánchez",
      motivo: "Trámite médico",
      fecha: "2025-01-12",
      estado: "Pendiente",
    },
    {
      docente: "Roberto Díaz",
      motivo: "Asunto familiar",
      fecha: "2025-01-15",
      estado: "Pendiente",
    },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainWrapper}>
        <Sidebar />
        <View style={styles.contentWrapper}>
          <Header />
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Section */}
            <View style={styles.headerSection}>
              <Text style={styles.title}>Dashboard</Text>
              <Text style={styles.subtitle}>
                Resumen general del sistema de incidencias
              </Text>
            </View>

            {/* Stats Grid */}
            <View style={styles.statsGrid}>
              {stats.map((stat, index) => (
                <View key={stat.title} style={styles.statCard}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>{stat.title}</Text>
                    <stat.icon size={16} color="#666" />
                  </View>
                  <Text style={styles.cardValue}>{stat.value}</Text>
                  <Text
                    style={[
                      styles.cardChange,
                      { color: stat.trend === "up" ? "#0077b6" : "#666" },
                    ]}
                  >
                    {stat.change} desde el mes pasado
                  </Text>
                </View>
              ))}
            </View>

            {/* Charts Section - MODIFICADO */}
            <View style={styles.chartsSection}>
              <View style={styles.barChartContainer}>
                <DashboardChart />
              </View>
              <View style={styles.pieChartContainer}>
                <StatusDistribution />
              </View>
            </View>

            {/* Lists Section */}
            <View style={styles.listsSection}>
              {/* Incidencias Recientes */}
              <View style={styles.listCard}>
                <Text style={styles.listTitle}>Incidencias Recientes</Text>
                <View style={styles.listContent}>
                  {incidenciasRecientes.map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.listItem,
                        index < incidenciasRecientes.length - 1 &&
                          styles.listItemBorder,
                      ]}
                    >
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemName}>{item.docente}</Text>
                        <Text style={styles.listItemDetail}>{item.motivo}</Text>
                      </View>
                      <View style={styles.listItemRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            item.estado === "Resuelta" && styles.statusResuelta,
                            item.estado === "En Proceso" &&
                              styles.statusEnProceso,
                            item.estado === "Pendiente" &&
                              styles.statusPendiente,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              item.estado === "Resuelta" &&
                                styles.statusTextResuelta,
                              item.estado === "En Proceso" &&
                                styles.statusTextEnProceso,
                              item.estado === "Pendiente" &&
                                styles.statusTextPendiente,
                            ]}
                          >
                            {item.estado}
                          </Text>
                        </View>
                        <Text style={styles.listItemDate}>{item.fecha}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>

              {/* Días Económicos */}
              <View style={styles.listCard}>
                <Text style={styles.listTitle}>
                  Días Económicos Solicitados
                </Text>
                <View style={styles.listContent}>
                  {diasEconomicos.map((item, index) => (
                    <View
                      key={index}
                      style={[
                        styles.listItem,
                        index < diasEconomicos.length - 1 &&
                          styles.listItemBorder,
                      ]}
                    >
                      <View style={styles.listItemContent}>
                        <Text style={styles.listItemName}>{item.docente}</Text>
                        <Text style={styles.listItemDetail}>{item.motivo}</Text>
                      </View>
                      <View style={styles.listItemRight}>
                        <View
                          style={[
                            styles.statusBadge,
                            item.estado === "Aprobado" && styles.statusAprobado,
                            item.estado === "Pendiente" &&
                              styles.statusPendiente,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusText,
                              item.estado === "Aprobado" &&
                                styles.statusTextAprobado,
                              item.estado === "Pendiente" &&
                                styles.statusTextPendiente,
                            ]}
                          >
                            {item.estado}
                          </Text>
                        </View>
                        <Text style={styles.listItemDate}>{item.fecha}</Text>
                      </View>
                    </View>
                  ))}
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
    color: "#1a1a1a",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  cardValue: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  cardChange: {
    fontSize: 12,
    fontWeight: "500",
  },
  // Charts Section - MODIFICADO
  chartsSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
    gap: 80,
  },
  barChartContainer: {
    flex: 2, // Ocupa 2 partes del espacio disponible
    minHeight: 300,
  },
  pieChartContainer: {
    flex: 2, // Ocupa 1 parte del espacio disponible
    minHeight: 300,
  },
  listsSection: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  listCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    width: "48%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: 16,
  },
  listContent: {
    // Contenido de la lista
  },
  listItem: {
    paddingVertical: 12,
  },
  listItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  listItemContent: {
    flex: 1,
    marginBottom: 8,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
    marginBottom: 4,
  },
  listItemDetail: {
    fontSize: 14,
    color: "#666",
  },
  listItemRight: {
    alignItems: "flex-end",
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600",
  },
  // Estados para incidencias
  statusResuelta: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  statusTextResuelta: {
    color: "#16a34a",
  },
  statusEnProceso: {
    backgroundColor: "rgba(234, 179, 8, 0.1)",
  },
  statusTextEnProceso: {
    color: "#ca8a04",
  },
  statusPendiente: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  statusTextPendiente: {
    color: "#2563eb",
  },
  // Estados para días económicos
  statusAprobado: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
  },
  statusTextAprobado: {
    color: "#16a34a",
  },
  listItemDate: {
    fontSize: 12,
    color: "#666",
  },
});