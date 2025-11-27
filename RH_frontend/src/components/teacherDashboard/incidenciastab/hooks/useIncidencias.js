// hooks/useIncidencias.js - VERSIÓN CORREGIDA
import { useState, useEffect } from "react";
import { getAuthToken } from "../shared/utils/auth";

const API_BASE = "http://10.194.1.108:5000";

export const useIncidencias = (docenteId) => {
  const [incidencias, setIncidencias] = useState([]);
  const [diasEconomicos, setDiasEconomicos] = useState([]);
  const [diasCumpleanos, setDiasCumpleanos] = useState([]);
  const [permisosEspeciales, setPermisosEspeciales] = useState([]);
  const [stats, setStats] = useState({
    totalIncidencias: 0,
    incidenciasPendientes: 0,
    diasEconomicosUsados: 0,
    diasDisponibles: 5,
    diasCumpleanos: 1,
    diasCumpleanosUsados: 0,
    diasCumpleanosDisponibles: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadIncidenciasData = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getAuthToken();

      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      console.log("🔍 Cargando datos del backend...");

      // CORREGIDO: Agregar todas las llamadas necesarias
      const [
        incidenciasRes,
        diasRes,
        cumpleanosRes,
        diasEconomicosInfoRes,
        statsRes,
      ] = await Promise.all([
        fetch(`${API_BASE}/formulario/incidencias`, { headers }),
        fetch(`${API_BASE}/formulario/dias-economicos`, { headers }),
        fetch(`${API_BASE}/cumpleaños/cumpleanos`, { headers }),
        fetch(`${API_BASE}/dias_economicos/info-dias-economicos`, { headers }), // ← NUEVA LLAMADA
        fetch(`${API_BASE}/formulario/estadisticas`, { headers }),
      ]);

      // Manejar errores de forma más específica
      if (incidenciasRes.status === 401) {
        throw new Error(
          "Sesión expirada. Por favor, inicia sesión nuevamente."
        );
      }
      if (!incidenciasRes.ok) {
        throw new Error(
          `Error al cargar incidencias: ${incidenciasRes.status}`
        );
      }

      if (diasRes.status === 401) {
        throw new Error(
          "Sesión expirada. Por favor, inicia sesión nuevamente."
        );
      }
      if (!diasRes.ok) {
        throw new Error(`Error al cargar días económicos: ${diasRes.status}`);
      }

      // Manejar error para cumpleaños
      let cumpleanosData = [];
      if (cumpleanosRes.ok) {
        cumpleanosData = await cumpleanosRes.json();
      } else if (cumpleanosRes.status !== 404) {
        console.warn(
          "⚠️ Error cargando días de cumpleaños:",
          cumpleanosRes.status
        );
      }

      // Manejar error para info días económicos
      let diasEconomicosInfo = { dias_disponibles: 0, dias_usados: 0 };
      if (diasEconomicosInfoRes.ok) {
        diasEconomicosInfo = await diasEconomicosInfoRes.json();
      } else if (diasEconomicosInfoRes.status !== 404) {
        console.warn(
          "⚠️ Error cargando info días económicos:",
          diasEconomicosInfoRes.status
        );
      }

      if (statsRes.status === 401) {
        throw new Error(
          "Sesión expirada. Por favor, inicia sesión nuevamente."
        );
      }
      if (!statsRes.ok) {
        throw new Error(`Error al cargar estadísticas: ${statsRes.status}`);
      }

      // CORREGIDO: Incluir todas las respuestas
      const [incidenciasData, diasData, statsData] = await Promise.all([
        incidenciasRes.json(),
        diasRes.json(),
        statsRes.json(),
      ]);

      console.log("✅ Datos cargados del backend");
      console.log("💰 Info días económicos:", diasEconomicosInfo);

      setIncidencias(incidenciasData);
      setDiasEconomicos(diasData);
      setDiasCumpleanos(cumpleanosData);

      // CORREGIDO: Combinar estadísticas con datos reales
      setStats({
        ...statsData,
        diasDisponibles: diasEconomicosInfo.dias_disponibles || 0, // ← USAR DATO REAL
        diasEconomicosUsados: diasEconomicosInfo.dias_usados || 0,
      });
    } catch (error) {
      console.error("❌ Error cargando datos del backend:", error);
      setError(error.message);

      // No limpiamos los datos en caso de error 401, mantenemos lo que haya
      if (!error.message.includes("Sesión expirada")) {
        setIncidencias([]);
        setDiasEconomicos([]);
        setDiasCumpleanos([]);
        setPermisosEspeciales([]);
        setStats({
          totalIncidencias: 0,
          incidenciasPendientes: 0,
          diasEconomicosUsados: 0,
          diasDisponibles: 0,
          diasCumpleanos: 1,
          diasCumpleanosUsados: 0,
          diasCumpleanosDisponibles: 1,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // En hooks/useIncidencias.js - AGREGAR ESTA FUNCIÓN
  const solicitarDiaCumpleanos = async (formData) => {
    try {
      console.log("🎂 Enviando solicitud de cumpleaños:", formData);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(`${API_BASE}/cumpleaños/cumpleanos`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      console.log(`📨 Respuesta del servidor: ${response.status}`);

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
      console.log("✅ Solicitud de cumpleaños enviada:", result);
      return result;
    } catch (error) {
      console.error("❌ Error solicitando día de cumpleaños:", error);
      throw error;
    }
  };
  // FUNCIÓN PARA OBTENER INFO DE DÍAS ECONÓMICOS ← AÑADE ESTA FUNCIÓN
  const obtenerInfoDiasEconomicos = async () => {
    try {
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
        const errorText = await response.text();
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("💰 Info días económicos:", data);
      return data;
    } catch (error) {
      console.error("❌ Error obteniendo info días económicos:", error);
      throw error;
    }
  };

  // FUNCIÓN PARA SOLICITAR DÍA ECONÓMICO
  const solicitarDiaEconomico = async (formData) => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(
        `${API_BASE}/dias_economicos/dias-economicos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(formData),
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
      console.log("✅ Día económico solicitado:", result);
      return result;
    } catch (error) {
      console.error("❌ Error solicitando día económico:", error);
      throw error;
    }
  };
  // FUNCIÓN CORREGIDA PARA ENVIAR IMAGEN Y HORAS
  const crearIncidencia = async (incidenciaData) => {
    try {
      console.log("📥 Datos recibidos en crearIncidencia:", incidenciaData);

      // Validaciones
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
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      // PREPARAR DATOS PARA ENVIAR - CORREGIDO
      const datosParaEnviar = {
        tipo: tipo,
        motivo: motivo,
        fecha: fecha,
        minutos: parseInt(minutos) || 0,
        horaEntrada: horaEntrada || null,
        horaSalida: horaSalida || null,
        docente_id: docenteId || null,
      };

      // AGREGAR IMAGEN SI EXISTE
      if (imagen && imagen.uri) {
        console.log("🖼️ Procesando imagen para enviar...");

        try {
          // Convertir imagen a base64
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

          console.log("✅ Imagen convertida a base64");
        } catch (imageError) {
          console.error("❌ Error procesando imagen:", imageError);
          // Continuar sin imagen
        }
      }

      console.log("📤 Enviando al backend:", {
        ...datosParaEnviar,
        imagen_data: datosParaEnviar.imagen_data
          ? `[BASE64: ${datosParaEnviar.imagen_data.length} chars]`
          : "No hay imagen",
      });

      const response = await fetch(`${API_BASE}/formulario/incidencias`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(datosParaEnviar),
      });

      const responseText = await response.text();
      console.log("📨 Respuesta del servidor:", responseText);

      if (!response.ok) {
        let errorMsg = `Error ${response.status}`;
        try {
          const errorData = JSON.parse(responseText);
          errorMsg = errorData.error || errorMsg;
        } catch (e) {
          errorMsg = responseText || errorMsg;
        }
        throw new Error(errorMsg);
      }

      const nuevaIncidencia = JSON.parse(responseText);
      console.log("✅ Incidencia creada exitosamente:", nuevaIncidencia);

      await loadIncidenciasData();
      return nuevaIncidencia;
    } catch (error) {
      console.error("❌ Error creando incidencia:", error);
      throw error;
    }
  };

  // FUNCIÓN PARA ELIMINAR INCIDENCIAS
  const eliminarIncidencia = async (incidenciaId) => {
    try {
      console.log(`🗑️ Intentando eliminar incidencia ${incidenciaId}`);

      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      const response = await fetch(
        `${API_BASE}/formulario/incidencias/${incidenciaId}`,
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
      console.log("✅ Incidencia eliminada:", result);

      // Recargar los datos
      await loadIncidenciasData();
      return result;
    } catch (error) {
      console.error("❌ Error eliminando incidencia:", error);
      throw error;
    }
  };

  // hooks/useIncidencias.js - FUNCIÓN CORREGIDA
  const cargarInfoCumpleanos = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("No hay token de autenticación");
      }

      console.log("🔍 Solicitando info cumpleaños...");

      const response = await fetch(`${API_BASE}/cumpleaños/info-cumpleanos`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log(`📨 Respuesta del servidor: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Error ${response.status}: ${errorText}`);
        throw new Error(`Error ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("✅ Info cumpleaños cargada:", data);
      return data;
    } catch (error) {
      console.error("❌ Error cargando info cumpleaños:", error);
      throw error;
    }
  };

  useEffect(() => {
    loadIncidenciasData();
  }, [docenteId]);

  return {
    incidencias,
    diasEconomicos,
    diasCumpleanos, // ← NUEVO
    permisosEspeciales,
    stats,
    loading,
    error,
    refetch: loadIncidenciasData,
    crearIncidencia,
    eliminarIncidencia,
    cargarInfoCumpleanos, // ← NUEVO
    solicitarDiaCumpleanos, // ← AGREGAR ESTA LÍNEA
  };
};
