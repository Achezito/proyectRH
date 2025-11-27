import React from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const ErrorModal = ({ visible, message, onClose }) => (
  <Modal visible={visible} animationType="fade" transparent>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { maxWidth: 350 }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: "#ef4444" }]}>Error</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>
        <Text style={[styles.modalSubtitle, { textAlign: "center" }]}>
          {message}
        </Text>
        <TouchableOpacity
          style={[styles.primaryButton, { backgroundColor: "#ef4444" }]}
          onPress={onClose}
        >
          <Text style={styles.primaryButtonText}>Entendido</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default ErrorModal;
