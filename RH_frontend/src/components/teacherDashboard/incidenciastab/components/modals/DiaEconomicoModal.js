// teacherDashboard/incidenciastab/components/modals/DiaEconomicoModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Platform,
  Alert,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { colors } from "../../shared/constants/styles";

// Si no es web, importa el DateTimePicker normal
let DateTimePicker;
if (Platform.OS !== "web") {
  DateTimePicker = require("@react-native-community/datetimepicker").default;
}

const DiaEconomicoModal = ({
  visible,
  onClose,
  docenteId,
  onSuccess,
  estadisticas,
  onSolicitar,
  // NUEVO: Pasar las solicitudes pendientes desde el hook
  solicitudesPendientes = [],
}) => {
  const [fecha, setFecha] = useState(new Date());
  const [motivo, setMotivo] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("");
  const [validando, setValidando] = useState(false);

  useEffect(() => {
    if (visible) {
      // Resetear fecha al día actual
      const today = new Date();
      setFecha(today);
      setMotivo("");
      setErrors({});
      setSubmitError("");
    }
  }, [visible]);

  const onChangeDate = (event, selectedDate) => {
    if (Platform.OS === "ios") {
      setShowDatePicker(true); // iOS mantiene el picker abierto
    } else if (Platform.OS === "android") {
      setShowDatePicker(false);
    }

    if (selectedDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      selectedDate.setHours(0, 0, 0, 0);

      // Validar que no sea fecha pasada
      if (selectedDate < today) {
        Alert.alert(
          "Fecha inválida",
          "No se pueden solicitar días en fechas pasadas"
        );
        return;
      }

      setFecha(selectedDate);
    }
  };

  const formatFechaForDisplay = (date) => {
    try {
      return format(date, "EEEE dd 'de' MMMM 'de' yyyy", { locale: es });
    } catch (error) {
      return date.toLocaleDateString("es-ES", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
  };

  const formatFechaForAPI = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Función para validar si ya tiene solicitudes pendientes
  const validarSolicitudesPendientes = () => {
    if (solicitudesPendientes && solicitudesPendientes.length > 0) {
      const fechasPendientes = solicitudesPendientes
        .map((s) => s.fecha)
        .filter(Boolean)
        .join(", ");

      return {
        tienePendientes: true,
        mensaje: `Ya tienes ${solicitudesPendientes.length} solicitud(es) pendiente(s). Debes esperar a que sean procesadas antes de solicitar otro día.`,
        fechas: fechasPendientes,
      };
    }
    return { tienePendientes: false };
  };

  const handleSubmit = async () => {
    // Limpiar errores anteriores
    setErrors({});
    setSubmitError("");
    setValidando(true);

    // Validar solicitudes pendientes
    const validacionPendientes = validarSolicitudesPendientes();
    if (validacionPendientes.tienePendientes) {
      Alert.alert(
        "Solicitud Pendiente",
        validacionPendientes.mensaje +
          (validacionPendientes.fechas
            ? `\n\nFechas pendientes: ${validacionPendientes.fechas}`
            : ""),
        [{ text: "Entendido" }]
      );
      setValidando(false);
      return;
    }

    // Validaciones
    const newErrors = {};

    if (!motivo.trim()) {
      newErrors.motivo = "❌ Por favor ingresa un motivo";
    } else if (motivo.trim().length < 5) {
      newErrors.motivo = "❌ El motivo debe tener al menos 5 caracteres";
    }

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const fechaSeleccionada = new Date(fecha);
    fechaSeleccionada.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      newErrors.fecha = "❌ No se pueden solicitar días en fechas pasadas";
    }

    if (estadisticas?.disponibles <= 0) {
      newErrors.disponibles = "❌ No tienes días económicos disponibles";
    }

    setErrors(newErrors);
    setValidando(false);

    // Si hay errores, no enviar
    if (Object.keys(newErrors).length > 0) {
      return;
    }

    const fechaFormateada = formatFechaForAPI(fecha);
    const data = {
      docente_id: docenteId,
      fecha: fechaFormateada,
      motivo: motivo.trim(),
    };

    setLoading(true);
    try {
      await onSolicitar(data);
      onSuccess();
    } catch (error) {
      // Manejar error específico de solicitudes pendientes
      if (
        error.message?.includes("pendiente") ||
        error.message?.includes("pendientes") ||
        error.response?.error?.includes("pendiente")
      ) {
        setSubmitError(
          "⚠️ " +
            (error.message ||
              error.response?.error ||
              "Ya tienes solicitudes pendientes")
        );
      } else {
        setSubmitError(error.message || "❌ Error al enviar la solicitud");
      }
    } finally {
      setLoading(false);
    }
  };

  // Renderizar el selector de fecha según la plataforma
  const renderDateSelector = () => {
    if (Platform.OS === "web") {
      return (
        <View style={styles.webDateContainer}>
          <Text style={styles.inputLabel}>Fecha *</Text>
          <View style={styles.webDateWrapper}>
            <input
              type="date"
              value={formatFechaForAPI(fecha)}
              onChange={(e) => {
                const selectedDate = new Date(e.target.value);
                selectedDate.setHours(12, 0, 0, 0); // Evitar problemas de zona horaria
                onChangeDate(null, selectedDate);
              }}
              min={formatFechaForAPI(new Date())}
              style={styles.webDateInput}
            />
          </View>
          <Text style={styles.selectedDateDisplay}>
            📅 Seleccionado: {formatFechaForDisplay(fecha)}
          </Text>
        </View>
      );
    }

    // Para iOS y Android
    return (
      <View>
        <TouchableOpacity
          style={[styles.dateButton, errors.fecha && styles.inputError]}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.dateButtonText}>
            📅 {formatFechaForDisplay(fecha)}
          </Text>
          <Text style={styles.dateButtonHint}>
            Toca para seleccionar otra fecha
          </Text>
        </TouchableOpacity>

        {showDatePicker && DateTimePicker && (
          <DateTimePicker
            value={fecha}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={onChangeDate}
            minimumDate={new Date()}
            locale="es-ES"
          />
        )}
      </View>
    );
  };

  // Mostrar advertencia si tiene solicitudes pendientes
  const renderAdvertenciaPendientes = () => {
    const validacion = validarSolicitudesPendientes();

    if (validacion.tienePendientes) {
      return (
        <View style={styles.warningContainer}>
          <Text style={styles.warningTitle}>⚠️ Solicitudes Pendientes</Text>
          <Text style={styles.warningText}>
            Tienes {solicitudesPendientes.length} solicitud(es) pendiente(s) de
            revisión.
            {"\n"}Debes esperar a que sean aprobadas o canceladas antes de
            solicitar otro día.
          </Text>
          {solicitudesPendientes.map((solicitud, index) => (
            <View key={index} style={styles.pendienteItem}>
              <Text style={styles.pendienteText}>
                📅 {solicitud.fecha} - {solicitud.motivo || "Sin motivo"}
              </Text>
            </View>
          ))}
        </View>
      );
    }
    return null;
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
            <Text style={styles.modalTitle}>Solicitar Día Económico</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              📊 <Text style={styles.bold}>Disponibles:</Text>{" "}
              {estadisticas?.disponibles || 0} de {estadisticas?.total || 0}{" "}
              días
            </Text>
            {estadisticas?.es_mensual && (
              <Text style={styles.infoText}>
                ⓘ Renovación mensual - Se reinician cada mes
              </Text>
            )}
          </View>

          {/* Mostrar advertencia de solicitudes pendientes */}
          {renderAdvertenciaPendientes()}

          {submitError ? (
            <View
              style={[
                styles.errorContainer,
                submitError.includes("⚠️") && styles.warningContainer,
              ]}
            >
              <Text
                style={[
                  styles.errorText,
                  submitError.includes("⚠️") && styles.warningText,
                ]}
              >
                {submitError}
              </Text>
            </View>
          ) : null}

          <View style={styles.form}>
            {/* Selector de fecha */}
            {renderDateSelector()}

            {/* Error debajo del selector de fecha */}
            {errors.fecha ? (
              <Text style={styles.fieldErrorText}>{errors.fecha}</Text>
            ) : null}

            {errors.disponibles ? (
              <Text style={styles.fieldErrorText}>{errors.disponibles}</Text>
            ) : null}

            {/* Campo de motivo */}
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Motivo *</Text>
              <TextInput
                style={[styles.textInput, errors.motivo && styles.inputError]}
                placeholder="Describe brevemente el motivo de tu solicitud"
                value={motivo}
                onChangeText={(text) => {
                  setMotivo(text);
                  if (errors.motivo) {
                    setErrors((prev) => ({ ...prev, motivo: "" }));
                  }
                }}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
                maxLength={200}
              />
              <Text style={styles.charCount}>{motivo.length}/200</Text>

              {errors.motivo ? (
                <Text style={styles.fieldErrorText}>{errors.motivo}</Text>
              ) : null}
            </View>

            {/* Botones */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                disabled={loading || validando}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.submitButton,
                  (loading || validando || estadisticas?.disponibles <= 0) &&
                    styles.disabledButton,
                ]}
                onPress={handleSubmit}
                disabled={
                  loading || validando || estadisticas?.disponibles <= 0
                }
              >
                {loading || validando ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitButtonText}>Enviar Solicitud</Text>
                )}
              </TouchableOpacity>
            </View>
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
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#fff",
    borderRadius: 15,
    maxHeight: "90%",
    overflow: "scroll",
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
    color: colors.text,
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    color: colors.gray,
  },
  infoBox: {
    backgroundColor: colors.infoLight,
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
  },
  infoText: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  bold: {
    fontWeight: "bold",
  },
  // Advertencia de solicitudes pendientes
  warningContainer: {
    backgroundColor: "#FFF3CD",
    padding: 15,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: "#FFC107",
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#856404",
    marginBottom: 5,
  },
  warningText: {
    color: "#856404",
    fontSize: 14,
    lineHeight: 20,
  },
  pendienteItem: {
    backgroundColor: "rgba(255, 193, 7, 0.1)",
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
  },
  pendienteText: {
    color: "#856404",
    fontSize: 12,
  },
  form: {
    padding: 20,
  },
  // Estilos para selector de fecha en WEB
  webDateContainer: {
    marginBottom: 20,
  },
  webDateWrapper: {
    marginBottom: 10,
  },
  webDateInput: {
    width: "100%",
    padding: "12px",
    fontSize: "16px",
    border: "1px solid #ccc",
    borderRadius: "8px",
    backgroundColor: "#fff",
    fontFamily: "system-ui, -apple-system, sans-serif",
    boxSizing: "border-box",
  },
  selectedDateDisplay: {
    fontSize: 14,
    color: colors.textSecondary,
    fontStyle: "italic",
    marginTop: 5,
  },
  // Estilos para selector de fecha en MÓVIL
  dateButton: {
    backgroundColor: colors.light,
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    alignItems: "center",
  },
  dateButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: "600",
    marginBottom: 5,
    textAlign: "center",
  },
  dateButtonHint: {
    fontSize: 12,
    color: colors.textSecondary,
    fontStyle: "italic",
    textAlign: "center",
  },
  // Estilos comunes
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.text,
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    backgroundColor: "#fff",
  },
  charCount: {
    textAlign: "right",
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 5,
  },
  inputError: {
    borderColor: colors.danger,
    borderWidth: 1,
  },
  fieldErrorText: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 5,
    marginLeft: 5,
  },
  errorContainer: {
    backgroundColor: colors.dangerLight,
    padding: 10,
    marginHorizontal: 20,
    marginTop: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: colors.danger,
  },
  errorText: {
    color: colors.danger,
    fontSize: 14,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: colors.light,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelButtonText: {
    color: colors.text,
    fontWeight: "600",
  },
  submitButton: {
    backgroundColor: colors.primary,
  },
  disabledButton: {
    backgroundColor: colors.gray,
    opacity: 0.6,
  },
  submitButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});

export default DiaEconomicoModal;
