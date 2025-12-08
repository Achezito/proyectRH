import { useState, useEffect, useCallback, useRef } from "react";
import { getAuthToken } from "../shared/utils/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../../../../config/api";

export const useIncidencias = (docenteId) => {
  const [incidencias, setIncidencias] = useState([]);
  const [diasCumpleanos, setDiasCumpleanos] = useState([]);
  const [permisosEspeciales, setPermisosEspeciales] = useState([]);
  const [stats, setStats] = useState({
    totalIncidencias: 0,
    incidenciasPendientes: 0,
    diasCumpleanos: 1,
    diasCumpleanosUsados: 0,
    diasCumpleanosDisponibles: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const isFetchingRef = useRef(false);
  const lastFetchTimeRef = useRef(0);

  const loadIncidenciasData = useCallback(async () => {
    if (isFetchingRef.current) return;

    const now = Date.now();
    if (now - lastFetchTimeRef.current < 2000) return;

    isFetchingRef.current = true;
    lastFetchTimeRef.current = now;

    try {
      setLoading(true);
      setError(null);

      const tokenDataString = await AsyncStorage.getItem("auth_token_data");

      if (!tokenDataString) {
        setError("No hay sesión activa. Por favor, inicia sesión.");
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      const token = await getAuthToken();

      if (!token) {
        setError("Sesión no válida. Por favor, inicia sesión nuevamente.");
        setLoading(false);
        isFetchingRef.current = false;
        return;
      }

      const headers = {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      try {
        const [incidenciasRes, cumpleanosRes, statsRes] = await Promise.all([
          fetch(`${API_BASE_URL}/formulario/incidencias`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/cumpleaños/cumpleanos`, {
            headers,
            signal: controller.signal,
          }),
          fetch(`${API_BASE_URL}/formulario/estadisticas`, {
            headers,
            signal: controller.signal,
          }),
        ]);

        clearTimeout(timeoutId);

        if (!incidenciasRes.ok) throw new Error(`Error al cargar incidencias`);

        let cumpleanosData = [];
        if (cumpleanosRes.ok) {
          cumpleanosData = await cumpleanosRes.json();
        }

        if (!statsRes.ok) throw new Error(`Error al cargar estadísticas`);

        const [incidenciasData, statsData] = await Promise.all([
          incidenciasRes.json(),
          statsRes.json(),
        ]);

        setIncidencias(incidenciasData || []);
        setDiasCumpleanos(cumpleanosData || []);
        setStats({
          ...statsData,
          diasCumpleanos: 1,
          diasCumpleanosUsados: 0,
          diasCumpleanosDisponibles: 1,
        });

        setError(null);
      } catch (fetchError) {
        clearTimeout(timeoutId);
        if (fetchError.name === "AbortError") {
          throw new Error("La solicitud tardó demasiado. Intenta nuevamente.");
        }
        throw fetchError;
      }
    } catch (error) {
      setError(error.message);
      setIncidencias([]);
      setDiasCumpleanos([]);
      setStats({
        totalIncidencias: 0,
        incidenciasPendientes: 0,
        diasCumpleanos: 1,
        diasCumpleanosUsados: 0,
        diasCumpleanosDisponibles: 1,
      });
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (docenteId) {
      const timer = setTimeout(() => {
        loadIncidenciasData();
      }, 300);
      return () => clearTimeout(timer);
    } else {
      setError("ID de docente no disponible");
      setLoading(false);
    }
  }, [docenteId, loadIncidenciasData]);

  const refetch = useCallback(() => {
    loadIncidenciasData();
  }, [loadIncidenciasData]);

  const solicitarDiaCumpleanos = async (formData) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(`${API_BASE_URL}/cumpleaños/cumpleanos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorMsg = `Error ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = errorText || errorMsg;
        }

        throw new Error(errorMsg);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  const crearIncidencia = async (incidenciaData) => {
    try {
      if (!incidenciaData || typeof incidenciaData !== "object") {
        throw new Error("Datos de incidencia no válidos");
      }

      const { tipo, motivo, fecha, horaEntrada, horaSalida, minutos, imagen } =
        incidenciaData;

      if (!tipo) throw new Error("El tipo de incidencia es requerido");
      if (!motivo) throw new Error("El motivo es requerido");
      if (!fecha) throw new Error("La fecha es requerida");

      const fechaRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!fechaRegex.test(fecha)) {
        throw new Error("Formato de fecha incorrecto. Use YYYY-MM-DD");
      }

      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const datosParaEnviar = {
        tipo,
        motivo,
        fecha,
        minutos: parseInt(minutos) || 0,
        horaEntrada: horaEntrada || null,
        horaSalida: horaSalida || null,
        docente_id: docenteId || null,
      };

      if (imagen?.uri) {
        try {
          const response = await fetch(imagen.uri);
          const blob = await response.blob();

          const base64data = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.readAsDataURL(blob);
          });

          datosParaEnviar.imagen_data = base64data;
          datosParaEnviar.imagen_nombre =
            imagen.fileName || `justificacion_${Date.now()}.jpg`;
          datosParaEnviar.imagen_tipo = imagen.type || "image/jpeg";
        } catch {
          // Se continúa sin imagen
        }
      }

      const response = await fetch(`${API_BASE_URL}/formulario/incidencias`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosParaEnviar),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorMsg = `Error ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorMsg;
        } catch {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const nuevaIncidencia = JSON.parse(responseText);
      await loadIncidenciasData();
      return nuevaIncidencia;
    } catch (error) {
      throw error;
    }
  };

  const eliminarIncidencia = async (incidenciaId) => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${API_BASE_URL}/formulario/incidencias/${incidenciaId}`,
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
        } catch {
          errorMsg = errorText || errorMsg;
        }

        throw new Error(errorMsg);
      }

      const result = await response.json();
      await loadIncidenciasData();
      return result;
    } catch (error) {
      throw error;
    }
  };

  const cargarInfoCumpleanos = async () => {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${API_BASE_URL}/cumpleaños/info-cumpleanos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    loadIncidenciasData();
  }, [docenteId]);

  return {
    incidencias,
    diasCumpleanos,
    permisosEspeciales,
    stats,
    loading,
    error,
    refetch,
    crearIncidencia,
    eliminarIncidencia,
    cargarInfoCumpleanos,
    solicitarDiaCumpleanos,
  };
};
