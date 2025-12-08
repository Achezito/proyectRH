import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";

const ModalDetallesDocente = ({
  visible,
  docente,
  onClose,
  onEditar,
  onDesactivar,
}) => {
  const [loading, setLoading] = useState(false);

  if (!docente) return null;

  const formatDate = (dateString) => {
    if (!dateString) return "No especificada";
    try {
      return new Date(dateString).toLocaleDateString("es-ES", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getEstadoInfo = (estado) => {
    switch (estado?.toLowerCase()) {
      case "activo":
        return { color: "#2ecc71", icon: "check-circle", label: "Activo" };
      case "inactivo":
        return { color: "#e74c3c", icon: "block", label: "Inactivo" };
      case "pending":
        return { color: "#f39c12", icon: "schedule", label: "Pendiente" };
      default:
        return { color: "#95a5a6", icon: "help", label: "Desconocido" };
    }
  };

  const estadoInfo = getEstadoInfo(docente.estado);

  const handleEmailPress = () => {
    if (docente.correo_institucional) {
      Linking.openURL(`mailto:${docente.correo_institucional}`);
    }
  };

  const handleDesactivarPress = () => {
    const esActivo = docente.estado?.toLowerCase() === "activo";
    Alert.alert(
      `${esActivo ? "Desactivar" : "Activar"} Docente`,
      `¿Está seguro de ${esActivo ? "desactivar" : "activar"} a ${
        docente.nombre
      } ${docente.apellido}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: esActivo ? "Desactivar" : "Activar",
          style: esActivo ? "destructive" : "default",
          onPress: () => {
            onDesactivar(docente.id);
            onClose();
          },
        },
      ]
    );
  };

  const getTipoContrato = () => {
    if (docente.TIPO_DOCENTE && typeof docente.TIPO_DOCENTE === "object") {
      return docente.TIPO_DOCENTE.tipo_contrato;
    }
    return docente.tipo_contrato || "No especificado";
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerLeft}>
              <View
                style={[
                  styles.estadoBadge,
                  { backgroundColor: estadoInfo.color },
                ]}
              >
                <MaterialIcons name={estadoInfo.icon} size={14} color="#fff" />
                <Text style={styles.estadoBadgeText}>{estadoInfo.label}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#5d6d7e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Información del docente */}
            <View style={styles.profileSection}>
              <View style={styles.avatarLarge}>
                <Text style={styles.avatarLargeText}>
                  {docente.nombre?.[0]?.toUpperCase() || "D"}
                  {docente.apellido?.[0]?.toUpperCase() || ""}
                </Text>
              </View>
              <Text style={styles.nombreCompleto}>
                {docente.nombre} {docente.apellido}
              </Text>
              <TouchableOpacity
                onPress={handleEmailPress}
                style={styles.emailContainer}
              >
                <MaterialIcons name="email" size={16} color="#3498db" />
                <Text style={styles.emailText}>
                  {docente.correo_institucional}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Información detallada */}
            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Información Personal</Text>

              <View style={styles.infoRow}>
                <MaterialIcons
                  name="person"
                  size={18}
                  color="#7f8c8d"
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Nombre completo</Text>
                  <Text style={styles.infoValue}>
                    {docente.nombre} {docente.apellido}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons
                  name="cake"
                  size={18}
                  color="#7f8c8d"
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Fecha de cumpleaños</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(docente.cumpleaños)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.infoSection}>
              <Text style={styles.sectionTitle}>Información Laboral</Text>

              <View style={styles.infoRow}>
                <MaterialIcons
                  name="work"
                  size={18}
                  color="#7f8c8d"
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tipo de contrato</Text>
                  <Text style={styles.infoValue}>{getTipoContrato()}</Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons
                  name="people"
                  size={18}
                  color="#7f8c8d"
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Tipo de colaborador</Text>
                  <Text style={styles.infoValue}>
                    {docente.tipo_colaborador || "No especificado"}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <MaterialIcons
                  name="school"
                  size={18}
                  color="#7f8c8d"
                  style={styles.infoIcon}
                />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Docencia</Text>
                  <Text style={styles.infoValue}>
                    {docente.docencia || "No especificada"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Estadísticas (si están disponibles) */}
            {(docente.DIAS_CUMPLEANOS ||
              docente.DIAS_ECONOMICOS ||
              docente.INCIDENCIAS) && (
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Estadísticas</Text>

                <View style={styles.statsContainer}>
                  {docente.DIAS_CUMPLEANOS &&
                    docente.DIAS_CUMPLEANOS.length > 0 && (
                      <View style={styles.statItem}>
                        <MaterialIcons
                          name="celebration"
                          size={20}
                          color="#9b59b6"
                        />
                        <Text style={styles.statNumber}>
                          {docente.DIAS_CUMPLEANOS.length}
                        </Text>
                        <Text style={styles.statLabel}>Días cumpleaños</Text>
                      </View>
                    )}

                  {docente.DIAS_ECONOMICOS &&
                    docente.DIAS_ECONOMICOS.length > 0 && (
                      <View style={styles.statItem}>
                        <MaterialIcons
                          name="attach-money"
                          size={20}
                          color="#2ecc71"
                        />
                        <Text style={styles.statNumber}>
                          {docente.DIAS_ECONOMICOS.length}
                        </Text>
                        <Text style={styles.statLabel}>Días económicos</Text>
                      </View>
                    )}

                  {docente.INCIDENCIAS && docente.INCIDENCIAS.length > 0 && (
                    <View style={styles.statItem}>
                      <MaterialIcons name="warning" size={20} color="#e74c3c" />
                      <Text style={styles.statNumber}>
                        {docente.INCIDENCIAS.length}
                      </Text>
                      <Text style={styles.statLabel}>Incidencias</Text>
                    </View>
                  )}
                </View>
              </View>
            )}
          </ScrollView>

          {/* Footer con botones */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.desactivarButton]}
              onPress={handleDesactivarPress}
            >
              <MaterialIcons
                name={
                  docente.estado?.toLowerCase() === "activo"
                    ? "block"
                    : "check-circle"
                }
                size={20}
                color={
                  docente.estado?.toLowerCase() === "activo"
                    ? "#e74c3c"
                    : "#2ecc71"
                }
              />
              <Text
                style={[
                  styles.footerButtonText,
                  {
                    color:
                      docente.estado?.toLowerCase() === "activo"
                        ? "#e74c3c"
                        : "#2ecc71",
                  },
                ]}
              >
                {docente.estado?.toLowerCase() === "activo"
                  ? "Desactivar"
                  : "Activar"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, styles.editarButton]}
              onPress={() => {
                onEditar(docente);
                onClose();
              }}
            >
              <MaterialIcons name="edit" size={20} color="#3498db" />
              <Text style={[styles.footerButtonText, { color: "#3498db" }]}>
                Editar
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  estadoBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  estadoBadgeText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  profileSection: {
    alignItems: "center",
    marginBottom: 24,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  avatarLargeText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  nombreCompleto: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 8,
  },
  emailContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  emailText: {
    fontSize: 16,
    color: "#3498db",
    marginLeft: 6,
    textDecorationLine: "underline",
  },
  infoSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  infoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#2c3e50",
    fontWeight: "500",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 8,
  },
  statItem: {
    alignItems: "center",
    padding: 12,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2c3e50",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 4,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  desactivarButton: {
    borderColor: "#ffcdd2",
  },
  editarButton: {
    borderColor: "#d6eaf8",
  },
  footerButtonText: {
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default ModalDetallesDocente;
