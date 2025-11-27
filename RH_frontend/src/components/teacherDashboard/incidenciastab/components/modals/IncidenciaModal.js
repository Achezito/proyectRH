import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";

const IncidenciaModal = ({
  visible,
  onClose,
  onSubmit,
  image,
  onPickImage,
  onClearImage,
}) => {
  const [formData, setFormData] = useState({
    tipo: "retardo",
    motivo: "",
    fecha: new Date().toISOString().split("T")[0],
    horaEntrada: "",
    horaSalida: "",
  });

  const tiposIncidencia = [
    { value: "retardo", label: "Retardo (11-15 min)" },
    { value: "retardo_mayor", label: "Retardo mayor (16-20 min)" },
    { value: "salida_anticipada", label: "Salida anticipada" },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Incidencia</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>Tipo de Incidencia</Text>
          <View style={styles.radioGroup}>
            {tiposIncidencia.map((option) => (
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
            placeholder="Motivo de la incidencia"
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

          {(formData.tipo === "retardo" ||
            formData.tipo === "retardo_mayor") && (
            <TextInput
              style={styles.input}
              placeholder="Hora de entrada (HH:MM)"
              value={formData.horaEntrada}
              onChangeText={(text) =>
                setFormData({ ...formData, horaEntrada: text })
              }
              placeholderTextColor="#94a3b8"
            />
          )}

          {formData.tipo === "salida_anticipada" && (
            <TextInput
              style={styles.input}
              placeholder="Hora de salida (HH:MM)"
              value={formData.horaSalida}
              onChangeText={(text) =>
                setFormData({ ...formData, horaSalida: text })
              }
              placeholderTextColor="#94a3b8"
            />
          )}

          <Text style={styles.modalSubtitle}>
            Justificación con Imagen (Opcional)
          </Text>

          <TouchableOpacity style={styles.imageButton} onPress={onPickImage}>
            <Ionicons name="image-outline" size={20} color="#4f46e5" />
            <Text style={styles.imageButtonText}>Seleccionar de Galería</Text>
          </TouchableOpacity>

          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image source={{ uri: image.uri }} style={styles.imagePreview} />
              <TouchableOpacity
                style={styles.removeImageButton}
                onPress={onClearImage}
              >
                <Ionicons name="close-circle" size={24} color="#ef4444" />
              </TouchableOpacity>
            </View>
          )}

          <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonText}>Registrar Incidencia</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default IncidenciaModal;
