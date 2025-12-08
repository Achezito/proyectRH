import api from "./apiEconomico";

export const diasEconomicosApi = {
  // Obtener mis días económicos
  getMisDiasEconomicos: (docenteId) =>
    api.get(`/diasEconomicos/mis-solicitudes?docente_id=${docenteId}`),

  // Solicitar nuevo día económico
  solicitarDiaEconomico: (data) => api.post("/diasEconomicos/solicitar", data),

  // Cancelar solicitud
  cancelarSolicitud: (solicitudId) =>
    api.put(`/diasEconomicos/${solicitudId}/cancelar`),

  // Obtener estadísticas
  getEstadisticas: (docenteId) =>
    api.get(`/diasEconomicos/debug-docente/${docenteId}`),
};
