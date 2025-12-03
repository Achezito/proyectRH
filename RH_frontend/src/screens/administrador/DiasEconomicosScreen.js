// src/screens/docente/DiasEconomicosScreen.js
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  Clock,
  Plus,
  Filter,
  CheckCircle,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import DatePickerModal from "../../components/datepickermodal";

const DiasEconomicosScreen = () => {
  const { user } = useAuth();
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [fechaSolicitud, setFechaSolicitud] = useState(new Date());
  const [motivo, setMotivo] = useState("");
  const [estadisticas, setEstadisticas] = useState({
    total_periodo: 0,
    usados: 0,
    disponibles: 0,
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    es_mensual: false,
    tipo_contrato: "",
  });

  // Cargar datos
  const cargarDatos = async () => {
    try {
      if (!user?.docente_id) {
        Alert.alert("Error", "No se pudo identificar al docente");
        return;
      }

      setLoading(true);
      const response = await fetch(
        `http://10.194.1.108:5000/diasEconomicos/mis-solicitudes?docente_id=${user.docente_id}`
      );

      const data = await response.json();

      if (data.success) {
        setSolicitudes(data.data || []);
        if (data.estadisticas) {
          setEstadisticas(data.estadisticas);
          console.log("📊 Estadísticas cargadas:", data.estadisticas);
        }
      } else {
        Alert.alert("Error", data.error || "Error al cargar solicitudes");
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.docente_id) {
      cargarDatos();
    }
  }, [user]);

  const onRefresh = () => {
    setRefreshing(true);
    cargarDatos();
  };

  // Crear nueva solicitud
  const handleNuevaSolicitud = async () => {
    if (!motivo.trim()) {
      Alert.alert("Error", "Debe ingresar un motivo para la solicitud");
      return;
    }

    if (estadisticas.disponibles <= 0) {
      Alert.alert(
        "Sin días disponibles",
        "No tiene días económicos disponibles para solicitar"
      );
      return;
    }

    try {
      const solicitudData = {
        docente_id: user.docente_id,
        fecha: fechaSolicitud.toISOString().split("T")[0],
        motivo: motivo.trim(),
      };

      console.log("📤 Enviando solicitud:", solicitudData);

      const response = await fetch(
        "http://10.194.1.108:5000/diasEconomicos/solicitar",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(solicitudData),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert("Éxito", "Solicitud enviada para revisión");
        setModalVisible(false);
        setMotivo("");
        setFechaSolicitud(new Date());
        cargarDatos();
      } else {
        Alert.alert("Error", data.error || "No se pudo enviar la solicitud");
      }
    } catch (error) {
      console.error("Error enviando solicitud:", error);
      Alert.alert("Error", "Error de conexión con el servidor");
    }
  };

  // Cancelar solicitud pendiente
  const handleCancelarSolicitud = async (solicitudId) => {
    Alert.alert(
      "Cancelar Solicitud",
      "¿Está seguro de cancelar esta solicitud?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `http://10.194.1.108:5000/diasEconomicos/${solicitudId}/cancelar`,
                {
                  method: "PUT",
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert("Éxito", "Solicitud cancelada");
                cargarDatos();
              } else {
                Alert.alert("Error", data.error || "Error al cancelar");
              }
            } catch (error) {
              Alert.alert("Error", "Error de conexión");
            }
          },
        },
      ]
    );
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  // Renderizar tarjeta de solicitud
  const renderSolicitudCard = (solicitud) => {
    const getEstadoInfo = (estado) => {
      switch (estado?.toLowerCase()) {
        case "aprobado":
          return {
            color: "#059669",
            bgColor: "#d1fae5",
            icon: CheckCircle,
            label: "APROBADO",
          };
        case "rechazado":
          return {
            color: "#dc2626",
            bgColor: "#fee2e2",
            icon: XCircle,
            label: "RECHAZADO",
          };
        case "pendiente":
          return {
            color: "#d97706",
            bgColor: "#fef3c7",
            icon: Clock,
            label: "PENDIENTE",
          };
        case "cancelado":
          return {
            color: "#6b7280",
            bgColor: "#f3f4f6",
            icon: XCircle,
            label: "CANCELADO",
          };
        default:
          return {
            color: "#6b7280",
            bgColor: "#f3f4f6",
            icon: AlertCircle,
            label: estado?.toUpperCase() || "DESCONOCIDO",
          };
      }
    };

    const estadoInfo = getEstadoInfo(solicitud.estado);
    const EstadoIcon = estadoInfo.icon;

    return (
      <View
        key={solicitud.id}
        style={[
          styles.solicitudCard,
          { borderLeftColor: estadoInfo.color, borderLeftWidth: 4 },
        ]}
      >
        <View style={styles.solicitudHeader}>
          <View style={styles.fechaContainer}>
            <CalendarIcon size={16} color="#4b5563" />
            <Text style={styles.fechaText}>{formatDate(solicitud.fecha)}</Text>
          </View>

          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: estadoInfo.bgColor },
            ]}
          >
            <EstadoIcon size={12} color={estadoInfo.color} />
            <Text style={[styles.estadoText, { color: estadoInfo.color }]}>
              {estadoInfo.label}
            </Text>
          </View>
        </View>

        <Text style={styles.motivoText}>{solicitud.motivo}</Text>

        {solicitud.motivo_rechazo && (
          <View style={styles.rechazoContainer}>
            <AlertCircle size={14} color="#dc2626" />
            <Text style={styles.rechazoText}>
              Motivo rechazo: {solicitud.motivo_rechazo}
            </Text>
          </View>
        )}

        <View style={styles.solicitudFooter}>
          <Text style={styles.fechaCreado}>
            Solicitado:{" "}
            {new Date(solicitud.creado_en).toLocaleDateString("es-ES")}
          </Text>

          {solicitud.estado === "pendiente" && (
            <TouchableOpacity
              style={styles.cancelarButton}
              onPress={() => handleCancelarSolicitud(solicitud.id)}
            >
              <Text style={styles.cancelarButtonText}>Cancelar</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // Renderizar información del período
  const renderInfoPeriodo = () => {
    const contratoText =
      estadisticas.tipo_contrato?.charAt(0).toUpperCase() +
      estadisticas.tipo_contrato?.slice(1);
    const renovacionText = estadisticas.es_mensual
      ? " (renovación mensual)"
      : " (por período completo)";

    return (
      <View style={styles.infoPeriodoContainer}>
        <Text style={styles.infoPeriodoText}>
          Contrato: <Text style={styles.infoPeriodoBold}>{contratoText}</Text>
        </Text>
        <Text style={styles.infoPeriodoText}>
          Límite:{" "}
          <Text style={styles.infoPeriodoBold}>
            {estadisticas.total_periodo} días{renovacionText}
          </Text>
        </Text>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando días económicos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header con estadísticas */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Días Económicos</Text>
        {renderInfoPeriodo()}

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text
              style={[
                styles.statNumber,
                estadisticas.disponibles === 0 && styles.statNumberZero,
              ]}
            >
              {estadisticas.disponibles}
            </Text>
            <Text style={styles.statLabel}>Disponibles</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.usados}</Text>
            <Text style={styles.statLabel}>Usados</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{estadisticas.pendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.nuevaSolicitudButton,
            estadisticas.disponibles <= 0 && styles.buttonDisabled,
          ]}
          onPress={() => setModalVisible(true)}
          disabled={estadisticas.disponibles <= 0}
        >
          <Plus size={20} color="#fff" />
          <Text style={styles.nuevaSolicitudText}>Nueva Solicitud</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de solicitudes */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.seccionTitle}>Mis Solicitudes</Text>

        {solicitudes.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No hay solicitudes</Text>
            <Text style={styles.emptyStateText}>
              {estadisticas.disponibles > 0
                ? "Crea tu primera solicitud de día económico"
                : "No tienes días económicos disponibles para este período"}
            </Text>
          </View>
        ) : (
          solicitudes.map(renderSolicitudCard)
        )}
      </ScrollView>

      {/* Modal para nueva solicitud */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Nueva Solicitud de Día Económico
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <XCircle size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Fecha del día económico *</Text>
                <TouchableOpacity
                  style={styles.dateInput}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Calendar size={18} color="#6b7280" />
                  <Text style={styles.dateText}>
                    {fechaSolicitud.toLocaleDateString("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Motivo *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={motivo}
                  onChangeText={setMotivo}
                  placeholder="Describe el motivo de tu solicitud (ej: Asuntos personales, consulta médica, etc.)"
                  placeholderTextColor="#9ca3af"
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={styles.infoBox}>
                <Text style={styles.infoTitle}>Resumen de disponibilidad:</Text>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>• Días disponibles:</Text>
                  <Text
                    style={[
                      styles.infoValue,
                      {
                        color:
                          estadisticas.disponibles > 0 ? "#059669" : "#dc2626",
                      },
                    ]}
                  >
                    {estadisticas.disponibles}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>• Días usados:</Text>
                  <Text style={styles.infoValue}>{estadisticas.usados}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>
                    • Total por {estadisticas.es_mensual ? "mes" : "período"}:
                  </Text>
                  <Text style={styles.infoValue}>
                    {estadisticas.total_periodo}
                  </Text>
                </View>
                {estadisticas.es_mensual && (
                  <Text style={styles.infoNote}>
                    Nota: Tus días se renuevan mensualmente
                  </Text>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.submitButton}
                onPress={handleNuevaSolicitud}
                disabled={estadisticas.disponibles <= 0}
              >
                <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DatePickerModal */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={setFechaSolicitud}
        initialDate={fechaSolicitud}
      />
    </SafeAreaView>
  );
};

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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 8,
  },
  infoPeriodoContainer: {
    marginBottom: 16,
  },
  infoPeriodoText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 2,
  },
  infoPeriodoBold: {
    fontWeight: "600",
    color: "#374151",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statNumberZero: {
    color: "#dc2626",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
  },
  nuevaSolicitudButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  buttonDisabled: {
    backgroundColor: "#9ca3af",
    opacity: 0.7,
  },
  nuevaSolicitudText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  seccionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 16,
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
  // Tarjeta de solicitud
  solicitudCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderLeftWidth: 4,
  },
  solicitudHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  fechaContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  fechaText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  estadoText: {
    fontSize: 10,
    fontWeight: "600",
  },
  motivoText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    marginBottom: 8,
  },
  rechazoContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "#fef2f2",
    padding: 8,
    borderRadius: 6,
    marginBottom: 8,
  },
  rechazoText: {
    flex: 1,
    fontSize: 12,
    color: "#dc2626",
    lineHeight: 16,
  },
  solicitudFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  fechaCreado: {
    fontSize: 11,
    color: "#9ca3af",
  },
  cancelarButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#fef2f2",
    borderRadius: 6,
  },
  cancelarButtonText: {
    fontSize: 12,
    color: "#dc2626",
    fontWeight: "500",
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
    maxHeight: "80%",
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
  modalCloseButton: {
    padding: 4,
  },
  modalForm: {
    padding: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 8,
  },
  dateInput: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: "#374151",
    flex: 1,
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
  infoBox: {
    backgroundColor: "#f0f9ff",
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0369a1",
    marginBottom: 8,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  infoLabel: {
    fontSize: 14,
    color: "#374151",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
  },
  infoNote: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
    marginTop: 8,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
    alignItems: "center",
  },
  submitButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});

export default DiasEconomicosScreen;
