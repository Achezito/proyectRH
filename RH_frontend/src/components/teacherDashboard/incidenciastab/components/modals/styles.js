// styles.js - VERSIÓN ACTUALIZADA CON SCROLL
import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%", // ← AGREGADO: Limitar altura máxima
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },

  // NUEVOS ESTILOS PARA SCROLL
  modalScrollContent: {
    flex: 1,
  },
  modalScrollContainer: {
    padding: 24,
    paddingTop: 0,
  },

  modalSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  },
  radioGroup: {
    gap: 8,
    marginBottom: 16,
  },
  radioOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    backgroundColor: "#f8fafc",
  },
  radioOptionSelected: {
    backgroundColor: "#4f46e5",
    borderColor: "#4f46e5",
  },
  radioText: {
    color: "#64748b",
    fontWeight: "500",
  },
  radioTextSelected: {
    color: "white",
    fontWeight: "600",
  },
  input: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  textArea: {
    height: 100,
    textAlignVertical: "top",
  },
  diasDisponiblesText: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center",
  },
  diasCount: {
    fontWeight: "bold",
    color: "#4f46e5",
  },
  helpText: {
    fontSize: 12,
    color: "#94a3b8",
    fontStyle: "italic",
    marginBottom: 16,
    textAlign: "center",
  },
  imageButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderWidth: 1,
    borderColor: "#4f46e5",
    borderStyle: "dashed",
    borderRadius: 8,
    marginBottom: 12,
    gap: 8,
  },
  imageButtonText: {
    color: "#4f46e5",
    fontWeight: "500",
  },
  imagePreviewContainer: {
    position: "relative",
    marginBottom: 12,
  },
  imagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  removeImageButton: {
    position: "absolute",
    top: -8,
    right: -8,
    backgroundColor: "white",
    borderRadius: 12,
  },
  primaryButton: {
    backgroundColor: "#4f46e5",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#4f46e5",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 8, // ← AGREGADO: Espacio antes del botón
  },
  primaryButtonDisabled: {
    backgroundColor: "#9ca3af",
    shadowColor: "#9ca3af",
  },
  primaryButtonText: {
    textAlign: "center",
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  // Agregar a styles.js
  // Estilos para el modal de detalle
  detailSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  detailSectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "400",
    flex: 2,
    textAlign: "right",
  },
  detailImage: {
    width: "100%",
    height: 200,
    borderRadius: 8,
  },
  imageContainer: {
    position: "relative",
    borderRadius: 8,
    overflow: "hidden",
  },
  imageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  imageOverlayText: {
    color: "white",
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  detailActions: {
    flexDirection: "row",
    gap: 12,
    marginTop: 20,
  },
  secondaryButton: {
    backgroundColor: "#64748b",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  secondaryButtonText: {
    color: "white",
    fontWeight: "500",
  },
  deleteButton: {
    backgroundColor: "#ef4444",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "500",
  },
  listItemArrow: {
    justifyContent: "center",
    paddingLeft: 8,
  },
  // Agregar a styles.js
  confirmationIcon: {
    alignItems: "center",
    marginBottom: 16,
  },
  confirmationTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    textAlign: "center",
    marginBottom: 8,
  },
  confirmationMessage: {
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
    marginBottom: 24,
    lineHeight: 22,
  },
  confirmationActions: {
    flexDirection: "row",
    gap: 12,
  },
  confirmationButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#64748b",
  },
  confirmButton: {
    backgroundColor: "#ef4444",
  },
  cancelButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
  },
  confirmButtonText: {
    color: "white",
    fontWeight: "500",
    fontSize: 16,
  },
  // En styles.js, agrega:
  disabledInput: {
    backgroundColor: "#f3f4f6",
    borderColor: "#d1d5db",
    opacity: 0.6,
  },
});
