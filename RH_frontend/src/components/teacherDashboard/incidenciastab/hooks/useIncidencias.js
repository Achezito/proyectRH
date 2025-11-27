import { useState, useEffect } from "react";
import { getAuthToken } from "../utils/auth";
const API_BASE = "http://10.194.1.108:5000/formulario";

// Datos mock para desarrollo
const mockData = {
  incidencias: [
    {
      id: 1,
      tipo: "retardo",
      motivo: "Tráfico pesado",
      fecha: "2024-01-15",
      estado: "aprobado",
      minutos: 15,
    },
    {
      id: 2,
      tipo: "salida_anticipada",
      motivo: "Cita médica",
      fecha: "2024-01-20",
      estado: "pendiente",
      minutos: 30,
    },
  ],
  diasEconomicos: [
    {
      id: 1,
      motivo: "Vacaciones familiares",
      fecha: "2024-01-10",
      estado: "aprobado",
      tipo: "economico",
    },
  ],
  permisosEspeciales: [
    {
      id: 1,
      motivo: "Permiso de paternidad",
      fecha: "2024-03-01",
      estado: "aprobado",
      tipo: "paternidad",
    },
  ],
};

export const useIncidencias = (docenteId) => {
  const [incidencias, setIncidencias] = useState([]);
  const [diasEconomicos, setDiasEconomicos] = useState([]);
  const [permisosEspeciales, setPermisosEspeciales] = useState([]);
  const [stats, setStats] = useState({
    totalIncidencias: 0,
    incidenciasPendientes: 0,
    diasEconomicosUsados: 0,
    diasDisponibles: 5,
    diasCumpleanos: 1,
  });
  const [loading, setLoading] = useState(true);

  const loadIncidenciasData = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const headers = {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };

      // En desarrollo, usar datos mock
      setIncidencias(mockData.incidencias);
      setDiasEconomicos(mockData.diasEconomicos);
      setPermisosEspeciales(mockData.permisosEspeciales);

      // Calcular estadísticas
      setStats({
        totalIncidencias: mockData.incidencias.length,
        incidenciasPendientes: mockData.incidencias.filter(
          (i) => i.estado === "pendiente"
        ).length,
        diasEconomicosUsados: mockData.diasEconomicos.filter(
          (d) => d.estado === "aprobado"
        ).length,
        diasDisponibles: 5,
        diasCumpleanos: 1,
      });
    } catch (error) {
      console.error("Error cargando datos:", error);
      // Usar datos mock como fallback
      setIncidencias(mockData.incidencias);
      setDiasEconomicos(mockData.diasEconomicos);
      setPermisosEspeciales(mockData.permisosEspeciales);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidenciasData();
  }, [docenteId]);

  return {
    incidencias,
    diasEconomicos,
    permisosEspeciales,
    stats,
    loading,
    refetch: loadIncidenciasData,
  };
};
