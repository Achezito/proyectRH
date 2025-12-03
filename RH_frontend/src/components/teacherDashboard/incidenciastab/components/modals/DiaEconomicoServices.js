// src/services/DiaEconomicoService.js
import { getAuthToken } from "../../shared/utils/auth";

const API_BASE = "http://10.194.1.108:5000";

class DiaEconomicoService {
  static async obtenerInformacion() {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error obteniendo información");
      }

      return {
        success: true,
        data: data.data || data,
        message: data.mensaje,
      };
    } catch (error) {
      console.error("Error en obtenerInformacion:", error);
      return {
        success: false,
        error: error.message,
        data: null,
      };
    }
  }

  static async obtenerSolicitudes() {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${API_BASE}/dias_economicos/dias-economicos`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error obteniendo solicitudes");
      }

      return {
        success: true,
        data: data.data || [],
        count: data.count || 0,
      };
    } catch (error) {
      console.error("Error en obtenerSolicitudes:", error);
      return {
        success: false,
        error: error.message,
        data: [],
      };
    }
  }

  static async solicitarDiaEconomico(fecha, motivo) {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${API_BASE}/dias_economicos/dias-economicos`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fecha,
            motivo: motivo.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error creando solicitud");
      }

      return {
        success: true,
        data: data.data,
        message: data.mensaje || "Solicitud creada exitosamente",
      };
    } catch (error) {
      console.error("Error en solicitarDiaEconomico:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async eliminarSolicitud(id) {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${API_BASE}/dias_economicos/dias-economicos/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error eliminando solicitud");
      }

      return {
        success: true,
        message: data.mensaje || "Solicitud eliminada exitosamente",
      };
    } catch (error) {
      console.error("Error en eliminarSolicitud:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  static async verificarEstado() {
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("No hay token de autenticación");

      const response = await fetch(
        `${API_BASE}/dias_economicos/dias-economicos/estado`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error verificando estado");
      }

      return {
        success: true,
        data: data.data,
      };
    } catch (error) {
      console.error("Error en verificarEstado:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export default DiaEconomicoService;
