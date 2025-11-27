// En CumpleanosModal.js - VERSIÓN COMPLETA CON ERRORMODAL
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useIncidencias } from "../../hooks/useIncidencias";
import ErrorModal from "./ErrorModal"; // ← IMPORTAR EL MODAL DE ERROR
import { styles } from "./styles";

const CumpleanosModal = ({ visible, onClose, docenteId }) => {
  const {
    crearIncidencia,
    cargarInfoCumpleanos,
    refetch,
    solicitarDiaCumpleanos,
  } = useIncidencias(docenteId);

  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split("T")[0],
    motivo: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [infoCumpleanos, setInfoCumpleanos] = useState(null);

  // ESTADOS PARA EL MODAL DE ERROR
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (visible) {
      loadInfoCumpleanos();
      resetForm();
    }
  }, [visible]);

  const loadInfoCumpleanos = async () => {
    try {
      const info = await cargarInfoCumpleanos();
      console.log("🔍 Info completa recibida:", info);
      setInfoCumpleanos(info);

      if (!info.fecha_nacimiento) {
        showError(
          "Fecha de cumpleaños no registrada. Para usar este beneficio, necesitas tener registrada tu fecha de nacimiento en el sistema."
        );
      }
    } catch (error) {
      console.error("Error cargando info cumpleaños:", error);
      showError("Error al cargar la información de cumpleaños");
    }
  };
  const showSuccess = (message) => {
    // Opción A: Usar Alert temporalmente
    Alert.alert("✅ Éxito", message);

    // Opción B: O si quieres usar tu ErrorModal con otro color:
    // setErrorMessage(message);
    // setShowErrorModal(true);
    // setErrorType("success"); // Podrías agregar este estado para cambiar el color
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

    if (isSubmitting) {
      console.log("❌ Ya se está enviando, evitando duplicado");
      return;
    }

    console.log("📋 Validando formulario...");

    // Validación ESPECÍFICA del motivo (SOLO que no esté vacío)
    if (!formData.motivo.trim()) {
      console.log("❌ Validación fallida: motivo VACÍO");
      showError("Por favor ingresa el motivo de la solicitud");
      return;
    }

    // Resto de validaciones...
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

    // Verificar mes
    const fechaSeleccionada = new Date(formData.fecha);
    const mesSeleccionado = fechaSeleccionada.getMonth() + 1;

    console.log(
      `🔍 Validación de mes: seleccionado=${mesSeleccionado}, cumpleaños=${infoCumpleanos.mes_cumpleanos}`
    );

    if (mesSeleccionado !== infoCumpleanos.mes_cumpleanos) {
      console.log("❌ Validación fallida: mes incorrecto");
      showError(
        `Solo puedes solicitar días de cumpleaños en tu mes natal (${getNombreMes(
          infoCumpleanos.mes_cumpleanos
        )})`
      );
      return;
    }

    // Verificar que tiene fecha de nacimiento registrada
    if (!infoCumpleanos?.fecha_nacimiento) {
      console.log("❌ Validación fallida: no tiene fecha de nacimiento");
      showError(
        "No tienes fecha de nacimiento registrada. Contacta con administración."
      );
      return;
    }

    // Verificar que tiene días disponibles
    if (infoCumpleanos?.dias_disponibles === 0) {
      console.log("❌ Validación fallida: no tiene días disponibles");
      showError("Ya has usado tu día de cumpleaños este año.");
      return;
    }

    console.log("✅ Todas las validaciones pasadas, enviando...");

    try {
      setIsSubmitting(true);

      // USAR LA FUNCIÓN ESPECÍFICA PARA CUMPLEAÑOS
      await solicitarDiaCumpleanos({
        fecha: formData.fecha,
        motivo: formData.motivo,
      });

      // Recargar datos para actualizar los días disponibles
      await refetch();
      handleClose();
      showSuccess("Solicitud de día de cumpleaños enviada correctamente");
    } catch (error) {
      console.error("Error en handleSubmit:", error);
      showError(error.message || "Error al enviar la solicitud");
    } finally {
      setIsSubmitting(false);
    }
  };

  // FUNCIÓN CORREGIDA: Formatear fecha de nacimiento
  const formatFechaNacimiento = (fechaStr) => {
    if (!fechaStr) return "No disponible";

    try {
      const [año, mes, dia] = fechaStr.split("-").map(Number);
      return `${dia}/${mes}/${año}`;
    } catch (error) {
      return fechaStr;
    }
  };

  // FUNCIÓN CORREGIDA: Obtener nombre del mes
  const getNombreMes = (numeroMes) => {
    const meses = [
      "Enero",
      "Febrero",
      "Marzo",
      "Abril",
      "Mayo",
      "Junio",
      "Julio",
      "Agosto",
      "Septiembre",
      "Octubre",
      "Noviembre",
      "Diciembre",
    ];
    return meses[numeroMes - 1] || "Mes inválido";
  };

  const resetForm = () => {
    setFormData({
      fecha: new Date().toISOString().split("T")[0],
      motivo: "",
    });
  };

  const handleClose = () => {
    if (isSubmitting) return;
    resetForm();
    setIsSubmitting(false);
    onClose();
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* HEADER FIJO */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Día de Cumpleaños</Text>
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
              {/* Información del cumpleaños */}
              <View style={styles.infoCard}>
                <Ionicons name="gift-outline" size={20} color="#8b5cf6" />
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Beneficio de Cumpleaños</Text>

                  {infoCumpleanos?.fecha_nacimiento ? (
                    <>
                      <Text style={styles.infoText}>
                        • Fecha de nacimiento:{" "}
                        <Text style={styles.highlight}>
                          {formatFechaNacimiento(
                            infoCumpleanos.fecha_nacimiento
                          )}
                        </Text>
                      </Text>
                      <Text style={styles.infoText}>
                        • Mes de cumpleaños:{" "}
                        <Text style={styles.highlight}>
                          {getNombreMes(infoCumpleanos.mes_cumpleanos)}
                        </Text>
                      </Text>
                      <Text style={styles.infoText}>
                        • Días disponibles:{" "}
                        <Text style={styles.highlight}>
                          {infoCumpleanos.dias_disponibles}/1
                        </Text>
                      </Text>
                    </>
                  ) : (
                    <Text style={[styles.infoText, { color: "#ef4444" }]}>
                      ⚠️ No tienes fecha de nacimiento registrada
                    </Text>
                  )}

                  <Text style={styles.infoText}>
                    • Solo puedes usar este beneficio en tu mes natal
                  </Text>
                  <Text style={styles.infoText}>
                    • 1 día por año, no acumulable
                  </Text>
                  <Text style={styles.infoText}>
                    • No afecta tus días económicos
                  </Text>
                </View>
              </View>

              <Text style={styles.modalSubtitle}>Fecha a Solicitar</Text>
              <TextInput
                style={styles.input}
                placeholder="Fecha (YYYY-MM-DD)"
                value={formData.fecha}
                onChangeText={(text) =>
                  setFormData({ ...formData, fecha: text })
                }
                placeholderTextColor="#94a3b8"
              />

              <Text style={styles.modalSubtitle}>Motivo de la Solicitud</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Describe el motivo de tu solicitud..."
                value={formData.motivo}
                onChangeText={(text) =>
                  setFormData({ ...formData, motivo: text })
                }
                multiline
                numberOfLines={3}
                placeholderTextColor="#94a3b8"
              />

              <TouchableOpacity
                style={[
                  styles.primaryButton,
                  (isSubmitting ||
                    !infoCumpleanos?.fecha_nacimiento ||
                    infoCumpleanos?.dias_disponibles === 0) &&
                    styles.primaryButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={
                  isSubmitting ||
                  !infoCumpleanos?.fecha_nacimiento ||
                  infoCumpleanos?.dias_disponibles === 0
                }
              >
                {isSubmitting ? (
                  <>
                    <ActivityIndicator size="small" color="white" />
                    <Text style={styles.primaryButtonText}>Enviando...</Text>
                  </>
                ) : (
                  <Text style={styles.primaryButtonText}>
                    Solicitar Día de Cumpleaños
                  </Text>
                )}
              </TouchableOpacity>

              {/* Nota adicional */}
              <View style={styles.noteCard}>
                <Text style={styles.noteText}>
                  💡 <Text style={styles.noteBold}>Recuerda:</Text>{" "}
                  {infoCumpleanos?.fecha_nacimiento
                    ? "Esta solicitud será revisada y deberás presentar comprobante de tu fecha de nacimiento si es requerido."
                    : "Contacta con administración para registrar tu fecha de nacimiento y poder usar este beneficio."}
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

export default CumpleanosModal;
