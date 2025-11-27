// components/modals/IncidenciaDetailModal.js
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Image,
  ScrollView,
  Alert,
  Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const IncidenciaDetailModal = ({
  visible,
  onClose,
  incidencia,
  onDelete,
  isDeleting,
}) => {
  if (!incidencia) return null;

  const getTipoText = (tipo) => {
    switch (tipo) {
      case "retardo":
        return "Retardo (11-15 min)";
      case "retardo_mayor":
        return "Retardo mayor (16-20 min)";
      case "salida_anticipada":
        return "Salida anticipada";
      default:
        return tipo;
    }
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
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
    switch (estado) {
      case "aprobado":
        return "Aprobado";
      case "pendiente":
        return "Pendiente";
      case "rechazado":
        return "Rechazado";
      default:
        return estado;
    }
  };
  console.log("🔍 DEBUG IncidenciaDetailModal:", {
    visible: visible,
    hasIncidencia: !!incidencia,
    incidenciaId: incidencia?.id,
    hasOnDelete: typeof onDelete === "function", // ← ESTO ES IMPORTANTE
    isDeleting: isDeleting,
  });

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
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

  const hasImage =
    incidencia.justificaciones && incidencia.justificaciones.startsWith("http");

  const openImage = async (url) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "No se puede abrir la imagen");
      }
    } catch (error) {
      Alert.alert("Error", "No se puede abrir la imagen");
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxHeight: "90%" }]}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle de Incidencia</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.modalScrollContent}
            contentContainerStyle={styles.modalScrollContainer}
          >
            {/* ESTADO */}
            <View style={styles.detailSection}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado:</Text>
                <View
                  style={[
                    styles.estadoBadge,
                    { backgroundColor: getEstadoColor(incidencia.estado) },
                  ]}
                >
                  <Text style={styles.estadoText}>
                    {getEstadoText(incidencia.estado)}
                  </Text>
                </View>
              </View>
            </View>

            {/* INFORMACIÓN BÁSICA */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Información General</Text>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo:</Text>
                <Text style={styles.detailValue}>
                  {getTipoText(incidencia.tipo_incidencia)}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha:</Text>
                <Text style={styles.detailValue}>
                  {formatDate(incidencia.fecha)}
                </Text>
              </View>

              {incidencia.minutos > 0 && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Duración:</Text>
                  <Text style={styles.detailValue}>
                    {incidencia.minutos} minutos
                  </Text>
                </View>
              )}

              {incidencia.hora_entrada && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hora entrada:</Text>
                  <Text style={styles.detailValue}>
                    {incidencia.hora_entrada}
                  </Text>
                </View>
              )}

              {incidencia.hora_salida && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Hora salida:</Text>
                  <Text style={styles.detailValue}>
                    {incidencia.hora_salida}
                  </Text>
                </View>
              )}
            </View>

            {/* MOTIVO */}
            <View style={styles.detailSection}>
              <Text style={styles.detailSectionTitle}>Motivo</Text>
              <Text style={styles.detailValue}>{incidencia.motivo}</Text>
            </View>

            {/* JUSTIFICACIÓN CON IMAGEN */}
            {hasImage && (
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Justificación</Text>
                <TouchableOpacity
                  style={styles.imageContainer}
                  onPress={() => openImage(incidencia.justificaciones)}
                >
                  <Image
                    source={{ uri: incidencia.justificaciones }}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                  <View style={styles.imageOverlay}>
                    <Ionicons name="expand-outline" size={24} color="white" />
                    <Text style={styles.imageOverlayText}>
                      Toca para ver imagen completa
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {/* BOTONES DE ACCIÓN */}
            <View style={styles.detailActions}>
              <TouchableOpacity
                style={[styles.secondaryButton, { flex: 1 }]}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>Cerrar</Text>
              </TouchableOpacity>

              {incidencia.estado === "pendiente" && (
                <TouchableOpacity
                  style={[styles.deleteButton, { flex: 1, marginLeft: 8 }]}
                  onPress={() =>
                    onDelete(
                      incidencia.id,
                      getTipoText(incidencia.tipo_incidencia)
                    )
                  }
                  disabled={isDeleting}
                >
                  <Ionicons name="trash-outline" size={16} color="white" />
                  <Text style={styles.deleteButtonText}>Eliminar</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default IncidenciaDetailModal;
