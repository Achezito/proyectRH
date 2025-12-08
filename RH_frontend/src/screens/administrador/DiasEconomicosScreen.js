import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Filter,
  Search,
  ChevronRight,
  Clock,
  FileText,
  Users,
  BarChart3,
  X,
  Check,
  Eye,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";

// AGREGAR ESTA IMPORTACIÓN:
import { API_BASE_URL } from "../../config/api";

const DiasEconomicosAdminScreen = () => {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [estadisticas, setEstadisticas] = useState({
    total_solicitudes: 0,
    aprobados: 0,
    pendientes: 0,
    rechazados: 0,
    cancelados: 0,
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterEstado, setFilterEstado] = useState("pendiente");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [allSolicitudes, setAllSolicitudes] = useState([]);
  const [showAllSolicitudes, setShowAllSolicitudes] = useState(false);
  const [loadingAll, setLoadingAll] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedForDetail, setSelectedForDetail] = useState(null);

  // Cargar TODAS las solicitudes del período - MODIFICADO
  const cargarTodasSolicitudes = async () => {
    try {
      setLoadingAll(true);

      // ANTES:
      // const response = await fetch("http://172.18.4.188:5000/diasEconomicos/resumen-periodo");

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/resumen-periodo`
      );

      const data = await response.json();
      console.log(
        "📊 Datos crudos recibidos:",
        JSON.stringify(data.data?.docentes, null, 2)
      );

      if (data.success) {
        const todasSolicitudes = [];
        if (data.data && data.data.docentes) {
          data.data.docentes.forEach((docenteData) => {
            if (
              docenteData.solicitudes &&
              Array.isArray(docenteData.solicitudes)
            ) {
              docenteData.solicitudes.forEach((solicitud) => {
                // Usar la información del docente del objeto principal
                todasSolicitudes.push({
                  ...solicitud,
                  DOCENTES: docenteData.docente || {},
                });
              });
            }
          });
        }
        setAllSolicitudes(todasSolicitudes);
        console.log(
          "📋 Todas las solicitudes procesadas:",
          todasSolicitudes.length,
          todasSolicitudes
        );
      } else {
        Alert.alert(
          "Error",
          data.error || "Error al cargar todas las solicitudes"
        );
      }
    } catch (error) {
      console.error("Error cargando todas las solicitudes:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoadingAll(false);
    }
  };

  // Cargar solicitudes según el filtro - MODIFICADO
  const cargarSolicitudes = async () => {
    try {
      setLoading(true);

      if (filterEstado === "pendiente" || filterEstado === "todos") {
        // ANTES:
        // const response = await fetch("http://172.18.4.188:5000/diasEconomicos/pendientes");

        // DESPUÉS:
        const response = await fetch(
          `${API_BASE_URL}/diasEconomicos/pendientes`
        );

        const data = await response.json();

        if (data.success) {
          if (filterEstado === "pendiente") {
            setSolicitudes(data.data || []);
          } else if (filterEstado === "todos") {
            // Para "todos", cargamos del resumen
            const todasSolicitudes = [];
            if (allSolicitudes.length === 0) {
              await cargarTodasSolicitudes();
            }
            setSolicitudes(allSolicitudes);
          }
        } else {
          Alert.alert("Error", data.error || "Error al cargar solicitudes");
        }
      } else {
        // Para otros estados, filtramos de todas las solicitudes
        if (allSolicitudes.length === 0) {
          await cargarTodasSolicitudes();
        }
        const filtradas = allSolicitudes.filter(
          (s) => s.estado === filterEstado
        );
        setSolicitudes(filtradas);
      }
    } catch (error) {
      console.error("Error cargando solicitudes:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Cargar estadísticas del período - MODIFICADO
  const cargarEstadisticas = async () => {
    try {
      // ANTES:
      // const response = await fetch("http://172.18.4.188:5000/diasEconomicos/resumen-periodo");

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/resumen-periodo`
      );

      const data = await response.json();

      if (data.success) {
        setEstadisticas(data.data?.estadisticas || {});
        console.log("📈 Estadísticas cargadas:", data.data?.estadisticas);
      }
    } catch (error) {
      console.error("Error cargando estadísticas:", error);
    }
  };

  useEffect(() => {
    if (user) {
      cargarSolicitudes();
      cargarEstadisticas();
      cargarTodasSolicitudes();
    }
  }, [user, filterEstado]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarSolicitudes();
    cargarEstadisticas();
    cargarTodasSolicitudes();
  };

  // Función DIRECTA para aprobar (sin Alert) - MODIFICADO
  const aprobarSolicitudDirecta = async (solicitudId) => {
    console.log("🟢 APROBANDO DIRECTAMENTE ID:", solicitudId);
    try {
      // ANTES:
      // const response = await fetch(`http://172.18.4.188:5000/diasEconomicos/${solicitudId}/aprobar`, {...});

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/${solicitudId}/aprobar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      console.log("📩 Respuesta aprobación directa:", data);

      if (data.success) {
        Alert.alert("✅ Éxito", "Solicitud aprobada");
        cargarSolicitudes();
        cargarEstadisticas();
        cargarTodasSolicitudes();
      } else {
        Alert.alert("❌ Error", data.error || "Error al aprobar");
      }
    } catch (error) {
      console.error("Error aprobando directo:", error);
      Alert.alert("Error", "Error de conexión");
    }
  };

  // Función DIRECTA para rechazar (sin Alert) - MODIFICADO
  const rechazarSolicitudDirecta = async (solicitudId) => {
    console.log("🔴 RECHAZANDO DIRECTAMENTE ID:", solicitudId);
    try {
      // ANTES:
      // const response = await fetch(`http://172.18.4.188:5000/diasEconomicos/${solicitudId}/rechazar`, {...});

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/${solicitudId}/rechazar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();
      console.log("📩 Respuesta rechazo directo:", data);

      if (data.success) {
        Alert.alert("✅ Éxito", "Solicitud rechazada");
        cargarSolicitudes();
        cargarEstadisticas();
        cargarTodasSolicitudes();
      } else {
        Alert.alert("❌ Error", data.error || "Error al rechazar");
      }
    } catch (error) {
      console.error("Error rechazando directo:", error);
      Alert.alert("Error", "Error de conexión");
    }
  };

  // Y también agrega esta función de prueba para rechazar: - MODIFICADO
  const testRechazarDirecto = async (solicitudId) => {
    console.log("🧪 Rechazando directamente ID:", solicitudId);
    try {
      // ANTES:
      // const response = await fetch(`http://172.18.4.188:5000/diasEconomicos/${solicitudId}/rechazar`, {...});

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/${solicitudId}/rechazar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        }
      );

      const data = await response.json();
      console.log("🧪 Resultado rechazo:", data);
      if (data.success) {
        Alert.alert("🧪 Test Rechazar", "¡Funcionó!");
        cargarSolicitudes();
        cargarTodasSolicitudes();
      }
    } catch (error) {
      console.error("🧪 Error rechazo:", error);
    }
  };

  // Formatear fecha
  // Formatear fecha - VERSIÓN MEJORADA
  const formatDate = (dateString) => {
    if (!dateString) return "";

    try {
      // Manejar diferentes formatos de fecha
      let date;
      if (typeof dateString === "string") {
        // Remover la parte de timezone si existe
        const cleanDateString = dateString.split("+")[0].split("T")[0];
        date = new Date(cleanDateString + "T00:00:00");
      } else {
        date = new Date(dateString);
      }

      // Verificar si la fecha es válida
      if (isNaN(date.getTime())) {
        console.warn("Fecha inválida:", dateString);
        return "Fecha inválida";
      }

      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch (error) {
      console.error("Error formateando fecha:", error, dateString);
      return dateString || "";
    }
  };

  // Función para obtener el color según estado
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "pendiente":
        return { bg: "#fef3c7", text: "#92400e", icon: "clock" };
      case "aprobado":
        return { bg: "#d1fae5", text: "#065f46", icon: "check" };
      case "rechazado":
        return { bg: "#fee2e2", text: "#991b1b", icon: "x" };
      case "cancelado":
        return { bg: "#e5e7eb", text: "#374151", icon: "x" };
      default:
        return { bg: "#f3f4f6", text: "#6b7280", icon: "alert" };
    }
  };

  // MODIFICADO
  const testAprobarDirecto = async (solicitudId) => {
    console.log("🧪 Aprobando directamente ID:", solicitudId);
    try {
      // ANTES:
      // const response = await fetch(`http://172.18.4.188:5000/diasEconomicos/${solicitudId}/aprobar`, {...});

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/${solicitudId}/aprobar`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
        }
      );

      const data = await response.json();
      console.log("🧪 Resultado:", data);
      if (data.success) {
        Alert.alert("🧪 Test", "Funcionó!");
        cargarSolicitudes();
      }
    } catch (error) {
      console.error("🧪 Error:", error);
    }
  };
  // Renderizar tarjeta de solicitud
  // REEMPLAZA completamente la función renderSolicitudCard con esto:

  const renderSolicitudCard = (solicitud) => {
    const docente = solicitud.DOCENTES || {};
    const nombreCompleto =
      `${docente.nombre || ""} ${docente.apellido || ""}`.trim() ||
      "Docente no disponible";

    const estadoColor = getEstadoColor(solicitud.estado);
    const isPendiente = solicitud.estado === "pendiente";

    return (
      <View key={solicitud.id} style={styles.solicitudCard}>
        {/* Primera parte: Información de la solicitud */}
        <View style={styles.solicitudContent}>
          <View style={styles.solicitudHeader}>
            <View style={styles.docenteInfo}>
              <User size={16} color="#4b5563" />
              <Text style={styles.docenteNombre} numberOfLines={1}>
                {nombreCompleto}
              </Text>
              <View
                style={[
                  styles.estadoBadge,
                  { backgroundColor: estadoColor.bg },
                ]}
              >
                <Text style={[styles.estadoText, { color: estadoColor.text }]}>
                  {solicitud.estado.charAt(0).toUpperCase() +
                    solicitud.estado.slice(1)}
                </Text>
              </View>
            </View>
            <View style={styles.fechaContainer}>
              <Calendar size={14} color="#6b7280" />
              <Text style={styles.fechaText}>
                {formatDate(solicitud.fecha)}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            onPress={() => {
              console.log("📄 Tarjeta presionada para detalles:", solicitud.id);
              setSelectedForDetail(solicitud);
              setShowDetailModal(true);
            }}
            activeOpacity={0.7}
            style={styles.detailArea}
          >
            <Text style={styles.motivoText} numberOfLines={2}>
              {solicitud.motivo || "Sin motivo especificado"}
            </Text>

            <View style={styles.solicitudFooter}>
              <Text style={styles.creadoText}>
                Solicitado: {formatDate(solicitud.creado_en)}
              </Text>
              <ChevronRight size={14} color="#9ca3af" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Segunda parte: Botones de acción - SEPARADOS */}
        {isPendiente && (
          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton]}
              onPress={() => {
                console.log("✅ Botón APROBAR presionado para:", solicitud.id);
                // Llama directamente a la función, sin Alert (por ahora)
                aprobarSolicitudDirecta(solicitud.id);
              }}
              onPressIn={(e) => {
                console.log("🖱️ Botón APROBAR presionado (onPressIn)");
                e.stopPropagation();
              }}
              activeOpacity={0.6}
            >
              <CheckCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Aprobar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton]}
              onPress={() => {
                console.log("❌ Botón RECHAZAR presionado para:", solicitud.id);
                // Llama directamente a la función, sin Alert (por ahora)
                rechazarSolicitudDirecta(solicitud.id);
              }}
              onPressIn={(e) => {
                console.log("🖱️ Botón RECHAZAR presionado (onPressIn)");
                e.stopPropagation();
              }}
              activeOpacity={0.6}
            >
              <XCircle size={18} color="#fff" />
              <Text style={styles.actionButtonText}>Rechazar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Filtrar solicitudes
  const solicitudesFiltradas = solicitudes.filter((solicitud) => {
    // Filtro por estado ya aplicado en cargarSolicitudes
    if (filterEstado !== "todos" && filterEstado !== solicitud.estado) {
      return false;
    }

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const docente = solicitud.DOCENTES || {};
      const nombreCompleto = `${docente.nombre || ""} ${
        docente.apellido || ""
      }`.toLowerCase();
      const motivo = (solicitud.motivo || "").toLowerCase();
      const query = searchQuery.toLowerCase();

      return nombreCompleto.includes(query) || motivo.includes(query);
    }

    return true;
  });

  // Modal de filtros
  const renderFilterModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showFilterModal}
      onRequestClose={() => setShowFilterModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtrar por estado</Text>
            <TouchableOpacity onPress={() => setShowFilterModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <View style={styles.filterOptions}>
            {[
              { value: "pendiente", label: "Pendientes", color: "#f59e0b" },
              { value: "aprobado", label: "Aprobados", color: "#10b981" },
              { value: "rechazado", label: "Rechazados", color: "#ef4444" },
              { value: "cancelado", label: "Cancelados", color: "#6b7280" },
              { value: "todos", label: "Todos los estados", color: "#3b82f6" },
            ].map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.filterOption,
                  filterEstado === option.value && styles.filterOptionSelected,
                ]}
                onPress={() => {
                  setFilterEstado(option.value);
                  setShowFilterModal(false);
                }}
              >
                <View
                  style={[styles.filterDot, { backgroundColor: option.color }]}
                />
                <Text style={styles.filterOptionText}>{option.label}</Text>
                {filterEstado === option.value && (
                  <Check size={20} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );

  // Modal de detalles
  const renderDetailModal = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showDetailModal}
      onRequestClose={() => setShowDetailModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.detailModalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles de la solicitud</Text>
            <TouchableOpacity onPress={() => setShowDetailModal(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedForDetail && (
            <ScrollView style={styles.detailContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Información del docente
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Nombre:</Text>
                  <Text style={styles.detailValue}>
                    {selectedForDetail.DOCENTES
                      ? `${selectedForDetail.DOCENTES.nombre} ${selectedForDetail.DOCENTES.apellido}`
                      : "No disponible"}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>
                    {selectedForDetail.DOCENTES?.correo_institucional ||
                      "No disponible"}
                  </Text>
                </View>
              </View>

              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>
                  Información de la solicitud
                </Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Fecha solicitada:</Text>
                  <Text style={styles.detailValue}>
                    {formatDate(selectedForDetail.fecha)}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Estado:</Text>
                  <View
                    style={[
                      styles.estadoBadge,
                      {
                        backgroundColor: getEstadoColor(
                          selectedForDetail.estado
                        ).bg,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.estadoText,
                        {
                          color: getEstadoColor(selectedForDetail.estado).text,
                        },
                      ]}
                    >
                      {selectedForDetail.estado.charAt(0).toUpperCase() +
                        selectedForDetail.estado.slice(1)}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Solicitado el:</Text>
                  <Text style={styles.detailValue}>
                    {new Date(selectedForDetail.creado_en).toLocaleDateString(
                      "es-ES"
                    )}
                  </Text>
                </View>
              </View>

              {selectedForDetail.estado === "pendiente" && (
                <View style={styles.detailActions}>
                  <TouchableOpacity
                    style={[styles.detailButton, styles.approveButton]}
                    onPress={() => {
                      setShowDetailModal(false);
                      handleAprobarSolicitud(selectedForDetail.id);
                    }}
                  >
                    <CheckCircle size={20} color="#fff" />
                    <Text style={styles.detailButtonText}>Aprobar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.detailButton, styles.rejectButton]}
                    onPress={() => {
                      setShowDetailModal(false);
                      setSelectedSolicitud(selectedForDetail);
                      setModalVisible(true);
                    }}
                  >
                    <XCircle size={20} color="#fff" />
                    <Text style={styles.detailButtonText}>Rechazar</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );

  if (loading && filterEstado === "pendiente") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando solicitudes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Días Económicos - Admin</Text>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Filtro activo */}
        <View style={styles.activeFilterContainer}>
          <Text style={styles.activeFilterLabel}>Filtro activo:</Text>
          <View
            style={[
              styles.activeFilterBadge,
              { backgroundColor: getEstadoColor(filterEstado).bg },
            ]}
          >
            <Text
              style={[
                styles.activeFilterText,
                { color: getEstadoColor(filterEstado).text },
              ]}
            >
              {filterEstado === "todos"
                ? "Todos los estados"
                : filterEstado.charAt(0).toUpperCase() + filterEstado.slice(1)}
            </Text>
            <TouchableOpacity
              onPress={() => setFilterEstado("pendiente")}
              style={styles.clearFilterButton}
            >
              <X size={12} color={getEstadoColor(filterEstado).text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Barra de búsqueda */}
        <View style={styles.searchContainer}>
          <Search size={18} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por docente o motivo..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#9ca3af"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Estadísticas rápidas */}
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setFilterEstado("pendiente")}
          >
            <Text style={styles.statNumber}>
              {estadisticas.pendientes || 0}
            </Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setFilterEstado("aprobado")}
          >
            <Text style={styles.statNumber}>{estadisticas.aprobados || 0}</Text>
            <Text style={styles.statLabel}>Aprobados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setFilterEstado("rechazado")}
          >
            <Text style={styles.statNumber}>
              {estadisticas.rechazados || 0}
            </Text>
            <Text style={styles.statLabel}>Rechazados</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => setFilterEstado("todos")}
          >
            <Text style={styles.statNumber}>
              {estadisticas.total_solicitudes || 0}
            </Text>
            <Text style={styles.statLabel}>Total</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Lista de solicitudes */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {filterEstado === "todos"
              ? "Todas las solicitudes"
              : `Solicitudes ${
                  filterEstado.charAt(0).toUpperCase() + filterEstado.slice(1)
                }`}
            ({solicitudesFiltradas.length})
          </Text>
          <TouchableOpacity
            style={styles.viewAllButton}
            onPress={() => setShowFilterModal(true)}
          >
            <Text style={styles.viewAllText}>Filtrar</Text>
            <Filter size={14} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {loadingAll && filterEstado !== "pendiente" ? (
          <View style={styles.loadingMoreContainer}>
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text style={styles.loadingMoreText}>Cargando...</Text>
          </View>
        ) : solicitudesFiltradas.length === 0 ? (
          <View style={styles.emptyState}>
            <FileText size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>
              {searchQuery
                ? "No se encontraron resultados"
                : `No hay solicitudes ${
                    filterEstado === "todos" ? "" : filterEstado
                  }`}
            </Text>
            <Text style={styles.emptyStateText}>
              {searchQuery
                ? "Intenta con otros términos de búsqueda"
                : `No hay solicitudes con estado "${filterEstado}" en este momento`}
            </Text>
          </View>
        ) : (
          solicitudesFiltradas.map(renderSolicitudCard)
        )}
      </ScrollView>

      {/* Modal para rechazar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => {
          setModalVisible(false);
          setMotivoRechazo("");
          setSelectedSolicitud(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Rechazar Solicitud</Text>
              <TouchableOpacity
                onPress={() => {
                  setModalVisible(false);
                  setMotivoRechazo("");
                  setSelectedSolicitud(null);
                }}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {selectedSolicitud && (
              <>
                <View style={styles.solicitudInfo}>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Docente:</Text>
                    <Text style={styles.infoValue}>
                      {selectedSolicitud.DOCENTES
                        ? `${selectedSolicitud.DOCENTES.nombre} ${selectedSolicitud.DOCENTES.apellido}`
                        : "No disponible"}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Fecha solicitada:</Text>
                    <Text style={styles.infoValue}>
                      {formatDate(selectedSolicitud.fecha)}
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Motivo del docente:</Text>
                    <Text style={styles.infoValue}>
                      {selectedSolicitud.motivo || "Sin motivo"}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalButtons}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelModalButton]}
                    onPress={() => {
                      setModalVisible(false);
                      setMotivoRechazo("");
                      setSelectedSolicitud(null);
                    }}
                  >
                    <Text style={styles.cancelModalButtonText}>Cancelar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.rejectModalButton]}
                    onPress={handleRechazarSolicitud}
                  >
                    <Text style={styles.rejectModalButtonText}>
                      Rechazar Solicitud
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Modales adicionales */}
      {renderFilterModal()}
      {renderDetailModal()}
    </SafeAreaView>
  );
};

const { width } = Dimensions.get("window");

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
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
  header: {
    backgroundColor: "#fff",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
  },
  filterButton: {
    padding: 8,
  },
  activeFilterContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  activeFilterLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginRight: 8,
  },
  activeFilterBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
  },
  activeFilterText: {
    fontSize: 12,
    fontWeight: "500",
    marginRight: 6,
  },
  clearFilterButton: {
    padding: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: "#374151",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statCard: {
    alignItems: "center",
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e40af",
  },
  statLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    textAlign: "center",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  viewAllButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewAllText: {
    fontSize: 14,
    color: "#3b82f6",
    marginRight: 4,
  },
  solicitudCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  solicitudHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  docenteInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
    flexWrap: "wrap",
  },
  docenteNombre: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
    marginRight: 8,
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  estadoText: {
    fontSize: 10,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  fechaContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fechaText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 4,
  },
  motivoText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 12,
  },
  solicitudFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  creadoText: {
    fontSize: 11,
    color: "#9ca3af",
  },
  actionsContainer: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 4,
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  loadingMoreContainer: {
    padding: 20,
    alignItems: "center",
  },
  loadingMoreText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  filterModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "60%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  detailModalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
  },
  filterOptions: {
    padding: 20,
  },
  filterOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  filterOptionSelected: {
    borderColor: "#3b82f6",
    backgroundColor: "#eff6ff",
  },
  filterDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  filterOptionText: {
    fontSize: 16,
    color: "#1f2937",
    flex: 1,
  },
  solicitudInfo: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
  },
  formGroup: {
    padding: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  formHint: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    fontStyle: "italic",
  },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  modalButtons: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelModalButton: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelModalButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  rejectModalButton: {
    backgroundColor: "#ef4444",
  },
  rejectModalButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  // Detail modal styles
  detailContent: {
    padding: 20,
  },
  detailSection: {
    marginBottom: 24,
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    width: 120,
  },
  detailValue: {
    fontSize: 14,
    color: "#4b5563",
    flex: 1,
  },
  motivoContainer: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  motivoDetailText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
  },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  detailButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  detailButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
    minHeight: 36, // Asegurar altura mínima
  },
  actionButtonText: {
    fontSize: 13,
    color: "#fff",
    fontWeight: "600",
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },

  // Asegúrate de que la tarjeta tenga un z-index adecuado
  solicitudCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    position: "relative", // Importante
    zIndex: 1,
  },

  // Agrega un efecto visual para los botones presionados
  pressedButton: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

export default DiasEconomicosAdminScreen;
