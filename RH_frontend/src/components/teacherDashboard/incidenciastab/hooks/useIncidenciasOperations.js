// hooks/useIncidenciasOperations.js - VERSIÓN COMPLETA CON DÍAS ECONÓMICOS
import { useState } from "react";
import { Alert } from "react-native";
import { useIncidencias } from "./useIncidencias";
import { getAuthToken } from "../shared/utils/auth";

import { API_BASE_URL } from "../../../../config/api";

export const useIncidenciasOperations = (docenteId) => {
  const {
    incidencias,
    diasEconomicos,
    diasCumpleanos,
    permisosEspeciales,
    stats,
    loading,
    error,
    refetch,
    crearIncidencia,
    eliminarIncidencia,
    solicitarDiaCumpleanos,
    solicitarDiaEconomico, // ← NUEVO: agregar esta función
    obtenerInfoDiasEconomicos, // ← NUEVO: agregar esta función
  } = useIncidencias(docenteId);

  const [selectedIncidencia, setSelectedIncidencia] = useState(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Estados para la confirmación
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [incidenciaToDelete, setIncidenciaToDelete] = useState(null);
  const [incidenciaTipoToDelete, setIncidenciaTipoToDelete] = useState("");

  // Estados para días económicos ← NUEVO
  const [selectedDiaEconomico, setSelectedDiaEconomico] = useState(null);
  const [isDiaEconomicoDetailVisible, setIsDiaEconomicoDetailVisible] =
    useState(false);

  // Estados para cumpleaños
  const [selectedCumpleanos, setSelectedCumpleanos] = useState(null);
  const [isCumpleanosDetailVisible, setIsCumpleanosDetailVisible] =
    useState(false);

  // FUNCIONES PARA DÍAS ECONÓMICOS ← NUEVO
  const openDiaEconomicoDetail = (diaEconomico) => {
    setSelectedDiaEconomico(diaEconomico);
    setIsDiaEconomicoDetailVisible(true);
  };

  const closeDiaEconomicoDetail = () => {
    setSelectedDiaEconomico(null);
    setIsDiaEconomicoDetailVisible(false);
  };

  // FUNCIÓN PARA ELIMINAR DÍA ECONÓMICO ← NUEVO
  const eliminarDiaEconomico = async (diaEconomicoId) => {
    try {
      console.log("🗑️ Iniciando eliminación de día económico:", diaEconomicoId);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(
        `${API_BASE_URL}/dias_economicos/dias-economicos/${diaEconomicoId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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

      const result = await response.json();
      console.log("✅ Día económico eliminado:", result);
      return result;
    } catch (error) {
      console.error("❌ Error eliminando día económico:", error);
      throw error;
    }
  };

  const deleteDiaEconomico = async (diaEconomicoId, estado) => {
    try {
      console.log("🗑️ Eliminando solicitud de día económico:", diaEconomicoId);

      // Verificar que solo se pueden eliminar solicitudes pendientes
      if (estado && estado.toLowerCase() !== "pendiente") {
        throw new Error("Solo se pueden eliminar solicitudes pendientes");
      }

      await eliminarDiaEconomico(diaEconomicoId);
      await refetch();
      closeDiaEconomicoDetail();
      Alert.alert(
        "✅ Éxito",
        "Solicitud de día económico eliminada correctamente"
      );
    } catch (error) {
      console.error("❌ ERROR ELIMINANDO DÍA ECONÓMICO:", error);
      Alert.alert("❌ Error", error.message);
    }
  };

  // FUNCIONES PARA CUMPLEAÑOS
  const openCumpleanosDetail = (cumpleanos) => {
    setSelectedCumpleanos(cumpleanos);
    setIsCumpleanosDetailVisible(true);
  };

  const closeCumpleanosDetail = () => {
    setSelectedCumpleanos(null);
    setIsCumpleanosDetailVisible(false);
  };

  const eliminarCumpleanos = async (cumpleanosId) => {
    try {
      console.log("🗑️ Iniciando eliminación de cumpleaños:", cumpleanosId);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(
        `${API_BASE_URL}/cumpleaños/cumpleanos/${cumpleanosId}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

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

      const result = await response.json();
      console.log("✅ Cumpleaños eliminado:", result);
      return result;
    } catch (error) {
      console.error("❌ Error eliminando cumpleaños:", error);
      throw error;
    }
  };

  const deleteCumpleanos = async (cumpleanosId, estado) => {
    try {
      console.log("🗑️ Eliminando solicitud de cumpleaños:", cumpleanosId);

      if (estado && estado.toLowerCase() !== "pendiente") {
        throw new Error("Solo se pueden eliminar solicitudes pendientes");
      }

      await eliminarCumpleanos(cumpleanosId);
      await refetch();
      closeCumpleanosDetail();
      Alert.alert(
        "✅ Éxito",
        "Solicitud de cumpleaños eliminada correctamente"
      );
    } catch (error) {
      console.error("❌ ERROR ELIMINANDO CUMPLEAÑOS:", error);
      Alert.alert("❌ Error", error.message);
    }
  };

  // FUNCIONES PARA INCIDENCIAS
  const openIncidenciaDetail = (incidencia) => {
    setSelectedIncidencia(incidencia);
    setIsDetailModalVisible(true);
  };

  const closeIncidenciaDetail = () => {
    setSelectedIncidencia(null);
    setIsDetailModalVisible(false);
  };

  const deleteIncidencia = async (incidenciaId) => {
    try {
      console.log("🗑️ Iniciando eliminación de incidencia:", incidenciaId);
      setIsDeleting(true);

      const incidencia = incidencias.find((inc) => inc.id === incidenciaId);
      if (
        incidencia &&
        incidencia.estado &&
        incidencia.estado.toLowerCase() === "aprobado"
      ) {
        throw new Error("No se puede eliminar una incidencia aprobada");
      }

      await eliminarIncidencia(incidenciaId);
      Alert.alert("✅ Éxito", "Incidencia eliminada correctamente");
    } catch (error) {
      console.error("❌ ERROR EN ELIMINACIÓN:", error);
      Alert.alert("❌ Error", error.message);
    } finally {
      setIsDeleting(false);
      setShowConfirmation(false);
      setIncidenciaToDelete(null);
      setIncidenciaTipoToDelete("");
    }
  };

  const showDeleteConfirmation = (
    incidenciaId,
    incidenciaTipo,
    incidenciaEstado
  ) => {
    console.log(
      "⚠️ Mostrando confirmación para:",
      incidenciaId,
      incidenciaTipo,
      incidenciaEstado
    );

    if (incidenciaEstado && incidenciaEstado.toLowerCase() === "aprobado") {
      Alert.alert(
        "❌ No se puede eliminar",
        "No es posible eliminar una incidencia que ha sido aprobada.",
        [{ text: "Entendido" }]
      );
      return;
    }

    closeIncidenciaDetail();

    setTimeout(() => {
      setIncidenciaToDelete(incidenciaId);
      setIncidenciaTipoToDelete(incidenciaTipo);
      setShowConfirmation(true);
    }, 300);
  };

  const confirmDelete = () => {
    console.log("✅ Confirmando eliminación de:", incidenciaToDelete);
    if (incidenciaToDelete) {
      deleteIncidencia(incidenciaToDelete);
    }
  };

  const cancelDelete = () => {
    console.log("❌ Cancelando eliminación");
    setShowConfirmation(false);
    setIncidenciaToDelete(null);
    setIncidenciaTipoToDelete("");

    if (selectedIncidencia) {
      setTimeout(() => {
        openIncidenciaDetail(selectedIncidencia);
      }, 300);
    }
  };

  return {
    // Datos
    incidencias,
    diasEconomicos,
    diasCumpleanos,
    permisosEspeciales,
    stats,
    loading,
    error,
    refetch,
    crearIncidencia,
    solicitarDiaCumpleanos,
    solicitarDiaEconomico, // ← NUEVO: exponer esta función
    obtenerInfoDiasEconomicos, // ← NUEVO: exponer esta función

    // Estados de incidencias
    selectedIncidencia,
    isDetailModalVisible,
    isDeleting,
    openIncidenciaDetail,
    closeIncidenciaDetail,
    deleteIncidencia: showDeleteConfirmation,

    // Estados de días económicos ← NUEVO
    selectedDiaEconomico,
    isDiaEconomicoDetailVisible,
    openDiaEconomicoDetail,
    closeDiaEconomicoDetail,
    deleteDiaEconomico,

    // Estados de cumpleaños
    selectedCumpleanos,
    isCumpleanosDetailVisible,
    openCumpleanosDetail,
    closeCumpleanosDetail,
    deleteCumpleanos,

    // Estados/funciones para la confirmación
    showConfirmation,
    incidenciaTipoToDelete,
    confirmDelete,
    cancelDelete,
  };
};
