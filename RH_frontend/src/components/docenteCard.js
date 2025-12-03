import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";

const DocenteCard = ({ docente, onPress, onEdit, onDelete, onDesactivar }) => {
  if (!docente) return null;

  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
      case "activo":
        return "#2ecc71";
      case "inactivo":
        return "#e74c3c";
      case "pending":
      case "pendiente":
        return "#f39c12";
      default:
        return "#95a5a6";
    }
  };

  const getTipoContrato = () => {
    console.log("🔍 DEBUG - Datos del docente:", docente);
    console.log("🔍 DEBUG - Tipo de docente completo:", docente.TIPO_DOCENTE);
    console.log("🔍 DEBUG - tipo_contrato directo:", docente.tipo_contrato);
    console.log("🔍 DEBUG - tipodocente_id:", docente.tipodocente_id);

    // Opción 1: Si TIPO_DOCENTE es un objeto anidado
    if (docente.TIPO_DOCENTE && typeof docente.TIPO_DOCENTE === "object") {
      console.log(
        "✅ Usando TIPO_DOCENTE.tipo_contrato:",
        docente.TIPO_DOCENTE.tipo_contrato
      );
      return docente.TIPO_DOCENTE.tipo_contrato || "No especificado";
    }

    // Opción 2: Si TIPO_DOCENTE es un array (relación 1 a muchos)
    if (
      docente.TIPO_DOCENTE &&
      Array.isArray(docente.TIPO_DOCENTE) &&
      docente.TIPO_DOCENTE.length > 0
    ) {
      console.log(
        "✅ Usando TIPO_DOCENTE[0].tipo_contrato:",
        docente.TIPO_DOCENTE[0].tipo_contrato
      );
      return docente.TIPO_DOCENTE[0].tipo_contrato || "No especificado";
    }

    // Opción 3: Si viene directamente como campo
    if (docente.tipo_contrato) {
      console.log(
        "✅ Usando docente.tipo_contrato directo:",
        docente.tipo_contrato
      );
      return docente.tipo_contrato;
    }

    console.log("⚠️ No se encontró tipo de contrato");
    return "No especificado";
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
          onPress: () => onDesactivar && onDesactivar(),
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.cardContent}>
        {/* Avatar y info principal */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {docente.nombre?.[0]?.toUpperCase() || "D"}
              {docente.apellido?.[0]?.toUpperCase() || ""}
            </Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>
              {docente.nombre} {docente.apellido}
            </Text>
            <Text style={styles.userEmail}>{docente.correo_institucional}</Text>
            <View style={styles.tagsContainer}>
              <View
                style={[
                  styles.estadoTag,
                  { backgroundColor: getEstadoColor(docente.estado) },
                ]}
              >
                <Text style={styles.estadoText}>
                  {docente.estado || "Pendiente"}
                </Text>
              </View>
              {docente.docencia && (
                <View style={styles.docenciaTag}>
                  <Icon name="school" size={12} color="#3498db" />
                  <Text style={styles.docenciaText}>{docente.docencia}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Información detallada */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Icon name="work" size={16} color="#7f8c8d" />
            <Text style={styles.detailText}>{getTipoContrato()}</Text>
          </View>
          {docente.tipo_colaborador && (
            <View style={styles.detailRow}>
              <Icon name="people" size={16} color="#7f8c8d" />
              <Text style={styles.detailText}>{docente.tipo_colaborador}</Text>
            </View>
          )}
          {docente.cumpleaños && (
            <View style={styles.detailRow}>
              <Icon name="cake" size={16} color="#7f8c8d" />
              <Text style={styles.detailText}>
                {new Date(docente.cumpleaños).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>

        {/* Botones de acción */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => onEdit && onEdit(docente)}
          >
            <Icon name="edit" size={18} color="#3498db" />
            <Text style={styles.actionButtonText}>Editar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.desactivarButton]}
            onPress={handleDesactivarPress}
          >
            <Icon
              name={
                docente.estado?.toLowerCase() === "activo"
                  ? "block"
                  : "check-circle"
              }
              size={18}
              color={
                docente.estado?.toLowerCase() === "activo"
                  ? "#e74c3c"
                  : "#2ecc71"
              }
            />
            <Text
              style={[
                styles.actionButtonText,
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
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => onDelete && onDelete(docente.id)}
          >
            <Icon name="delete" size={18} color="#e74c3c" />
            <Text style={[styles.actionButtonText, { color: "#e74c3c" }]}>
              Eliminar
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#e9ecef",
  },
  cardContent: {
    padding: 16,
  },
  avatarContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#3498db",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: "#7f8c8d",
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  estadoTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
  },
  estadoText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
  docenciaTag: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#ebf5fb",
    borderWidth: 1,
    borderColor: "#d6eaf8",
  },
  docenciaText: {
    color: "#3498db",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 4,
  },
  detailsContainer: {
    backgroundColor: "#f8f9fa",
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: "#5d6d7e",
    marginLeft: 8,
    flex: 1,
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    marginHorizontal: 4,
  },
  editButton: {
    backgroundColor: "#ebf5fb",
    borderWidth: 1,
    borderColor: "#d6eaf8",
  },
  desactivarButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#f2f2f2",
  },
  deleteButton: {
    backgroundColor: "#fdedec",
    borderWidth: 1,
    borderColor: "#fadbd8",
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 4,
  },
});

export default DocenteCard;
