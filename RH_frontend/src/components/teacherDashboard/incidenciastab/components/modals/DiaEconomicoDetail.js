// src/components/teacherDashboard/IncidenciasTab/components/modals/DiaEconomicoDetailModal.js
import React from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";
import { formatDate } from "../../shared/utils/dateFormatter";

const DiaEconomicoDetailModal = ({
  visible,
  onClose,
  diaEconomico,
  onDelete,
  isDeleting = false,
}) => {
  if (!diaEconomico) return null;

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "aprobado":
        return "#10b981";
      case "pendiente":
        return "#f59e0b";
      case "rechazado":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getEstadoText = (estado) => {
    switch (estado?.toLowerCase()) {
      case "aprobado":
        return "Aprobado";
      case "pendiente":
        return "Pendiente de revisión";
      case "rechazado":
        return "Rechazado";
      default:
        return estado || "Desconocido";
    }
  };

  const handleDelete = () => {
    if (diaEconomico.estado?.toLowerCase() !== "pendiente") {
      Alert.alert(
        "No se puede eliminar",
        "Solo se pueden eliminar solicitudes pendientes",
        [{ text: "Entendido" }]
      );
      return;
    }

    Alert.alert(
      "Eliminar Solicitud",
      "¿Estás seguro de que quieres eliminar esta solicitud de día económico?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onDelete(diaEconomico.id, diaEconomico.estado),
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Día Económico</Text>
            <TouchableOpacity onPress={onClose} disabled={isDeleting}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScrollContent}>
            {/* Estado */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Estado</Text>
              <View
                style={[
                  styles.estadoBadge,
                  { backgroundColor: getEstadoColor(diaEconomico.estado) },
                ]}
              >
                <Text style={styles.estadoText}>
                  {getEstadoText(diaEconomico.estado)}
                </Text>
              </View>
            </View>

            {/* Fecha */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Fecha solicitada</Text>
              <Text style={styles.detailValue}>
                {formatDate(diaEconomico.fecha)}
              </Text>
            </View>

            {/* Motivo */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Motivo</Text>
              <Text style={styles.detailValue}>{diaEconomico.motivo}</Text>
            </View>

            {/* Fecha de creación */}
            {diaEconomico.created_at && (
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Fecha de solicitud</Text>
                <Text style={styles.detailValue}>
                  {formatDate(diaEconomico.created_at)}
                </Text>
              </View>
            )}

            {/* Botón de eliminar solo para solicitudes pendientes */}
            {diaEconomico.estado?.toLowerCase() === "pendiente" && (
              <View style={styles.detailSection}>
                <TouchableOpacity
                  style={[
                    styles.deleteButton,
                    isDeleting && styles.buttonDisabled,
                  ]}
                  onPress={handleDelete}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="white" />
                      <Text style={styles.deleteButtonText}>
                        Eliminar Solicitud
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Información adicional */}
            <View style={styles.infoCard}>
              <Ionicons
                name="information-circle-outline"
                size={20}
                color="#3b82f6"
              />
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Información importante</Text>
                <Text style={styles.infoText}>
                  • Los días económicos se descuentan de tu límite anual
                </Text>
                <Text style={styles.infoText}>
                  • El estado "Pendiente" significa que está en revisión
                </Text>
                <Text style={styles.infoText}>
                  • Solo puedes eliminar solicitudes pendientes
                </Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default DiaEconomicoDetailModal;
