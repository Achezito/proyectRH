// src/components/teacherDashboard/IncidenciasTab/components/modals/CumpleanosDetailModal.js
import React from "react";
import { View, Text, TouchableOpacity, Modal, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const CumpleanosDetailModal = ({
  visible,
  onClose,
  cumpleanos,
  onDeleteCumpleanos,
}) => {
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

  const formatDate = (dateString) => {
    if (!dateString) return "No disponible";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return "No disponible";
    try {
      const date = new Date(dateString);
      return date.toLocaleString("es-ES");
    } catch {
      return dateString;
    }
  };

  if (!cumpleanos) return null;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles de Cumpleaños</Text>
            <TouchableOpacity onPress={onClose}>
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
                  { backgroundColor: getEstadoColor(cumpleanos.estado) },
                ]}
              >
                <Text style={styles.estadoText}>
                  {cumpleanos.estado || "pendiente"}
                </Text>
              </View>
            </View>

            {/* Fechas */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Fecha de Disfrute</Text>
              <Text style={styles.detailValue}>
                {formatDate(cumpleanos.fecha_disfrute)}
              </Text>
            </View>

            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Fecha de Cumpleaños</Text>
              <Text style={styles.detailValue}>
                {formatDate(cumpleanos.fecha_cumpleanos)}
              </Text>
            </View>

            {/* Motivo */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Motivo</Text>
              <Text style={styles.detailValue}>
                {cumpleanos.motivo || "No especificado"}
              </Text>
            </View>

            {/* Información adicional */}
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Información Adicional</Text>
              <View style={styles.infoGrid}>
                <View style={styles.infoItem}>
                  <Ionicons name="calendar-outline" size={16} color="#64748b" />
                  <Text style={styles.infoText}>
                    Solicitado: {formatDateTime(cumpleanos.creado_en)}
                  </Text>
                </View>
                <View style={styles.infoItem}>
                  <Ionicons name="person-outline" size={16} color="#64748b" />
                  <Text style={styles.infoText}>ID: {cumpleanos.id}</Text>
                </View>
              </View>
            </View>

            {/* Botón de eliminar (solo para pendientes) */}
            {cumpleanos.estado?.toLowerCase() === "pendiente" && (
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  { backgroundColor: "#ef4444", marginTop: 20 },
                ]}
                onPress={() =>
                  onDeleteCumpleanos(cumpleanos.id, cumpleanos.estado)
                }
              >
                <Ionicons name="trash-outline" size={20} color="#fff" />
                <Text style={styles.primaryButtonText}>Eliminar Solicitud</Text>
              </TouchableOpacity>
            )}

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default CumpleanosDetailModal;
