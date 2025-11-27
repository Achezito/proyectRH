import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

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

  const [isSubmitting, setIsSubmitting] = useState(false); // ← ESTADO DE LOADING

  const tiposIncidencia = [
    { value: "retardo", label: "Retardo (11-15 min)" },
    { value: "retardo_mayor", label: "Retardo mayor (16-20 min)" },
    { value: "salida_anticipada", label: "Salida anticipada" },
  ];

  const handleSubmit = async () => {
    // ← Hacer async
    if (isSubmitting) return; // ← Prevenir múltiples submits

    console.log("📤 Datos del formulario a enviar:", formData);

    // Validaciones
    if (!formData.motivo.trim()) {
      Alert.alert("Error", "Por favor ingresa el motivo de la incidencia");
      return;
    }

    if (!formData.fecha) {
      Alert.alert("Error", "Por favor ingresa la fecha");
      return;
    }

    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(formData.fecha)) {
      Alert.alert("Error", "Formato de fecha incorrecto. Use YYYY-MM-DD");
      return;
    }

    try {
      setIsSubmitting(true); // ← Activar loading

      const datosFinales = {
        tipo: formData.tipo,
        motivo: formData.motivo,
        fecha: formData.fecha,
        horaEntrada: formData.horaEntrada || null,
        horaSalida: formData.horaSalida || null,
        minutos: calcularMinutos(formData.tipo),
        imagen: image || null,
      };

      console.log("✅ Datos finales listos para enviar:", datosFinales);

      await onSubmit(datosFinales); // ← Esperar a que termine
    } catch (error) {
      console.error("Error en handleSubmit:", error);
    } finally {
      setIsSubmitting(false); // ← Desactivar loading siempre
    }
  };

  const calcularMinutos = (tipo) => {
    switch (tipo) {
      case "retardo":
        return 15;
      case "retardo_mayor":
        return 20;
      case "salida_anticipada":
        return 30;
      default:
        return 0;
    }
  };

  const handleClose = () => {
    if (isSubmitting) return; // ← Prevenir cerrar mientras se envía

    setFormData({
      tipo: "retardo",
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      horaEntrada: "",
      horaSalida: "",
    });
    setIsSubmitting(false); // ← Resetear estado
    onClearImage();
    onClose();
  };
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* HEADER FIJO */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Nueva Incidencia</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          {/* CONTENIDO DESPLAZABLE */}
          <ScrollView
            style={styles.modalScrollContent}
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.modalScrollContainer}
          >
            <Text style={styles.modalSubtitle}>Tipo de Incidencia</Text>
            <View style={styles.radioGroup}>
              {tiposIncidencia.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.radioOption,
                    formData.tipo === option.value &&
                      styles.radioOptionSelected,
                  ]}
                  onPress={() =>
                    setFormData({ ...formData, tipo: option.value })
                  }
                >
                  <Text
                    style={[
                      styles.radioText,
                      formData.tipo === option.value &&
                        styles.radioTextSelected,
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
              onChangeText={(text) =>
                setFormData({ ...formData, motivo: text })
              }
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
                <Image
                  source={{ uri: image.uri }}
                  style={styles.imagePreview}
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={onClearImage}
                >
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.primaryButton,
                isSubmitting && styles.primaryButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <ActivityIndicator size="small" color="white" />
                  <Text style={styles.primaryButtonText}>Registrando...</Text>
                </>
              ) : (
                <Text style={styles.primaryButtonText}>
                  Registrar Incidencia
                </Text>
              )}
            </TouchableOpacity>

            {/* ESPACIO EXTRA PARA SCROLL */}
            <View style={{ height: 20 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

export default IncidenciaModal;
