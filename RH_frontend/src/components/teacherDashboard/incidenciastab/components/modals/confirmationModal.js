// components/modals/ConfirmationModal.js
import React from "react";
import { Modal, View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const ConfirmationModal = ({
  visible,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Eliminar",
  cancelText = "Cancelar",
  isConfirming = false,
}) => {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { maxWidth: 350 }]}>
          {/* Icono de advertencia */}
          <View style={styles.confirmationIcon}>
            <Ionicons name="warning-outline" size={48} color="#f59e0b" />
          </View>

          {/* Título y mensaje */}
          <Text style={styles.confirmationTitle}>{title}</Text>
          <Text style={styles.confirmationMessage}>{message}</Text>

          {/* Botones */}
          <View style={styles.confirmationActions}>
            <TouchableOpacity
              style={[styles.confirmationButton, styles.cancelButton]}
              onPress={onCancel}
              disabled={isConfirming}
            >
              <Text style={styles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.confirmationButton, styles.confirmButton]}
              onPress={onConfirm}
              disabled={isConfirming}
            >
              <Text style={styles.confirmButtonText}>
                {isConfirming ? "Eliminando..." : confirmText}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmationModal;
