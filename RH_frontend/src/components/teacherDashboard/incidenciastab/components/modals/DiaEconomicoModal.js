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
import { getAuthToken } from "../../shared/utils/auth";
import ErrorModal from "./ErrorModal";
import { styles } from "./styles";

const API_BASE = "http://10.194.1.108:5000";

const DiaEconomicoModal = ({ visible, onClose, docenteId, onSuccess }) => {
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    motivo: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [infoDiasEconomicos, setInfoDiasEconomicos] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  // FUNCIÓN PARA OBTENER INFO DÍAS ECONÓMICOS
  const obtenerInfoDiasEconomicos = async () => {
    try {
      console.log("🔍 Obteniendo información de días económicos...");
      setIsLoadingInfo(true);
      setDebugInfo("Cargando información...");

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

      console.log("📊 Respuesta de info días económicos:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Error ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = errorText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log("💰 Info días económicos recibida:", data);
      setDebugInfo(
        `Info cargada: ${data.dias_disponibles} disponibles de ${data.dias_limite}`
      );
      return data;
    } catch (error) {
      console.error("❌ Error obteniendo info días económicos:", error);
      setDebugInfo(`Error: ${error.message}`);
      throw error;
    } finally {
      setIsLoadingInfo(false);
    }
  };

  // FUNCIÓN PARA SOLICITAR DÍA ECONÓMICO
  const solicitarDiaEconomico = async (formData) => {
    try {
      console.log("📝 Solicitando día económico:", formData);
      setDebugInfo(`Enviando solicitud para: ${formData.fecha}`);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const requestBody = {
        fecha: formData.fecha,
        motivo: formData.motivo.trim(),
      };

      console.log("📤 Request body:", requestBody);

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

      console.log("📤 Respuesta de solicitud día económico:", response.status);

      // Obtener la respuesta completa para debug
      const responseText = await response.text();
      console.log("📤 Respuesta completa:", responseText);

      if (!response.ok) {
        let errorMsg = `Error ${response.status}`;

        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorMsg;
          console.log("❌ Error del backend:", errorData);
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }

        // Manejo específico para el error de días no disponibles
        if (errorMsg.includes("No tienes días económicos disponibles")) {
          setDebugInfo(`Backend rechazó: ${errorMsg}`);
          throw new Error(
            "No tienes días económicos disponibles. Verifica tu límite anual."
          );
        }

        setDebugInfo(`Error ${response.status}: ${errorMsg}`);
        throw new Error(errorMsg);
      }

      // Parsear la respuesta exitosa
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (e) {
        result = { mensaje: "Solicitud exitosa" };
      }

      console.log("✅ Día económico solicitado exitosamente:", result);
      setDebugInfo("✅ Solicitud exitosa");
      return result;
    } catch (error) {
      console.error("❌ Error solicitando día económico:", error);
      setDebugInfo(`Error en solicitud: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    if (visible) {
      loadInfoDiasEconomicos();
      resetForm();
    }
  }, [visible]);

  const loadInfoDiasEconomicos = async () => {
    try {
      console.log("🔄 Cargando información de días económicos...");
      const info = await obtenerInfoDiasEconomicos();
      console.log("💰 Info días económicos recibida:", info);
      setInfoDiasEconomicos(info);
    } catch (error) {
      console.error("❌ Error cargando info días económicos:", error);
      showError(`Error al cargar la información: ${error.message}`);
    }
  };

  // FUNCIÓN PARA MOSTRAR ERROR
  const showError = (message) => {
    setErrorMessage(message);
    setShowErrorModal(true);
  };

  // FUNCIÓN PARA CERRAR ERROR
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setErrorMessage("");
  };

  const handleSubmit = async () => {
    console.log("🎯 handleSubmit ejecutándose");
    setDebugInfo("Iniciando envío...");

    if (isSubmitting) {
      console.log("❌ Ya se está enviando, evitando duplicado");
      return;
    }

    console.log("📋 Validando formulario...");

    // Validaciones
    if (!formData.motivo.trim()) {
      console.log("❌ Validación fallida: motivo VACÍO");
      showError("Por favor ingresa el motivo de la solicitud");
      return;
    }

    if (!formData.fecha) {
      console.log("❌ Validación fallida: fecha vacía");
      showError("Por favor ingresa la fecha");
      return;
    }

    const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!fechaRegex.test(formData.fecha)) {
      console.log("❌ Validación fallida: formato de fecha incorrecto");
      showError("Formato de fecha incorrecto. Use YYYY-MM-DD");
      return;
    }

    // Verificar que tiene días disponibles (validación frontend adicional)
    if (infoDiasEconomicos && infoDiasEconomicos.dias_disponibles <= 0) {
      console.log(
        "❌ Validación fallida: no tiene días disponibles en frontend"
      );
      showError(
        `No tienes días económicos disponibles.\n\n` +
          `Límite anual: ${infoDiasEconomicos.dias_limite} días\n` +
          `Días usados: ${infoDiasEconomicos.dias_usados}\n` +
          `Disponibles: ${infoDiasEconomicos.dias_disponibles}`
      );
      return;
    }

    // Verificar que la fecha no sea en el pasado
    const fechaSeleccionada = new Date(formData.fecha);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    if (fechaSeleccionada < hoy) {
      console.log("❌ Validación fallida: fecha en pasado");
      showError("No puedes solicitar días económicos para fechas pasadas");
      return;
    }

    // Verificar que no sea fin de semana
    const diaSemana = fechaSeleccionada.getDay();
    if (diaSemana === 0 || diaSemana === 6) {
      console.log("❌ Validación fallida: es fin de semana");
      showError("No puedes solicitar días económicos para fines de semana");
      return;
    }

    console.log("✅ Todas las validaciones pasadas, enviando...");
    setDebugInfo("Validaciones pasadas, enviando al backend...");

    try {
      setIsSubmitting(true);

      const resultado = await solicitarDiaEconomico({
        fecha: formData.fecha,
        motivo: formData.motivo.trim(),
      });

      // Recargar datos y cerrar modal
      handleClose();
      Alert.alert(
        "✅ Éxito",
        "Solicitud de día económico enviada correctamente",
        [
          {
            text: "OK",
            onPress: () => {
              if (onSuccess) onSuccess();
            },
          },
        ]
      );
    } catch (error) {
      console.error("❌ Error en handleSubmit:", error);

      // Manejo específico para el error de días no disponibles
      if (error.message.includes("No tienes días económicos disponibles")) {
        // Recargar la información para mostrar datos actualizados
        await loadInfoDiasEconomicos();
        showError(
          `❌ Error del sistema\n\n` +
            `El backend indica que no tienes días disponibles, pero el frontend muestra:\n` +
            `• Límite anual: ${infoDiasEconomicos?.dias_limite || 0} días\n` +
            `• Días usados: ${infoDiasEconomicos?.dias_usados || 0}\n` +
            `• Disponibles: ${infoDiasEconomicos?.dias_disponibles || 0}\n\n` +
            `Posibles causas:\n` +
            `• Hay una inconsistencia en la base de datos\n` +
            `• Tu contrato puede tener restricciones adicionales\n` +
            `• Contacta con administración para verificar tu situación`
        );
      } else {
        showError(`Error al enviar la solicitud: ${error.message}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      motivo: "",
    });
    setDebugInfo("");
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    setIsSubmitting(false);
    onClose();
  };

  // Función para determinar si el botón debe estar deshabilitado
  const isButtonDisabled = () => {
    return (
      isSubmitting ||
      isLoadingInfo ||
      !infoDiasEconomicos ||
      infoDiasEconomicos.dias_disponibles <= 0
    );
  };

  // Función para obtener el texto del botón
  const getButtonText = () => {
    if (isSubmitting) return "Enviando...";
    if (isLoadingInfo) return "Cargando información...";
    if (!infoDiasEconomicos) return "Cargando...";
    if (infoDiasEconomicos.dias_disponibles <= 0) return "Sin Días Disponibles";
    return "Solicitar Día Económico";
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* HEADER FIJO */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Solicitar Día Económico</Text>
              <TouchableOpacity onPress={handleClose} disabled={isSubmitting}>
                <Ionicons name="close" size={24} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* CONTENIDO DESPLAZABLE */}
            <ScrollView
              style={styles.modalScrollContent}
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.modalScrollContainer}
            >
              {/* Información de días económicos */}
              <View style={styles.infoCard}>
                <Ionicons name="calendar-outline" size={20} color="#10b981" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>
                    Beneficio de Días Económicos
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
                      <Text style={styles.infoText}>
                        • Días disponibles:{" "}
                        <Text
                          style={[
                            styles.highlight,
                            infoDiasEconomicos.dias_disponibles <= 0 &&
                              styles.noDiasText,
                          ]}
                        >
                          {infoDiasEconomicos.dias_disponibles}/
                          {infoDiasEconomicos.dias_limite}
                        </Text>
                        {infoDiasEconomicos.dias_disponibles <= 0 && (
                          <Text style={styles.warningText}> ⚠️</Text>
                        )}
                      </Text>
                      <Text style={styles.infoText}>
                        • Días usados este año:{" "}
                        <Text style={styles.highlight}>
                          {infoDiasEconomicos.dias_usados}
                        </Text>
                      </Text>
                      <Text style={styles.infoText}>
                        • Tipo de contrato:{" "}
                        <Text style={styles.highlight}>
                          {infoDiasEconomicos.tipo_contrato}
                        </Text>
                      </Text>
                      <Text style={styles.infoText}>
                        • Tipo de docente:{" "}
                        <Text style={styles.highlight}>
                          {infoDiasEconomicos.tipo_docente}
                        </Text>
                      </Text>
                    </>
                  ) : (
                    <Text style={styles.infoText}>
                      No se pudo cargar la información
                    </Text>
                  )}

                  {/* Información de debug */}
                  {__DEV__ && debugInfo && (
                    <View style={styles.debugCard}>
                      <Text style={styles.debugText}>🔧 {debugInfo}</Text>
                    </View>
                  )}
                </View>
              </View>

              <Text style={styles.modalSubtitle}>Fecha a Solicitar</Text>
              <TextInput
                style={styles.input}
                placeholder="YYYY-MM-DD"
                value={formData.fecha}
                onChangeText={(text) =>
                  setFormData({ ...formData, fecha: text })
                }
                placeholderTextColor="#94a3b8"
                editable={!isButtonDisabled()}
              />
              <Text style={styles.inputHelp}>
                Formato: Año-Mes-Día (Ej: 2024-12-25)
              </Text>

              <Text style={styles.modalSubtitle}>Motivo de la Solicitud</Text>
              <TextInput
                style={[
                  styles.input,
                  styles.textArea,
                  isButtonDisabled() && styles.inputDisabled,
                ]}
                placeholder="Describe el motivo de tu solicitud..."
                value={formData.motivo}
                onChangeText={(text) =>
                  setFormData({ ...formData, motivo: text })
                }
                multiline
                numberOfLines={4}
                placeholderTextColor="#94a3b8"
                textAlignVertical="top"
                editable={!isButtonDisabled()}
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  isButtonDisabled() && styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={isButtonDisabled()}
              >
                {isSubmitting || isLoadingInfo ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.primaryButtonText}>
                      {isSubmitting ? "Enviando..." : "Cargando..."}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {getButtonText()}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Información de ayuda */}
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>
                  💡 <Text style={styles.noteBold}>Problema detectado:</Text>{" "}
                  Hay una inconsistencia entre lo que muestra el sistema y lo
                  que permite el backend.{" "}
                  <Text style={styles.noteBold}>
                    Contacta con administración
                  </Text>{" "}
                  para verificar tu situación real de días económicos.
                </Text>
              </View>

              {/* ESPACIO EXTRA PARA SCROLL */}
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* MODAL DE ERROR */}
      <ErrorModal
        visible={showErrorModal}
        message={errorMessage}
        onClose={closeErrorModal}
      />
    </>
  );
};

export default DiaEconomicoModal;
