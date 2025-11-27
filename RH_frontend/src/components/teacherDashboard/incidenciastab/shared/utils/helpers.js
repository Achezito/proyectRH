export const formatDate = (dateString) => {
  if (!dateString) return "Fecha no disponible";

  try {
    if (
      typeof dateString === "string" &&
      dateString.includes("/") &&
      dateString.length === 10
    ) {
      return dateString;
    }

    if (typeof dateString === "string" && dateString.includes("T")) {
      const datePart = dateString.split("T")[0];
      const [year, month, day] = datePart.split("-");
      if (year && month && day) {
        return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
      }
    }

    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }

    return "Fecha inválida";
  } catch (error) {
    console.error("❌ Error formateando fecha:", error, "Input:", dateString);
    return "Error en fecha";
  }
};
