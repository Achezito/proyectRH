// teacherDashboard/incidenciastab/hooks/useDiaEconomicos.js
import { useState, useEffect, useCallback } from "react";
import { Alert } from "react-native";
import {
  obtenerMisSolicitudesDiasEconomicos,
  solicitarDiaEconomico,
  cancelarSolicitudDiaEconomico,
} from "../shared/utils/apiEconomico";

export const useDiasEconomicos = (docenteId) => {
  const [diasEconomicos, setDiasEconomicos] = useState([]);
  const [solicitudesPendientes, setSolicitudesPendientes] = useState([]); // ← NUEVO ESTADO
  const [estadisticasDias, setEstadisticasDias] = useState({
    disponibles: 0,
    usados: 0,
    total: 0,
    es_mensual: false,
    tipo_contrato: "",
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDiaEconomico, setSelectedDiaEconomico] = useState(null);
  const [isDiaEconomicoDetailVisible, setIsDiaEconomicoDetailVisible] =
    useState(false);
  const [deleting, setDeleting] = useState(false);

  const [error, setError] = useState(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState("Error");
  const [errorDetails, setErrorDetails] = useState("");

  const fetchDiasEconomicos = useCallback(async () => {
    if (!docenteId) return;

    try {
      console.log(`🔍 Obteniendo días económicos para docente: ${docenteId}`);
      const response = await obtenerMisSolicitudesDiasEconomicos(docenteId);

      if (response.success) {
        console.log("✅ Datos obtenidos:", {
          solicitudes: response.data?.length || 0,
          estadisticas: response.estadisticas,
        });

        setDiasEconomicos(response.data || []);
        setEstadisticasDias(response.estadisticas || {});

        // FILTRAR SOLICITUDES PENDIENTES
        const pendientes = (response.data || []).filter(
          (solicitud) => solicitud.estado === "pendiente"
        );
        console.log(
          `📝 Solicitudes pendientes encontradas: ${pendientes.length}`
        );
        setSolicitudesPendientes(pendientes);

        setError(null); // Limpiar error si fue exitoso
      } else {
        console.error("❌ Error en respuesta:", response.error);

        setError({
          title: "Error al cargar datos",
          message:
            response.error || "No se pudieron cargar los días económicos",
          type: "fetch",
        });
        setErrorVisible(true);

        // Establecer datos vacíos
        setDiasEconomicos([]);
        setSolicitudesPendientes([]); // ← Vaciar pendientes también
        setEstadisticasDias({
          disponibles: 0,
          usados: 0,
          total: 0,
          es_mensual: false,
          tipo_contrato: "",
          pendientes: 0,
          aprobados: 0,
          rechazados: 0,
        });
      }
    } catch (error) {
      console.error("❌ Error fetchDiasEconomicos:", error);

      setError({
        title: "Error de conexión",
        message:
          "No se pudo conectar con el servidor. Verifica tu conexión a internet.",
        type: "network",
      });
      setErrorVisible(true);

      // Limpiar estados en caso de error
      setDiasEconomicos([]);
      setSolicitudesPendientes([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [docenteId]);

  useEffect(() => {
    fetchDiasEconomicos();
  }, [fetchDiasEconomicos]);

  const refetch = async () => {
    setRefreshing(true);
    await fetchDiasEconomicos();
  };

  const solicitarDiaEconomicoHandler = async (data) => {
    try {
      console.log("📤 Enviando solicitud:", data);

      // VALIDAR LOCALMENTE SI HAY SOLICITUDES PENDIENTES
      if (solicitudesPendientes.length > 0) {
        const errorMsg = `Ya tienes ${solicitudesPendientes.length} solicitud(es) pendiente(s). Debes esperar a que sean procesadas antes de solicitar otro día.`;
        console.error("❌ Validación local:", errorMsg);
        throw new Error(errorMsg);
      }

      const response = await solicitarDiaEconomico(data);

      if (response.success) {
        console.log("✅ Solicitud creada:", response.data);
        await refetch();
        return { success: true, message: response.message };
      } else {
        console.error("❌ Error en solicitud:", response.error);

        let errorMessage = response.error || "Error al solicitar día económico";

        // Errores comunes del backend
        if (response.error.includes("No tiene días económicos disponibles")) {
          errorMessage = "❌ No tienes días económicos disponibles";
        } else if (
          response.error.includes("Ya tiene una solicitud para esta fecha")
        ) {
          errorMessage = "📅 Ya tienes una solicitud para esta fecha";
        } else if (response.error.includes("No hay período activo")) {
          errorMessage =
            "📋 No hay un período activo. Contacta al administrador.";
        } else if (response.error.includes("pendiente")) {
          // Manejar error específico de solicitudes pendientes
          errorMessage = `⚠️ ${response.error}`;
        }

        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error("❌ Error en solicitarDiaEconomicoHandler:", error);
      throw error;
    }
  };

  const cancelarSolicitudDiaEconomicoHandler = async (solicitudId) => {
    console.log("🗑️ Hook: Cancelando solicitud", solicitudId);

    try {
      setDeleting(true);
      const response = await cancelarSolicitudDiaEconomico(solicitudId);

      console.log("📡 Respuesta API:", response);

      if (response.success) {
        // Recargar datos
        await refetch();

        return {
          success: true,
          message: response.message || "Solicitud cancelada exitosamente",
        };
      } else {
        return {
          success: false,
          error: response.error || "Error al cancelar",
        };
      }
    } catch (error) {
      console.error("🔥 Error en hook:", error);
      return {
        success: false,
        error: error.message || "Error de conexión",
      };
    } finally {
      setDeleting(false);
    }
  };

  // Funciones para manejar errores
  const clearError = () => {
    setError(null);
    setErrorVisible(false);
    setErrorTitle("Error");
    setErrorDetails("");
  };

  const showError = (title, message, details = "") => {
    setErrorTitle(title);
    setErrorDetails(details);
    setErrorVisible(true);
  };

  return {
    // Datos
    diasEconomicos,
    solicitudesPendientes, // ← EXPORTAR ESTE ESTADO
    estadisticasDias,
    loading,
    refreshing,
    selectedDiaEconomico,
    isDiaEconomicoDetailVisible,
    deleting,

    // Estados de error
    error,
    errorVisible,
    errorTitle,
    errorDetails,

    // Funciones
    refetch,
    solicitarDiaEconomico: solicitarDiaEconomicoHandler,
    cancelarSolicitudDiaEconomico: cancelarSolicitudDiaEconomicoHandler,
    openDiaEconomicoDetail: (item) => {
      setSelectedDiaEconomico(item);
      setIsDiaEconomicoDetailVisible(true);
    },
    closeDiaEconomicoDetail: () => {
      setSelectedDiaEconomico(null);
      setIsDiaEconomicoDetailVisible(false);
    },

    // Funciones de error
    clearError,
    showError,
  };
};
