export const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";

  try {
    // Caso 1: Ya está en formato DD/MM/YYYY
    if (
      typeof dateString === "string" &&
      dateString.includes("/") &&
      dateString.length === 10
    ) {
      return dateString;
    }

    // Caso 2: Formato ISO (2025-11-27T00:00:00+00:00)
    if (typeof dateString === "string" && dateString.includes("T")) {
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-");

      if (year && month && day) {
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }
    }

    // Caso 3: Formato YYYY-MM-DD
    if (
      typeof dateString === "string" &&
      dateString.length === 10 &&
      dateString.includes("-")
    ) {
      const [year, month, day] = dateString.split("-");
      return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
    }

    // Caso 4: Usar Date como fallback
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return "Fecha inválida";
  } catch (error) {
    console.error(
      "❌ Error crítico formateando fecha:",
      error,
      "Input:",
      dateString
    );
    return "Error en fecha";
  }
};

export const calcularMinutosIncidencia = (incidencia) => {
  if (incidencia.minutos && incidencia.minutos > 0) {
    return `${incidencia.minutos} minutos`;
  }

  switch (incidencia.tipo) {
    case "retardo":
      return "11-15 minutos";
    case "retardo_mayor":
      return "16-20 minutos";
    case "salida_anticipada":
      return "Salida anticipada";
    default:
      return "Tiempo no especificado";
  }
};
