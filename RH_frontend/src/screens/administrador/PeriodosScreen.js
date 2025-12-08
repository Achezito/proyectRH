// EN LAS IMPORTACIONES, AGREGA:
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Calendar,
  Check,
  Edit2,
  Trash2,
  Plus,
  X,
  Calendar as CalendarIcon,
} from "lucide-react-native";
import { useAuth } from "../../context/AuthContext";
import DatePickerModal from "../../components/datepickermodal"; // Importar el componente

// AGREGAR ESTA IMPORTACIÓN:
import { API_BASE_URL } from "../../config/api";

export default function PeriodosScreen() {
  const { user } = useAuth();
  const [periodos, setPeriodos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // 'create' or 'edit'
  const [selectedPeriodo, setSelectedPeriodo] = useState(null);

  // Form state
  const [nombre, setNombre] = useState("");

  const [fechaInicio, setFechaInicio] = useState(new Date());
  const [fechaFin, setFechaFin] = useState(new Date());
  const [activo, setActivo] = useState(false);

  // Estado para el DatePickerModal
  const [showDatePicker, setShowDatePicker] = useState(null); // 'inicio' | 'fin' | null

  // Cargar períodos - MODIFICADO
  const fetchPeriodos = async () => {
    try {
      setLoading(true);

      // ANTES:
      // const response = await fetch("http://172.18.4.188:5000/periodos/");

      // DESPUÉS:
      const response = await fetch(`${API_BASE_URL}/periodos/`);

      const data = await response.json();

      if (data.success) {
        setPeriodos(data.data || []);
      } else {
        Alert.alert("Error", data.error || "Error al cargar períodos");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPeriodos();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchPeriodos();
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Calcular días restantes
  const calcularDiasRestantes = (fechaFin) => {
    if (!fechaFin) return 0;
    const hoy = new Date();
    const fin = new Date(fechaFin);
    const diffTime = fin - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  // Abrir modal para crear
  const handleCreate = () => {
    setModalMode("create");
    setNombre("");

    setFechaInicio(new Date());
    setFechaFin(new Date());
    setActivo(false);
    setSelectedPeriodo(null);
    setModalVisible(true);
  };

  const handleEdit = (periodo) => {
    setModalMode("edit");
    setSelectedPeriodo(periodo);
    setNombre(periodo.nombre || "");

    setFechaInicio(
      periodo.fecha_inicio ? new Date(periodo.fecha_inicio) : new Date()
    );
    setFechaFin(periodo.fecha_fin ? new Date(periodo.fecha_fin) : new Date());
    setActivo(periodo.activo || false); // Asegurar que sea booleano
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!nombre.trim()) {
      Alert.alert("Error", "El nombre es requerido");
      return;
    }

    if (fechaInicio >= fechaFin) {
      Alert.alert(
        "Error",
        "La fecha de inicio debe ser anterior a la fecha fin"
      );
      return;
    }

    // DEBUG: Mostrar datos que se enviarán
    console.log("📤 Datos a enviar:", {
      nombre: nombre.trim(),

      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      activo: activo,
    });
    const periodoData = {
      nombre: nombre.trim(),

      fecha_inicio: fechaInicio.toISOString(),
      fecha_fin: fechaFin.toISOString(),
      activo: activo, // Esto ya es booleano
    };

    try {
      // MODIFICADO: Usar API_BASE_URL
      const url =
        modalMode === "create"
          ? `${API_BASE_URL}/periodos/`
          : `${API_BASE_URL}/periodos/${selectedPeriodo.id}`;

      const method = modalMode === "create" ? "POST" : "PUT";

      console.log(`🔗 URL: ${url}, Método: ${method}`);

      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(periodoData),
      });

      console.log(`📥 Response status: ${response.status}`);

      // Intentar obtener texto primero para debug
      const responseText = await response.text();
      console.log(`📥 Response text: ${responseText}`);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("❌ Error parseando JSON:", parseError);
        throw new Error(
          `Respuesta inválida del servidor: ${responseText.substring(0, 100)}`
        );
      }

      if (!response.ok) {
        console.error("❌ Error en respuesta:", data);
        Alert.alert(
          "Error",
          data.error || `Error ${response.status}: ${response.statusText}`
        );
        return;
      }

      if (data.success) {
        Alert.alert("Éxito", data.message || "Período guardado exitosamente");
        setModalVisible(false);
        fetchPeriodos();
      } else {
        Alert.alert("Error", data.error || "Error al guardar el período");
      }
    } catch (error) {
      console.error("❌ Error en handleSave:", error);
      Alert.alert(
        "Error",
        error.message || "No se pudo conectar con el servidor"
      );
    }
  };

  // Activar período - MODIFICADO
  const handleActivar = async (periodoId) => {
    Alert.alert(
      "Activar Período",
      "¿Estás seguro de activar este período? Esto desactivará cualquier otro período activo.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Activar",
          style: "destructive",
          onPress: async () => {
            try {
              // ANTES:
              // const response = await fetch(`http://172.18.4.188:5000/periodos/${periodoId}/activar`, {...});

              // DESPUÉS:
              const response = await fetch(
                `${API_BASE_URL}/periodos/${periodoId}/activar`,
                {
                  method: "PUT",
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert(
                  "Éxito",
                  data.message || "Período activado exitosamente"
                );
                fetchPeriodos();
              } else {
                Alert.alert(
                  "Error",
                  data.error || "Error al activar el período"
                );
              }
            } catch (error) {
              Alert.alert("Error", "No se pudo conectar con el servidor");
            }
          },
        },
      ]
    );
  };

  // Eliminar período - MODIFICADO
  const handleDelete = async (periodoId) => {
    Alert.alert(
      "Eliminar Período",
      "¿Estás seguro de eliminar este período? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // ANTES:
              // const response = await fetch(`http://172.18.4.188:5000/periodos/${periodoId}`, {...});

              // DESPUÉS:
              const response = await fetch(
                `${API_BASE_URL}/periodos/${periodoId}`,
                {
                  method: "DELETE",
                }
              );

              const data = await response.json();

              if (data.success) {
                Alert.alert(
                  "Éxito",
                  data.message || "Período eliminado exitosamente"
                );
                fetchPeriodos();
              } else {
                Alert.alert(
                  "Error",
                  data.error || "Error al eliminar el período"
                );
              }
            } catch (error) {
              Alert.alert("Error", "No se pudo conectar con el servidor");
            }
          },
        },
      ]
    );
  };

  // Manejar selección de fecha desde DatePickerModal
  const handleDateSelect = (date, type) => {
    if (type === "inicio") {
      setFechaInicio(date);
    } else if (type === "fin") {
      setFechaFin(date);
    }
  };

  // Renderizar input de fecha
  const renderFechaInput = (label, value, type) => (
    <View style={styles.formGroup}>
      <Text style={styles.formLabel}>{label} *</Text>
      <TouchableOpacity
        style={styles.dateInput}
        onPress={() => setShowDatePicker(type)}
      >
        <CalendarIcon size={18} color="#6b7280" />
        <Text style={styles.dateText}>{value.toLocaleDateString("es-ES")}</Text>
      </TouchableOpacity>
    </View>
  );

  // Renderizar tarjeta de período
  const renderPeriodoCard = (periodo) => {
    const diasRestantes = calcularDiasRestantes(periodo.fecha_fin);
    const isActivo = periodo.activo === true; // Verificar explícitamente true

    return (
      <View
        key={periodo.id}
        style={[styles.card, isActivo && styles.cardActive]}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardTitleContainer}>
            <Text
              style={[styles.cardTitle, isActivo && styles.cardTitleActive]}
            >
              {periodo.nombre}
            </Text>
            {isActivo && (
              <View style={styles.badgeActive}>
                <Check size={12} color="#fff" />
                <Text style={styles.badgeText}>ACTIVO</Text>
              </View>
            )}
          </View>

          <View style={styles.cardActions}>
            {!isActivo && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleActivar(periodo.id)}
              >
                <Check size={18} color="#10b981" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEdit(periodo)}
            >
              <Edit2 size={18} color="#3b82f6" />
            </TouchableOpacity>

            {!isActivo && (
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleDelete(periodo.id)}
              >
                <Trash2 size={18} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.cardDates}>
          <View style={styles.dateItem}>
            <CalendarIcon size={14} color="#6b7280" />
            <Text style={styles.dateLabel}>Inicio:</Text>
            <Text style={styles.dateValue}>
              {formatDate(periodo.fecha_inicio)}
            </Text>
          </View>

          <View style={styles.dateItem}>
            <CalendarIcon size={14} color="#6b7280" />
            <Text style={styles.dateLabel}>Fin:</Text>
            <Text style={styles.dateValue}>
              {formatDate(periodo.fecha_fin)}
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.diasContainer}>
            <Text style={styles.diasLabel}>Días restantes:</Text>
            <Text
              style={[
                styles.diasValue,
                diasRestantes < 7 && styles.diasWarning,
              ]}
            >
              {diasRestantes}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Cargando períodos...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTitleContainer}>
          <Calendar size={24} color="#1f2937" />
          <Text style={styles.headerTitle}>Gestión de Períodos</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleCreate}>
          <Plus size={20} color="#fff" />
          <Text style={styles.addButtonText}>Nuevo Período</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Períodos */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {periodos.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No hay períodos</Text>
            <Text style={styles.emptyStateText}>
              Crea tu primer período para comenzar a gestionar incidencias
            </Text>
          </View>
        ) : (
          periodos.map(renderPeriodoCard)
        )}
      </ScrollView>

      {/* Modal para crear/editar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalMode === "create" ? "Nuevo Período" : "Editar Período"}
              </Text>
              <TouchableOpacity
                style={styles.modalCloseButton}
                onPress={() => setModalVisible(false)}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Form */}
            <ScrollView style={styles.modalForm}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Nombre *</Text>
                <TextInput
                  style={styles.formInput}
                  value={nombre}
                  onChangeText={setNombre}
                  placeholder="Ej: Primer Semestre 2024"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Fecha Inicio con DatePickerModal */}
              {renderFechaInput("Fecha Inicio", fechaInicio, "inicio")}

              {/* Fecha Fin con DatePickerModal */}
              {renderFechaInput("Fecha Fin", fechaFin, "fin")}

              <View style={styles.formGroup}>
                <TouchableOpacity
                  style={styles.checkboxContainer}
                  onPress={() => setActivo(!activo)}
                >
                  <View
                    style={[styles.checkbox, activo && styles.checkboxChecked]}
                  >
                    {activo && <Check size={14} color="#fff" />}
                  </View>
                  <Text style={styles.checkboxLabel}>
                    Marcar como período activo
                  </Text>
                </TouchableOpacity>
                <Text style={styles.checkboxHelp}>
                  Nota: Solo puede haber un período activo a la vez
                </Text>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <Text style={styles.saveButtonText}>
                  {modalMode === "create" ? "Crear Período" : "Guardar Cambios"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DatePickerModal para seleccionar fechas */}
      <DatePickerModal
        visible={showDatePicker !== null}
        onClose={() => setShowDatePicker(null)}
        onDateSelect={(date) => {
          if (showDatePicker === "inicio") {
            setFechaInicio(date);
          } else if (showDatePicker === "fin") {
            setFechaFin(date);
          }
        }}
        initialDate={
          showDatePicker === "inicio"
            ? fechaInicio
            : showDatePicker === "fin"
            ? fechaFin
            : new Date()
        }
      />
    </SafeAreaView>
  );
}

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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ef4444",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
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
    paddingHorizontal: 32,
  },
  // Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardActive: {
    borderColor: "#10b981",
    borderWidth: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  cardTitleActive: {
    color: "#059669",
  },
  badgeActive: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
  },
  badgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  cardActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionButton: {
    padding: 6,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
  },
  cardDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
    lineHeight: 20,
  },
  cardDates: {
    flexDirection: "row",
    gap: 16,
    marginBottom: 12,
  },
  dateItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 2,
  },
  dateValue: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  diasContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  diasLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  diasValue: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#059669",
  },
  diasWarning: {
    color: "#dc2626",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    padding: 16,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
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
  formInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
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
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#d1d5db",
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: "#ef4444",
    borderColor: "#ef4444",
  },
  checkboxLabel: {
    fontSize: 14,
    color: "#374151",
    fontWeight: "500",
  },
  checkboxHelp: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
    marginLeft: 28,
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
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "600",
    fontSize: 16,
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
  },
});
