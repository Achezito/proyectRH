// src/utils/constants.js
export const mockData = {
  incidencias: [
    {
      id: 1,
      motivo: "Consulta médica",
      fecha: "2024-01-15",
      estado: "aprobado",
      justificaciones: true,
    },
    {
      id: 2,
      motivo: "Problemas familiares",
      fecha: "2024-01-20",
      estado: "pendiente",
      justificaciones: false,
    },
    {
      id: 3,
      motivo: "Capacitación",
      fecha: "2024-02-01",
      estado: "aprobado",
      justificaciones: true,
    },
  ],
  diasEconomicos: [
    { id: 1, motivo: "Vacaciones", fecha: "2024-01-10", estado: "aprobado" },
    {
      id: 2,
      motivo: "Descanso personal",
      fecha: "2024-02-05",
      estado: "pendiente",
    },
  ],
};

export const API_BASE_URL = "http://10.194.1.108:5000/docente";
