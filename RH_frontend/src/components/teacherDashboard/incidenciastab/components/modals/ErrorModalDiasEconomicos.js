// teacherDashboard/incidenciastab/components/modals/ErrorModalDiasEconomicos.js
import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const LOCAL_COLORS = {
  primary: "#007AFF",
  danger: "#FF3B30",
  warning: "#FF9500",
  success: "#34C759",
  gray: "#8E8E93",
  text: "#000000",
  textSecondary: "#6C6C70",
  background: "#FFFFFF",
  dangerLight: "#F8D7DA",
  warningLight: "#FFF3CD",
  infoLight: "#D1ECF1",
};

const ErrorModalDiasEconomicos = ({
  visible,
  onClose,
  title = "Error",
  message = "",
  details = "",
  type = "error", // 'error', 'warning', 'info'
}) => {
  const getIconAndColor = () => {
    switch (type) {
      case "warning":
        return {
          icon: "warning",
          color: LOCAL_COLORS.warning,
          bgColor: LOCAL_COLORS.warningLight,
          iconName: "warning-outline",
        };
      case "info":
        return {
          icon: "information-circle",
          color: LOCAL_COLORS.primary,
          bgColor: LOCAL_COLORS.infoLight,
          iconName: "information-circle-outline",
        };
      case "error":
      default:
        return {
          icon: "close-circle",
          color: LOCAL_COLORS.danger,
          bgColor: LOCAL_COLORS.dangerLight,
          iconName: "close-circle-outline",
        };
    }
  };

  const { color, bgColor, iconName } = getIconAndColor();

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header con icono */}
          <View style={[styles.header, { backgroundColor: bgColor }]}>
            <Ionicons name={iconName} size={40} color={color} />
            <Text style={[styles.title, { color }]}>{title}</Text>
          </View>

          {/* Contenido */}
          <ScrollView style={styles.content}>
            <Text style={styles.message}>{message}</Text>

            {details ? (
              <View style={styles.detailsContainer}>
                <Text style={styles.detailsLabel}>Detalles técnicos:</Text>
                <Text style={styles.detailsText}>{details}</Text>
              </View>
            ) : null}

            {/* Soluciones sugeridas basadas en el tipo de error */}
            {type === "network" && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>
                  📡 Soluciones sugeridas:
                </Text>
                <Text style={styles.suggestionItem}>
                  • Verifica tu conexión a internet
                </Text>
                <Text style={styles.suggestionItem}>
                  • Reintenta en unos momentos
                </Text>
                <Text style={styles.suggestionItem}>
                  • Contacta al soporte técnico
                </Text>
              </View>
            )}

            {type === "fetch" && message.includes("No hay período activo") && (
              <View style={styles.suggestionsContainer}>
                <Text style={styles.suggestionsTitle}>📋 Soluciones:</Text>
                <Text style={styles.suggestionItem}>
                  • Contacta al administrador del sistema
                </Text>
                <Text style={styles.suggestionItem}>
                  • Verifica que haya un período académico activo
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Botones */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.primaryButton]}
              onPress={onClose}
            >
              <Text style={styles.primaryButtonText}>Entendido</Text>
            </TouchableOpacity>

            {type === "network" && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={() => {
                  onClose();
                  // Aquí podrías agregar una función para reintentar
                }}
              >
                <Text style={styles.secondaryButtonText}>Reintentar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: LOCAL_COLORS.background,
    borderRadius: 15,
    maxHeight: "80%",
    overflow: "hidden",
  },
  header: {
    padding: 25,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 10,
    textAlign: "center",
  },
  content: {
    padding: 20,
    maxHeight: 300,
  },
  message: {
    fontSize: 16,
    color: LOCAL_COLORS.text,
    lineHeight: 24,
    marginBottom: 20,
    textAlign: "center",
  },
  detailsContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: LOCAL_COLORS.gray,
  },
  detailsLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: LOCAL_COLORS.textSecondary,
    marginBottom: 5,
  },
  detailsText: {
    fontSize: 12,
    color: LOCAL_COLORS.textSecondary,
    fontFamily: "monospace",
    lineHeight: 18,
  },
  suggestionsContainer: {
    backgroundColor: "#f0f8ff",
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e3f2fd",
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: LOCAL_COLORS.primary,
    marginBottom: 10,
  },
  suggestionItem: {
    fontSize: 14,
    color: LOCAL_COLORS.text,
    marginBottom: 8,
    paddingLeft: 10,
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
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  primaryButton: {
    backgroundColor: LOCAL_COLORS.primary,
  },
  primaryButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  secondaryButton: {
    backgroundColor: LOCAL_COLORS.gray + "20",
    borderWidth: 1,
    borderColor: LOCAL_COLORS.gray,
  },
  secondaryButtonText: {
    color: LOCAL_COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ErrorModalDiasEconomicos;
