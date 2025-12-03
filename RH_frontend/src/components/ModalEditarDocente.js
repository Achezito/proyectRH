import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";
import DatePickerModal from "./datepickermodal"; // Importar el componente

const ModalEditarDocente = ({
  visible,
  docente,
  filtrosDisponibles,
  onClose,
  onGuardar,
  onDesactivar,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    correo_institucional: "",
    docencia: "",
    cumpleaños: null,
    tipodocente_id: "",
    tipo_colaborador: "",
    estado: "",
  });
  const [errors, setErrors] = useState({});
  const [showDatePicker, setShowDatePicker] = useState(false); // Cambiar a false

  useEffect(() => {
    if (docente) {
      setFormData({
        nombre: docente.nombre || "",
        apellido: docente.apellido || "",
        correo_institucional: docente.correo_institucional || "",
        docencia: docente.docencia || "",
        cumpleaños: docente.cumpleaños ? new Date(docente.cumpleaños) : null,
        tipodocente_id: docente.tipodocente_id?.toString() || "",
        tipo_colaborador: docente.tipo_colaborador || "",
        estado: docente.estado || "pending",
      });
      setErrors({});
    }
  }, [docente]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nombre.trim()) {
      newErrors.nombre = "El nombre es requerido";
    }

    if (!formData.apellido.trim()) {
      newErrors.apellido = "El apellido es requerido";
    }

    if (!formData.correo_institucional.trim()) {
      newErrors.correo_institucional = "El correo institucional es requerido";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.correo_institucional)
    ) {
      newErrors.correo_institucional = "Correo electrónico inválido";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert("Error", "Por favor corrige los errores en el formulario");
      return;
    }

    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        id: docente.id,
        cumpleaños: formData.cumpleaños
          ? formData.cumpleaños.toISOString().split("T")[0]
          : null,
        tipodocente_id: formData.tipodocente_id
          ? parseInt(formData.tipodocente_id)
          : null,
      };

      await onGuardar(dataToSave);
      onClose();
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar los cambios");
    } finally {
      setLoading(false);
    }
  };

  // Reemplazar handleDateChange con esta función
  const handleDateSelect = (date) => {
    setFormData({ ...formData, cumpleaños: date });
  };

  const formatDate = (date) => {
    if (!date) return "Seleccionar fecha";
    return date.toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const handleDesactivarPress = () => {
    const esActivo = formData.estado?.toLowerCase() === "activo";
    Alert.alert(
      `${esActivo ? "Desactivar" : "Activar"} Docente`,
      `¿Está seguro de ${esActivo ? "desactivar" : "activar"} a ${
        formData.nombre
      } ${formData.apellido}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: esActivo ? "Desactivar" : "Activar",
          style: esActivo ? "destructive" : "default",
          onPress: () => {
            onDesactivar(docente.id);
            onClose();
          },
        },
      ]
    );
  };

  if (!docente) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Editar Docente</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#5d6d7e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Información Personal */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Información Personal</Text>

              <View style={styles.formRow}>
                <Text style={styles.label}>Nombre *</Text>
                <TextInput
                  style={[styles.input, errors.nombre && styles.inputError]}
                  value={formData.nombre}
                  onChangeText={(text) =>
                    setFormData({ ...formData, nombre: text })
                  }
                  placeholder="Ingrese el nombre"
                />
                {errors.nombre && (
                  <Text style={styles.errorText}>{errors.nombre}</Text>
                )}
              </View>

              <View style={styles.formRow}>
                <Text style={styles.label}>Apellido *</Text>
                <TextInput
                  style={[styles.input, errors.apellido && styles.inputError]}
                  value={formData.apellido}
                  onChangeText={(text) =>
                    setFormData({ ...formData, apellido: text })
                  }
                  placeholder="Ingrese el apellido"
                />
                {errors.apellido && (
                  <Text style={styles.errorText}>{errors.apellido}</Text>
                )}
              </View>

              <View style={styles.formRow}>
                <Text style={styles.label}>Correo Institucional *</Text>
                <TextInput
                  style={[
                    styles.input,
                    errors.correo_institucional && styles.inputError,
                  ]}
                  value={formData.correo_institucional}
                  onChangeText={(text) =>
                    setFormData({ ...formData, correo_institucional: text })
                  }
                  placeholder="ejemplo@institucion.edu"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.correo_institucional && (
                  <Text style={styles.errorText}>
                    {errors.correo_institucional}
                  </Text>
                )}
              </View>

              <View style={styles.formRow}>
                <Text style={styles.label}>Fecha de Cumpleaños</Text>
                <TouchableOpacity
                  style={styles.dateButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Icon name="calendar-today" size={20} color="#3498db" />
                  <Text style={styles.dateButtonText}>
                    {formatDate(formData.cumpleaños)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Información Laboral */}
            <View style={styles.formSection}>
              <Text style={styles.sectionTitle}>Información Laboral</Text>

              <View style={styles.formRow}>
                <Text style={styles.label}>Tipo de Contrato</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.tipodocente_id}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipodocente_id: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Seleccionar tipo" value="" />
                    {filtrosDisponibles.tipos_contrato?.map((tipo) => (
                      <Picker.Item
                        key={tipo.id}
                        label={tipo.tipo_contrato}
                        value={tipo.id.toString()}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.label}>Tipo de Colaborador</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.tipo_colaborador}
                    onValueChange={(value) =>
                      setFormData({ ...formData, tipo_colaborador: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Seleccionar tipo" value="" />
                    {filtrosDisponibles.tipos_colaborador?.map(
                      (tipo, index) => (
                        <Picker.Item key={index} label={tipo} value={tipo} />
                      )
                    )}
                  </Picker>
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.label}>Docencia</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.docencia}
                    onValueChange={(value) =>
                      setFormData({ ...formData, docencia: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Seleccionar docencia" value="" />
                    {filtrosDisponibles.docencias?.map((docencia, index) => (
                      <Picker.Item
                        key={index}
                        label={docencia}
                        value={docencia}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.label}>Estado</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={formData.estado}
                    onValueChange={(value) =>
                      setFormData({ ...formData, estado: value })
                    }
                    style={styles.picker}
                  >
                    <Picker.Item label="Activo" value="activo" />
                    <Picker.Item label="Inactivo" value="inactivo" />
                    <Picker.Item label="Pendiente" value="pending" />
                  </Picker>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer con botones */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.desactivarButton]}
              onPress={handleDesactivarPress}
              disabled={loading}
            >
              <Icon
                name={
                  formData.estado?.toLowerCase() === "activo"
                    ? "block"
                    : "check-circle"
                }
                size={20}
                color={
                  formData.estado?.toLowerCase() === "activo"
                    ? "#e74c3c"
                    : "#2ecc71"
                }
              />
              <Text
                style={[
                  styles.footerButtonText,
                  {
                    color:
                      formData.estado?.toLowerCase() === "activo"
                        ? "#e74c3c"
                        : "#2ecc71",
                  },
                ]}
              >
                {formData.estado?.toLowerCase() === "activo"
                  ? "Desactivar"
                  : "Activar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Icon name="cancel" size={20} color="#7f8c8d" />
              <Text style={[styles.footerButtonText, { color: "#7f8c8d" }]}>
                Cancelar
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="save" size={20} color="#fff" />
                  <Text style={[styles.footerButtonText, { color: "#fff" }]}>
                    Guardar
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* DatePickerModal para seleccionar fecha de cumpleaños */}
      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onDateSelect={handleDateSelect}
        initialDate={formData.cumpleaños || new Date()}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  formRow: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5d6d7e",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: "#d6dbdf",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: "#2c3e50",
    backgroundColor: "#f8f9fa",
  },
  inputError: {
    borderColor: "#e74c3c",
  },
  errorText: {
    color: "#e74c3c",
    fontSize: 12,
    marginTop: 4,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#d6dbdf",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#f8f9fa",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#2c3e50",
    marginLeft: 8,
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d6dbdf",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
    overflow: "hidden",
  },
  picker: {
    height: 50,
    color: "#2c3e50",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  desactivarButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ffcdd2",
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d6dbdf",
  },
  saveButton: {
    backgroundColor: "#3498db",
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default ModalEditarDocente;
