// src/components/teacherDashboard/IncidenciasTab/components/modals/DiaEconomicoModal.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import DiaEconomicoService from "./DiaEconomicoServices";
import ErrorModal from "./ErrorModal";
import { styles } from "./styles";

const API_BASE = "http://10.194.1.108:5000";

const DiaEconomicoModal = ({ visible, onClose, docenteId, onSuccess }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    motivo: "",
  });

  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [infoDiasEconomicos, setInfoDiasEconomicos] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // ===== FUNCIONES AUXILIARES =====
  const obtenerInfoDiasEconomicos = async () => {
    try {
      console.log("🔍 Obteniendo información de días económicos...");

      // Simulamos datos de prueba basados en lo que recibiste
      return {
        success: true,
        data: {
          dias_disponibles: 5,
          dias_limite: 5,
          dias_usados: 0,
          mensaje: "Tienes 5 de 5 día(s) económico(s) disponible(s)",
          tipo_contrato: "cuatrimestral",
          tipo_docente: "colaborador",
        },
      };

      /*
      // Código real (comentado por ahora)
      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(
        `${API_BASE}/dias_economicos/info-dias-economicos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error("❌ Error obteniendo info días económicos:", error);
      throw error;
    }
  };

  const solicitarDiaEconomico = async (formData) => {
    try {
      console.log("📝 Solicitando día económico:", formData);

      // Simulamos éxito
      return {
        success: true,
        message: "Solicitud enviada correctamente",
      };

      /*
      // Código real (comentado por ahora)
      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const requestBody = {
        fecha: formData.fecha,
        motivo: formData.motivo.trim(),
      };

      const response = await fetch(
        `${API_BASE}/dias_economicos/dias-economicos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestBody),
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}`);
      }

      return await response.json();
      */
    } catch (error) {
      console.error("❌ Error solicitando día económico:", error);
      throw error;
    }
  };

  // ===== EFECTOS =====
  useEffect(() => {
    if (visible) {
      console.log("🚀 Modal abierto");
      loadInfoDiasEconomicos();
      resetForm();
    }
  }, [visible]);

  // ===== FUNCIONES PRINCIPALES =====
  const loadInfoDiasEconomicos = async () => {
    try {
      console.log("🔄 Cargando información de días económicos...");
      setIsLoadingInfo(true);

      const info = await obtenerInfoDiasEconomicos();
      console.log("💰 Info días económicos recibida:", info);

      if (info.success) {
        setInfoDiasEconomicos(info.data);
        console.log("✅ Información establecida:", info.data);
      } else {
        throw new Error(info.error || "Error al cargar información");
      }
    } catch (error) {
      console.error("❌ Error cargando info días económicos:", error);
      showError(`Error al cargar la información: ${error.message}`);
    } finally {
      setIsLoadingInfo(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setFormData({
        ...formData,
        fecha: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  // ===== VALIDACIONES SEPARADAS =====
  // Solo deshabilita inputs por carga/envió
  const areInputsDisabled = () => {
    const disabled = isSubmitting || isLoadingInfo;
    console.log("🔧 Inputs disabled?", disabled);
    return disabled;
  };

  // Solo deshabilita el botón de enviar
  const isSubmitButtonDisabled = () => {
    const disabled =
      isSubmitting ||
      isLoadingInfo ||
      !infoDiasEconomicos ||
      infoDiasEconomicos.dias_disponibles <= 0 ||
      !formData.motivo.trim() ||
      !formData.fecha;

    console.log("🔧 Botón disabled?", {
      disabled,
      isSubmitting,
      isLoadingInfo,
      hasInfo: !!infoDiasEconomicos,
      diasDisponibles: infoDiasEconomicos?.dias_disponibles,
      hasMotivo: !!formData.motivo.trim(),
      hasFecha: !!formData.fecha,
    });

    return disabled;
  };

  const validarFormulario = () => {
    if (!formData.motivo.trim()) {
      return "Por favor ingresa el motivo de la solicitud";
    }

    if (!formData.fecha) {
      return "Por favor selecciona una fecha";
    }

    const fechaSeleccionada = new Date(formData.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      return "No puedes solicitar días económicos para fechas pasadas";
    }

    const diaSemana = fechaSeleccionada.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      return "No puedes solicitar días económicos para fines de semana";
    }

    if (infoDiasEconomicos && infoDiasEconomicos.dias_disponibles <= 0) {
      return `No tienes días económicos disponibles\n\nLímite: ${infoDiasEconomicos.dias_limite}\nUsados: ${infoDiasEconomicos.dias_usados}`;
    }

    return null;
  };

  const handleSubmit = async () => {
    console.log("🎯 Iniciando envío...");

    if (isSubmitButtonDisabled()) {
      console.log("❌ Botón deshabilitado, no se puede enviar");
      return;
    }

    const errorValidacion = validarFormulario();
    if (errorValidacion) {
      showError(errorValidacion);
      return;
    }

    try {
      setIsSubmitting(true);
      console.log("📤 Enviando solicitud...");

      const resultado = await solicitarDiaEconomico({
        fecha: formData.fecha,
        motivo: formData.motivo.trim(),
      });

      if (resultado.success) {
        console.log("✅ Solicitud exitosa");
        Alert.alert(
          "✅ Éxito",
          resultado.message || "Solicitud enviada correctamente",
          [
            {
              text: "OK",
              onPress: () => {
                handleClose();
                if (onSuccess) onSuccess();
              },
            },
          ]
        );
      } else {
        showError(resultado.error || "Error al enviar la solicitud");
      }
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error);
      showError(`Error al enviar solicitud: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const showError = (message) => {
    console.log("🚨 Mostrando error:", message);
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const resetForm = () => {
    console.log("🔄 Reseteando formulario");
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      motivo: "",
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    console.log("🔒 Cerrando modal");
    resetForm();
    onClose();
  };

  const getButtonText = () => {
    if (isSubmitting) return "Enviando...";
    if (isLoadingInfo) return "Cargando información...";
    if (!infoDiasEconomicos) return "Cargando...";
    if (infoDiasEconomicos.dias_disponibles <= 0) return "Sin días disponibles";
    return "Solicitar Día Económico";
  };

  // ===== RENDER =====
  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Día Económico</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScrollContent}>
              {/* Información de días */}
              <View style={styles.infoCard}>
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>
                    Días Económicos Disponibles
                  </Text>

                  {isLoadingInfo ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#10b981" />
                      <Text style={styles.infoText}>
                        Cargando información...
                      </Text>
                    </View>
                  ) : infoDiasEconomicos ? (
                    <>
                      <View style={styles.statsContainer}>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Disponibles</Text>
                          <Text
                            style={[
                              styles.statValue,
                              infoDiasEconomicos.dias_disponibles <= 0 &&
                                styles.statValueError,
                            ]}
                          >
                            {infoDiasEconomicos.dias_disponibles}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Usados</Text>
                          <Text style={styles.statValue}>
                            {infoDiasEconomicos.dias_usados}
                          </Text>
                        </View>
                        <View style={styles.statItem}>
                          <Text style={styles.statLabel}>Límite</Text>
                          <Text style={styles.statValue}>
                            {infoDiasEconomicos.dias_limite}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.infoDetail}>
                        Tipo: {infoDiasEconomicos.tipo_docente} • Contrato:{" "}
                        {infoDiasEconomicos.tipo_contrato}
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.infoText}>
                      No se pudo cargar la información
                    </Text>
                  )}
                </View>
              </View>

              {/* Selección de fecha */}
              <Text style={styles.modalSubtitle}>Fecha a Solicitar</Text>
              <TouchableOpacity
                style={[
                  styles.dateInput,
                  areInputsDisabled() && styles.inputDisabled,
                ]}
                onPress={() => setShowDatePicker(true)}
                disabled={areInputsDisabled()}
              >
                <Text
                  style={[
                    styles.dateText,
                    areInputsDisabled() && styles.textDisabled,
                  ]}
                >
                  {formData.fecha}
                </Text>
                <Ionicons
                  name="calendar"
                  size={20}
                  color={areInputsDisabled() ? "#cbd5e1" : "#64748b"}
                />
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={new Date(formData.fecha)}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}

              {/* Motivo - SIEMPRE EDITABLE (excepto por carga/envió) */}
              <Text style={styles.modalSubtitle}>Motivo</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  areInputsDisabled() && styles.inputDisabled,
                ]}
                placeholder="Describe el motivo de tu solicitud..."
                value={formData.motivo}
                onChangeText={(text) => {
                  console.log("📝 Cambiando motivo a:", text);
                  setFormData({ ...formData, motivo: text });
                }}
                multiline
                numberOfLines={4}
                placeholderTextColor="#94a3b8"
                textAlignVertical="top"
                editable={!areInputsDisabled()} // Solo deshabilitado por carga/envió
                autoFocus={true}
              />

              {/* Botón de envío */}
              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isSubmitButtonDisabled() && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isSubmitButtonDisabled()}
              >
                {isSubmitting ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {getButtonText()}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Botón de debug (solo desarrollo) */}
              {__DEV__ && (
                <TouchableOpacity
                  style={styles.debugButton}
                  onPress={() => {
                    console.log("🔍 Estado actual:", {
                      formData,
                      infoDiasEconomicos,
                      isSubmitting,
                      isLoadingInfo,
                      isSubmitButtonDisabled: isSubmitButtonDisabled(),
                      areInputsDisabled: areInputsDisabled(),
                      motivoLength: formData.motivo.length,
                    });
                  }}
                >
                  <Text style={styles.debugButtonText}>🔍 DEBUG</Text>
                </TouchableOpacity>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ErrorModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={closeErrorModal}
      />
    </>
  );
};

export default DiaEconomicoModal;
