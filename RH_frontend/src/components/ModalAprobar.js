// src/screens/administrador/components/ModalAprobar.js
import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { X, CheckCircle, XCircle } from "lucide-react-native";

export default function ModalAprobar({
  visible,
  incidencia,
  onClose,
  onAprobar,
  onRechazar,
}) {
  const [observaciones, setObservaciones] = useState("");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAprobar = async () => {
    if (!observaciones.trim() && incidencia.accion === "aprobar") {
      Alert.alert("Error", "Por favor ingresa observaciones");
      return;
    }

    if (!motivo.trim() && incidencia.accion === "rechazar") {
      Alert.alert("Error", "Por favor ingresa el motivo del rechazo");
      return;
    }

    setLoading(true);
    try {
      if (incidencia.accion === "aprobar") {
        await onAprobar(observaciones);
      } else {
        await onRechazar(motivo);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {incidencia?.accion === "aprobar"
                ? "Aprobar Incidencia"
                : "Rechazar Incidencia"}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Docente:</Text>
              <Text style={styles.infoValue}>{incidencia?.docente}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Tipo:</Text>
              <Text style={styles.infoValue}>{incidencia?.tipo}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Motivo:</Text>
              <Text style={styles.infoValue}>{incidencia?.motivo}</Text>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.infoLabel}>Fecha:</Text>
              <Text style={styles.infoValue}>
                {new Date(incidencia?.fecha).toLocaleDateString("es-ES")}
              </Text>
            </View>

            {incidencia?.accion === "aprobar" ? (
              <>
                <Text style={styles.inputLabel}>Observaciones (opcional):</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Ej: Se aprueba considerando..."
                  value={observaciones}
                  onChangeText={setObservaciones}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9ca3af"
                />
              </>
            ) : (
              <>
                <Text style={styles.inputLabel}>Motivo del rechazo *:</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  placeholder="Ej: No se presentó justificación..."
                  value={motivo}
                  onChangeText={setMotivo}
                  multiline
                  numberOfLines={4}
                  placeholderTextColor="#9ca3af"
                />
              </>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                incidencia?.accion === "aprobar"
                  ? styles.approveButton
                  : styles.rejectButton,
              ]}
              onPress={handleAprobar}
              disabled={loading}
            >
              {incidencia?.accion === "aprobar" ? (
                <>
                  <CheckCircle size={18} color="#fff" />
                  <Text style={styles.buttonText}>Aprobar</Text>
                </>
              ) : (
                <>
                  <XCircle size={18} color="#fff" />
                  <Text style={styles.buttonText}>Rechazar</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    width: "100%",
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  modalBody: {
    padding: 16,
    maxHeight: 400,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  infoSection: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: "#6b7280",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: "top",
  },
  button: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  cancelButton: {
    backgroundColor: "#f3f4f6",
  },
  cancelButtonText: {
    color: "#374151",
    fontWeight: "500",
  },
  approveButton: {
    backgroundColor: "#10b981",
  },
  rejectButton: {
    backgroundColor: "#ef4444",
  },
  buttonText: {
    color: "#fff",
    fontWeight: "500",
    marginLeft: 8,
  },
});
