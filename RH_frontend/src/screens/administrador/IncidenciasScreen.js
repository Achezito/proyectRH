// src/screens/administrador/IncidenciasScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import {
  AlertCircle,
  Filter,
  Search,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  Calendar,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from "lucide-react-native";
import Header from "../../components/header";

import { SafeAreaView } from "react-native-safe-area-context";
import ModalAprobar from "../../components/ModalAprobar";
import ModalDetallesIncidencia from "../../components/ModalDetallesIncidencias";
import FiltrosAvanzados from "../../components/FiltrosAvanzados";

const API_BASE_URL = "http://10.194.1.108:5000/admin";

export default function IncidenciasScreen() {
  const [incidencias, setIncidencias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [filtros, setFiltros] = useState({
    estado: "todos",
    tipo: "todos",
    fechaDesde: "",
    fechaHasta: "",
  });
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [modalAprobar, setModalAprobar] = useState(null);
  const [modalDetalles, setModalDetalles] = useState(null);
  const [estadisticas, setEstadisticas] = useState({
    pendientes: 0,
    aprobadas: 0,
    rechazadas: 0,
    total: 0,
  });

  // Cargar incidencias
  const cargarIncidencias = async () => {
    try {
      setLoading(true);

      let url = `${API_BASE_URL}/incidencias`;
      const params = new URLSearchParams();

      if (filtros.estado !== "todos") params.append("estado", filtros.estado);
      if (filtros.tipo !== "todos") params.append("tipo", filtros.tipo);
      if (filtros.fechaDesde) params.append("fecha_desde", filtros.fechaDesde);
      if (filtros.fechaHasta) params.append("fecha_hasta", filtros.fechaHasta);
      if (search) params.append("busqueda", search);

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.success) {
        setIncidencias(data.incidencias);
        setEstadisticas(data.estadisticas);
      }
    } catch (error) {
      console.error("Error cargando incidencias:", error);
      Alert.alert("Error", "No se pudieron cargar las incidencias");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Aprobar incidencia
  const aprobarIncidencia = async (id, observaciones = "") => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/incidencias/${id}/aprobar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ observaciones }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert("Éxito", "Incidencia aprobada");
        cargarIncidencias();
        setModalAprobar(null);
      } else {
        Alert.alert("Error", data.error || "No se pudo aprobar");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    }
  };

  // Rechazar incidencia
  const rechazarIncidencia = async (id, motivo = "") => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/incidencias/${id}/rechazar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ motivo }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert("Éxito", "Incidencia rechazada");
        cargarIncidencias();
        setModalAprobar(null);
      } else {
        Alert.alert("Error", data.error || "No se pudo rechazar");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    }
  };

  // Exportar a CSV
  const exportarCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/incidencias/exportar`);
      // Aquí implementarías la descarga del archivo
      Alert.alert("Éxito", "CSV generado correctamente");
    } catch (error) {
      Alert.alert("Error", "No se pudo exportar");
    }
  };

  // Cargar al inicio
  useEffect(() => {
    cargarIncidencias();
  }, [filtros]);

  // Formatear fecha
  const formatFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Formatear hora
  const formatHora = (hora) => {
    return hora ? hora.substring(0, 5) : "--:--";
  };

  // Obtener color según estado
  const getEstadoColor = (estado) => {
    switch (estado.toLowerCase()) {
      case "pendiente":
        return "#f59e0b";
      case "aprobada":
        return "#10b981";
      case "rechazada":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  // Obtener texto estado
  const getEstadoTexto = (estado) => {
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  // Obtener color según tipo
  const getTipoColor = (tipo) => {
    switch (tipo.toLowerCase()) {
      case "retardo":
        return "#3b82f6";
      case "falta":
        return "#ef4444";
      case "permiso":
        return "#8b5cf6";
      default:
        return "#6b7280";
    }
  };

  // Filtro por búsqueda
  const incidenciasFiltradas = incidencias.filter((incidencia) => {
    if (!search) return true;

    const textoBusqueda = search.toLowerCase();
    return (
      incidencia.docente.toLowerCase().includes(textoBusqueda) ||
      incidencia.motivo.toLowerCase().includes(textoBusqueda) ||
      incidencia.tipo.toLowerCase().includes(textoBusqueda)
    );
  });

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainWrapper}>
          <View style={styles.contentWrapper}>
            <Header title="Gestión de Incidencias" />
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={styles.loadingText}>Cargando incidencias...</Text>
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
          <Header title="Gestión de Incidencias" />

          {/* ESTADÍSTICAS RÁPIDAS */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{estadisticas.total}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#fef3c7" }]}>
              <Text style={[styles.statNumber, { color: "#d97706" }]}>
                {estadisticas.pendientes}
              </Text>
              <Text style={[styles.statLabel, { color: "#d97706" }]}>
                Pendientes
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#d1fae5" }]}>
              <Text style={[styles.statNumber, { color: "#059669" }]}>
                {estadisticas.aprobadas}
              </Text>
              <Text style={[styles.statLabel, { color: "#059669" }]}>
                Aprobadas
              </Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: "#fee2e2" }]}>
              <Text style={[styles.statNumber, { color: "#dc2626" }]}>
                {estadisticas.rechazadas}
              </Text>
              <Text style={[styles.statLabel, { color: "#dc2626" }]}>
                Rechazadas
              </Text>
            </View>
          </View>

          {/* BARRA DE BÚSQUEDA Y ACCIONES */}
          <View style={styles.actionBar}>
            <View style={styles.searchContainer}>
              <Search size={20} color="#6b7280" />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por docente, motivo..."
                value={search}
                onChangeText={setSearch}
                placeholderTextColor="#9ca3af"
              />
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#f3f4f6" }]}
                onPress={() => setMostrarFiltros(!mostrarFiltros)}
              >
                <Filter size={18} color="#374151" />
                <Text style={styles.actionButtonText}>Filtros</Text>
                {mostrarFiltros ? (
                  <ChevronUp size={16} />
                ) : (
                  <ChevronDown size={16} />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: "#3b82f6" }]}
                onPress={exportarCSV}
              >
                <Download size={18} color="#fff" />
                <Text style={[styles.actionButtonText, { color: "#fff" }]}>
                  Exportar
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* FILTROS AVANZADOS */}
          {mostrarFiltros && (
            <FiltrosAvanzados
              filtros={filtros}
              setFiltros={setFiltros}
              onAplicar={() => setMostrarFiltros(false)}
            />
          )}

          {/* LISTA DE INCIDENCIAS */}
          <ScrollView
            style={styles.scrollView}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => {
                  setRefreshing(true);
                  cargarIncidencias();
                }}
              />
            }
            showsVerticalScrollIndicator={false}
          >
            {incidenciasFiltradas.length === 0 ? (
              <View style={styles.emptyState}>
                <AlertCircle size={48} color="#9ca3af" />
                <Text style={styles.emptyStateTitle}>No hay incidencias</Text>
                <Text style={styles.emptyStateText}>
                  {search ||
                  Object.values(filtros).some((f) => f !== "todos" && f !== "")
                    ? "No se encontraron resultados con los filtros aplicados"
                    : "No hay incidencias registradas en el sistema"}
                </Text>
                <TouchableOpacity
                  style={styles.emptyStateButton}
                  onPress={() => {
                    setSearch("");
                    setFiltros({
                      estado: "todos",
                      tipo: "todos",
                      fechaDesde: "",
                      fechaHasta: "",
                    });
                  }}
                >
                  <Text style={styles.emptyStateButtonText}>
                    Limpiar filtros
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              incidenciasFiltradas.map((incidencia) => (
                <View key={incidencia.id} style={styles.incidenciaCard}>
                  {/* ENCABEZADO */}
                  <View style={styles.cardHeader}>
                    <View style={styles.docenteInfo}>
                      <User size={16} color="#4b5563" />
                      <Text style={styles.docenteNombre}>
                        {incidencia.docente}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.estadoBadge,
                        {
                          backgroundColor:
                            getEstadoColor(incidencia.estado) + "20",
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.estadoText,
                          { color: getEstadoColor(incidencia.estado) },
                        ]}
                      >
                        {getEstadoTexto(incidencia.estado)}
                      </Text>
                    </View>
                  </View>

                  {/* TIPO Y MOTIVO */}
                  <View style={styles.cardBody}>
                    <View style={styles.tipoContainer}>
                      <View
                        style={[
                          styles.tipoBadge,
                          {
                            backgroundColor:
                              getTipoColor(incidencia.tipo) + "20",
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.tipoText,
                            { color: getTipoColor(incidencia.tipo) },
                          ]}
                        >
                          {incidencia.tipo}
                        </Text>
                      </View>

                      {incidencia.minutos && (
                        <View style={styles.minutosContainer}>
                          <Clock size={14} color="#dc2626" />
                          <Text style={styles.minutosText}>
                            {incidencia.minutos} min
                          </Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.motivoText}>{incidencia.motivo}</Text>

                    {/* FECHAS Y HORAS */}
                    <View style={styles.datesContainer}>
                      <View style={styles.dateItem}>
                        <Calendar size={14} color="#6b7280" />
                        <Text style={styles.dateText}>
                          {formatFecha(incidencia.fecha)}
                        </Text>
                      </View>

                      {incidencia.hora_entrada && (
                        <View style={styles.dateItem}>
                          <Clock size={14} color="#6b7280" />
                          <Text style={styles.dateText}>
                            Entrada: {formatHora(incidencia.hora_entrada)}
                          </Text>
                        </View>
                      )}

                      {incidencia.hora_salida && (
                        <View style={styles.dateItem}>
                          <Clock size={14} color="#6b7280" />
                          <Text style={styles.dateText}>
                            Salida: {formatHora(incidencia.hora_salida)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* ACCIONES */}
                  <View style={styles.cardActions}>
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={() => setModalDetalles(incidencia)}
                    >
                      <Eye size={18} color="#3b82f6" />
                      <Text style={styles.actionIconText}>Ver</Text>
                    </TouchableOpacity>

                    {incidencia.estado === "pendiente" && (
                      <>
                        <TouchableOpacity
                          style={styles.actionIcon}
                          onPress={() =>
                            setModalAprobar({
                              ...incidencia,
                              accion: "aprobar",
                            })
                          }
                        >
                          <CheckCircle size={18} color="#10b981" />
                          <Text
                            style={[
                              styles.actionIconText,
                              { color: "#10b981" },
                            ]}
                          >
                            Aprobar
                          </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          style={styles.actionIcon}
                          onPress={() =>
                            setModalAprobar({
                              ...incidencia,
                              accion: "rechazar",
                            })
                          }
                        >
                          <XCircle size={18} color="#ef4444" />
                          <Text
                            style={[
                              styles.actionIconText,
                              { color: "#ef4444" },
                            ]}
                          >
                            Rechazar
                          </Text>
                        </TouchableOpacity>
                      </>
                    )}
                  </View>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      </View>

      {/* MODAL APROBAR/RECHAZAR */}
      {modalAprobar && (
        <ModalAprobar
          visible={!!modalAprobar}
          incidencia={modalAprobar}
          onClose={() => setModalAprobar(null)}
          onAprobar={(observaciones) =>
            aprobarIncidencia(modalAprobar.id, observaciones)
          }
          onRechazar={(motivo) => rechazarIncidencia(modalAprobar.id, motivo)}
        />
      )}

      {/* MODAL VER DETALLES */}
      {modalDetalles && (
        <ModalDetallesIncidencia
          visible={!!modalDetalles}
          incidencia={modalDetalles}
          onClose={() => setModalDetalles(null)}
          onAprobar={(observaciones) =>
            aprobarIncidencia(modalDetalles.id, observaciones)
          }
          onRechazar={(motivo) => rechazarIncidencia(modalDetalles.id, motivo)}
        />
      )}
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
  // ESTADÍSTICAS
  statsContainer: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: "#f3f4f6",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  // BARRA DE ACCIONES
  actionBar: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#1f2937",
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  actionButtonText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  // LISTA
  scrollView: {
    flex: 1,
  },
  // TARJETA DE INCIDENCIA
  incidenciaCard: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#f3f4f6",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  docenteInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  docenteNombre: {
    marginLeft: 6,
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  estadoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  cardBody: {
    marginBottom: 16,
  },
  tipoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  tipoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  tipoText: {
    fontSize: 12,
    fontWeight: "600",
  },
  minutosContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  minutosText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
  },
  motivoText: {
    fontSize: 14,
    color: "#4b5563",
    marginBottom: 12,
    lineHeight: 20,
  },
  datesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#6b7280",
  },
  cardActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
    paddingTop: 12,
  },
  actionIcon: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 16,
  },
  actionIconText: {
    marginLeft: 4,
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
  },
  // ESTADO VACÍO
  emptyState: {
    alignItems: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  emptyStateButton: {
    backgroundColor: "#3b82f6",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  emptyStateButtonText: {
    color: "#fff",
    fontWeight: "500",
  },
});
