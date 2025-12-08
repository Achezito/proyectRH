import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  StyleSheet,
  ScrollView,
} from "react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const LOCAL_COLORS = {
  primary: "#007AFF",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  gray: "#8E8E93",
  text: "#000000",
  textSecondary: "#6C6C70",
  background: "#FFFFFF",
};

const DiaEconomicoDetailModal = ({
  visible,
  onClose,
  diaEconomico,
  onDelete,
  isDeleting,
}) => {
  console.log("🔍 Modal Detalles - Props recibidas:", {
    visible,
    diaEconomicoId: diaEconomico?.id,
    estado: diaEconomico?.estado,
    onDeleteExists: typeof onDelete === "function",
    isDeleting,
  });

  if (!diaEconomico) {
    console.log("⚠️ No hay datos de día económico");
    return null;
  }

  const formatFecha = (fechaStr) => {
    try {
      return format(new Date(fechaStr), "EEEE dd 'de' MMMM 'de' yyyy", {
        locale: es,
      });
    } catch {
      return fechaStr;
    }
  };

  const formatDateTime = (dateTimeStr) => {
    try {
      return format(new Date(dateTimeStr), "dd/MM/yyyy HH:mm", { locale: es });
    } catch {
      return dateTimeStr;
    }
  };

  const getEstadoInfo = (estado) => {
    const estadoLower = estado?.toLowerCase() || "pendiente";

    switch (estadoLower) {
      case "aprobado":
        return {
          color: LOCAL_COLORS.success,
          text: "APROBADO",
          canDelete: false,
          deleteText: "No se puede cancelar",
          message: "✅ Esta solicitud ya fue aprobada.",
          icon: "✅",
        };
      case "pendiente":
        return {
          color: LOCAL_COLORS.warning,
          text: "PENDIENTE",
          canDelete: true,
          deleteText: "Cancelar Solicitud",
          message: "⏳ Pendiente de revisión.",
          icon: "⏳",
        };
      case "rechazado":
        return {
          color: LOCAL_COLORS.danger,
          text: "RECHAZADO",
          canDelete: false,
          deleteText: "No se puede cancelar",
          message: "❌ Esta solicitud fue rechazada.",
          icon: "❌",
        };
      case "cancelado":
        return {
          color: LOCAL_COLORS.gray,
          text: "CANCELADO",
          canDelete: false,
          deleteText: "Ya cancelada",
          message: "📝 Cancelada anteriormente.",
          icon: "📝",
        };
      default:
        return {
          color: LOCAL_COLORS.gray,
          text: "DESCONOCIDO",
          canDelete: false,
          deleteText: "No disponible",
          message: "Estado desconocido.",
          icon: "❓",
        };
    }
  };

  const estadoInfo = getEstadoInfo(diaEconomico.estado);

  // En DiaEconomicoDetailModal.js - MODIFICA handleDeletePress:

  const handleDeletePress = () => {
    console.log("=== 🎯 DELETE PRESS START ===");
    console.log("1. ID disponible?", diaEconomico?.id);
    console.log("2. Estado actual:", diaEconomico?.estado);
    console.log("3. onDelete type:", typeof onDelete);
    console.log("4. isDeleting:", isDeleting);
    console.log("5. canDelete según estado:", estadoInfo.canDelete);
    console.log("=== 🎯 DELETE PRESS END ===");

    if (!estadoInfo.canDelete) {
      console.log("❌ No se puede borrar - Estado:", diaEconomico.estado);
      Alert.alert("Acción no permitida", estadoInfo.message, [
        { text: "Entendido" },
      ]);
      return;
    }

    if (typeof onDelete !== "function") {
      console.error("❌ ERROR: onDelete no es una función");
      Alert.alert("Error", "Función no disponible");
      return;
    }

    // SOLUCIÓN PARA WEB - Usar window.confirm
    const confirmMessage = `¿Cancelar solicitud del ${formatFecha(
      diaEconomico.fecha
    )}?\n\nMotivo: ${diaEconomico.motivo}`;

    // Método 1: window.confirm (más compatible con web)
    const userConfirmed = window.confirm(confirmMessage);

    if (userConfirmed) {
      console.log(
        "✅ Usuario confirmó. Llamando onDelete con ID:",
        diaEconomico.id
      );
      onDelete(diaEconomico.id);
    } else {
      console.log("❌ Usuario canceló la eliminación");
    }
    // Mostrar confirmación
    Alert.alert(
      "¿Cancelar solicitud?",
      `Vas a cancelar la solicitud para el ${formatFecha(
        diaEconomico.fecha
      )}\n\nMotivo: ${diaEconomico.motivo || "Sin motivo especificado"}`,
      [
        {
          text: "No, conservar",
          style: "cancel",
          onPress: () => {
            console.log("❌ Usuario CANCELÓ la eliminación");
          },
        },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: () => {
            console.log("✅✅✅ Usuario CONFIRMÓ la eliminación");
            console.log("🚀 Llamando onDelete con ID:", diaEconomico.id);

            // VERIFICA que diaEconomico.id existe
            if (!diaEconomico.id) {
              console.error("❌ ERROR: diaEconomico.id no existe!");
              return;
            }

            // Llama a la función
            onDelete(diaEconomico.id);
            console.log("📞 onDelete llamado exitosamente");
          },
        },
      ]
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalles del Día Económico</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Estado */}
            <View
              style={[
                styles.estadoContainer,
                { backgroundColor: estadoInfo.color + "20" },
              ]}
            >
              <View style={styles.estadoHeader}>
                <Text style={[styles.estadoIcon, { color: estadoInfo.color }]}>
                  {estadoInfo.icon}
                </Text>
                <View
                  style={[
                    styles.estadoBadge,
                    { backgroundColor: estadoInfo.color },
                  ]}
                >
                  <Text style={styles.estadoText}>{estadoInfo.text}</Text>
                </View>
              </View>
              <Text style={styles.estadoMessage}>{estadoInfo.message}</Text>

              {/* Debug info */}
              <Text style={styles.debugText}>
                ID: {diaEconomico.id} | Estado: {diaEconomico.estado}
              </Text>
            </View>

            {/* Información */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>📋 Información</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Fecha:</Text>
                <Text style={styles.infoValue}>
                  {formatFecha(diaEconomico.fecha)}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Motivo:</Text>
                <Text style={styles.infoValue}>
                  {diaEconomico.motivo || "Sin motivo"}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Solicitado:</Text>
                <Text style={styles.infoValue}>
                  {formatDateTime(diaEconomico.creado_en)}
                </Text>
              </View>

              {diaEconomico.aprobado_en && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Aprobado:</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(diaEconomico.aprobado_en)}
                  </Text>
                </View>
              )}

              {diaEconomico.rechazado_en && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Rechazado:</Text>
                  <Text style={styles.infoValue}>
                    {formatDateTime(diaEconomico.rechazado_en)}
                  </Text>
                </View>
              )}

              {diaEconomico.motivo_rechazo && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Motivo rechazo:</Text>
                  <Text style={[styles.infoValue, styles.rechazoText]}>
                    {diaEconomico.motivo_rechazo}
                  </Text>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.closeBtn]}
              onPress={onClose}
            >
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.deleteBtn,
                (!estadoInfo.canDelete || isDeleting) && styles.disabledBtn,
              ]}
              onPress={handleDeletePress}
              disabled={!estadoInfo.canDelete || isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.deleteBtnText}>
                  {estadoInfo.deleteText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: LOCAL_COLORS.background,
    borderRadius: 15,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: LOCAL_COLORS.text,
    flex: 1,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: LOCAL_COLORS.gray,
  },
  content: {
    padding: 20,
  },
  estadoContainer: {
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  estadoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    gap: 10,
  },
  estadoIcon: {
    fontSize: 24,
  },
  estadoBadge: {
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
  },
  estadoText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },
  estadoMessage: {
    fontSize: 14,
    color: LOCAL_COLORS.text,
    lineHeight: 20,
  },
  debugText: {
    fontSize: 10,
    color: LOCAL_COLORS.gray,
    marginTop: 5,
    fontStyle: "italic",
  },
  infoSection: {
    backgroundColor: "#f9f9f9",
    padding: 15,
    borderRadius: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: LOCAL_COLORS.text,
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  infoLabel: {
    width: 100,
    fontSize: 14,
    fontWeight: "600",
    color: LOCAL_COLORS.text,
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
    color: LOCAL_COLORS.textSecondary,
    lineHeight: 20,
  },
  rechazoText: {
    color: LOCAL_COLORS.danger,
    fontStyle: "italic",
  },
  buttonContainer: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#eee",
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  closeBtn: {
    backgroundColor: LOCAL_COLORS.gray + "20",
    borderWidth: 1,
    borderColor: LOCAL_COLORS.gray,
  },
  closeBtnText: {
    color: LOCAL_COLORS.text,
    fontWeight: "600",
  },
  deleteBtn: {
    backgroundColor: LOCAL_COLORS.danger,
  },
  disabledBtn: {
    backgroundColor: LOCAL_COLORS.gray,
    opacity: 0.5,
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,
  },
});

export default DiaEconomicoDetailModal;
