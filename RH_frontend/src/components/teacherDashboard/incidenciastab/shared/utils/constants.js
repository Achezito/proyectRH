export const TIPOS_INCIDENCIA = [
  { value: "retardo", label: "Retardo (11-15 min)" },
  { value: "retardo_mayor", label: "Retardo mayor (16-20 min)" },
  { value: "salida_anticipada", label: "Salida anticipada" },
];

export const TIPOS_PERMISO = [
  { value: "paternidad", label: "Paternidad" },
  { value: "defuncion", label: "Defunción" },
  { value: "titulacion", label: "Titulación" },
];

export const ESTADOS = {
  aprobado: { text: "Aprobado", color: "#10b981" },
  pendiente: { text: "Pendiente", color: "#f59e0b" },
  rechazado: { text: "Rechazado", color: "#ef4444" },
};
// teacherDashboard/incidenciastab/shared/utils/constants.js
export const API_URL = "http://172.18.4.188:5000"; // Cambia por tu IP

export const colors = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  danger: "#FF3B30",
  warning: "#FF9500",
  info: "#5AC8FA",
  light: "#F2F2F7",
  dark: "#1C1C1E",
  gray: "#8E8E93",
  text: "#000000",
  textSecondary: "#6C6C70",
  border: "#C7C7CC",
  background: "#FFFFFF",
  successLight: "#D4EDDA",
  dangerLight: "#F8D7DA",
  warningLight: "#FFF3CD",
  infoLight: "#D1ECF1",
};
