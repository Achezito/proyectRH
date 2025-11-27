import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";

const DiaEconomicoModal = ({ visible, onClose, onSubmit, diasDisponibles }) => {
  const [formData, setFormData] = useState({
    motivo: "",
    fecha: new Date().toISOString().split("T")[0],
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Solicitar Día Económico</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.diasDisponiblesText}>
            Días disponibles:{" "}
            <Text style={styles.diasCount}>{diasDisponibles}</Text>
          </Text>

          <Text style={styles.modalSubtitle}>
            De acuerdo con el contrato colectivo de trabajo, Cláusula 42
          </Text>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Motivo del día económico"
            value={formData.motivo}
            onChangeText={(text) => setFormData({ ...formData, motivo: text })}
            multiline
            numberOfLines={4}
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Fecha del día económico (YYYY-MM-DD)"
            value={formData.fecha}
            onChangeText={(text) => setFormData({ ...formData, fecha: text })}
            placeholderTextColor="#94a3b8"
          />

          <TouchableOpacity
            style={[
              styles.primaryButton,
              diasDisponibles <= 0 && styles.primaryButtonDisabled,
            ]}
            onPress={onSubmit}
            disabled={diasDisponibles <= 0}
          >
            <Text style={styles.primaryButtonText}>
              {diasDisponibles <= 0
                ? "Sin días disponibles"
                : "Solicitar Día Económico"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default DiaEconomicoModal;
