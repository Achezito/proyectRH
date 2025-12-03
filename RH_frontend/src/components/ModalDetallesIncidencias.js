import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const ModalDetallesIncidencia = ({
  visible,
  incidencia,
  onClose,
  onAprobar,
  onRechazar,
}) => {
  const [observaciones, setObservaciones] = useState("");
  const [showAcciones, setShowAcciones] = useState(false);

  if (!visible || !incidencia) return null;

  const formatFecha = (fecha) => {
    if (!fecha) return "No especificada";
    try {
      const date = new Date(fecha);
      return date.toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fecha;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "pendiente":
        return "#f39c12";
      case "aprobada":
        return "#27ae60";
      case "rechazada":
        return "#e74c3c";
      default:
        return "#7f8c8d";
    }
  };

  const getEstadoTexto = (estado) => {
    if (!estado) return "Desconocido";
    return estado.charAt(0).toUpperCase() + estado.slice(1);
  };

  const handleAprobar = () => {
    if (incidencia.estado?.toLowerCase() !== "pendiente") {
      Alert.alert("Info", "Esta incidencia ya ha sido procesada");
      return;
    }

    if (onAprobar) {
      onAprobar(observaciones);
      setObservaciones("");
      setShowAcciones(false);
    }
  };

  const handleRechazar = () => {
    if (incidencia.estado?.toLowerCase() !== "pendiente") {
      Alert.alert("Info", "Esta incidencia ya ha sido procesada");
      return;
    }

    if (onRechazar) {
      onRechazar(observaciones);
      setObservaciones("");
      setShowAcciones(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Encabezado */}
          <View style={styles.header}>
            <Icon name="info" size={24} color="#3498db" />
            <Text style={styles.title}>Detalles de Incidencia</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollView}>
            {/* Información básica */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Información General</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Docente:</Text>
                <Text style={styles.detailValue}>
                  {incidencia.docente || "No especificado"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={[styles.detailValue, styles.tipoText]}>
                  {incidencia.tipo || "Sin tipo"}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>
                  {formatFecha(incidencia.fecha)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View
                  style={[
                    styles.estadoBadge,
                    { backgroundColor: getEstadoColor(incidencia.estado) },
                  ]}
                >
                  <Text style={styles.estadoText}>
                    {getEstadoTexto(incidencia.estado)}
                  </Text>
                </View>
              </View>

              {incidencia.minutos && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Minutos de retardo:</Text>
                  <Text style={styles.detailValue}>
                    {incidencia.minutos} min
                  </Text>
                </View>
              )}
            </View>

            {/* Motivo y justificación */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Motivo</Text>
              <Text style={styles.motivoText}>
                {incidencia.motivo || "Sin motivo especificado"}
              </Text>
            </View>

            {incidencia.justificaciones && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Justificaciones</Text>
                <Text style={styles.justificacionText}>
                  {incidencia.justificaciones}
                </Text>
              </View>
            )}

            {/* Horarios */}
            {(incidencia.hora_entrada || incidencia.hora_salida) && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Horarios</Text>
                {incidencia.hora_entrada && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hora de entrada:</Text>
                    <Text style={styles.detailValue}>
                      {incidencia.hora_entrada}
                    </Text>
                  </View>
                )}
                {incidencia.hora_salida && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Hora de salida:</Text>
                    <Text style={styles.detailValue}>
                      {incidencia.hora_salida}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Observaciones para aprobar/rechazar */}
            {incidencia.estado?.toLowerCase() === "pendiente" && (
              <View style={styles.section}>
                <TouchableOpacity
                  style={styles.toggleAcciones}
                  onPress={() => setShowAcciones(!showAcciones)}
                >
                  <Text style={styles.toggleAccionesText}>
                    {showAcciones ? "Ocultar acciones" : "Mostrar acciones"}
                  </Text>
                  <Icon
                    name={
                      showAcciones ? "keyboard-arrow-up" : "keyboard-arrow-down"
                    }
                    size={20}
                    color="#3498db"
                  />
                </TouchableOpacity>

                {showAcciones && (
                  <>
                    <Text style={styles.sectionTitle}>Observaciones</Text>
                    <TextInput
                      style={styles.textArea}
                      value={observaciones}
                      onChangeText={setObservaciones}
                      placeholder="Ingrese observaciones (opcional)"
                      multiline
                      numberOfLines={4}
                      placeholderTextColor="#999"
                    />
                  </>
                )}
              </View>
            )}
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.buttonsContainer}>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>

            {incidencia.estado?.toLowerCase() === "pendiente" &&
              showAcciones && (
                <>
                  <TouchableOpacity
                    style={[styles.button, styles.rejectButton]}
                    onPress={handleRechazar}
                  >
                    <Icon name="cancel" size={18} color="#fff" />
                    <Text style={styles.rejectText}>Rechazar</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.approveButton]}
                    onPress={handleAprobar}
                  >
                    <Icon name="check-circle" size={18} color="#fff" />
                    <Text style={styles.approveText}>Aprobar</Text>
                  </TouchableOpacity>
                </>
              )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1f2937",
    flex: 1,
    marginLeft: 10,
  },
  scrollView: {
    maxHeight: 400,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#4b5563",
  },
  detailValue: {
    fontSize: 14,
    color: "#1f2937",
    flex: 1,
    textAlign: "right",
  },
  tipoText: {
    fontWeight: "600",
    color: "#3498db",
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estadoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "500",
  },
  motivoText: {
    fontSize: 14,
    color: "#374151",
    lineHeight: 20,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  justificacionText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    fontStyle: "italic",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  toggleAcciones: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    backgroundColor: "#ebf5fb",
    borderRadius: 8,
    marginBottom: 15,
  },
  toggleAccionesText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#3498db",
  },
  textArea: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1f2937",
    backgroundColor: "#f9fafb",
    textAlignVertical: "top",
    minHeight: 100,
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 5,
  },
  closeButton: {
    backgroundColor: "#6b7280",
  },
  rejectButton: {
    backgroundColor: "#e74c3c",
  },
  approveButton: {
    backgroundColor: "#27ae60",
  },
  closeText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
  rejectText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 5,
  },
  approveText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
    marginLeft: 5,
  },
});

export default ModalDetallesIncidencia;
