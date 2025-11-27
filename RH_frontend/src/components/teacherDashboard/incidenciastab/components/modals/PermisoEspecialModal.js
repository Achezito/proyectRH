import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";

const PermisoEspecialModal = ({ visible, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    tipo: "paternidad",
    motivo: "",
    fecha: new Date().toISOString().split("T")[0],
    duracion: 1,
  });

  const tiposPermiso = [
    { value: "paternidad", label: "Paternidad" },
    { value: "defuncion", label: "Defunción" },
    { value: "titulacion", label: "Titulación" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Permiso Especial</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Tipo de Permiso</Text>
          <View style={styles.radioGroup}>
            {tiposPermiso.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.radioOption,
                  formData.tipo === option.value && styles.radioOptionSelected,
                ]}
                onPress={() => setFormData({ ...formData, tipo: option.value })}
              >
                <Text
                  style={[
                    styles.radioText,
                    formData.tipo === option.value && styles.radioTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Motivo del permiso (especifique detalles)"
            value={formData.motivo}
            onChangeText={(text) => setFormData({ ...formData, motivo: text })}
            multiline
            numberOfLines={3}
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Fecha (YYYY-MM-DD)"
            value={formData.fecha}
            onChangeText={(text) => setFormData({ ...formData, fecha: text })}
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Duración en días"
            value={formData.duracion.toString()}
            onChangeText={(text) =>
              setFormData({ ...formData, duracion: parseInt(text) || 1 })
            }
            keyboardType="numeric"
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.helpText}>
            * Nota: Estos permisos no se descontarán de los días económicos
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonText}>Solicitar Permiso</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default PermisoEspecialModal;
