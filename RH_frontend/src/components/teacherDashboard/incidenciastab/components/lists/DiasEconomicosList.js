import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { styles } from "./styles";
import { formatDate } from "../../shared/utils/dateFormatter";

const DiaEconomicoItem = ({ item, onPress, onDelete, isDeleting }) => {
  const getEstadoColor = (estado) => {
    switch (estado) {
      case "aprobado":
        return "#10b981";
      case "pendiente":
        return "#f59e0b";
      case "rechazado":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case "aprobado":
        return "Aprobado";
      case "pendiente":
        return "Pendiente";
      case "rechazado":
        return "Rechazado";
      default:
        return estado;
    }
  };

  const handleDeletePress = () => {
    if (item.estado !== "pendiente") {
      Alert.alert(
        "No se puede eliminar",
        "Solo se pueden eliminar solicitudes pendientes",
        [{ text: "Entendido" }]
      );
      return;
    }

    Alert.alert(
      "Eliminar Solicitud",
      "¿Estás seguro de que quieres eliminar esta solicitud de día económico?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => onDelete(item.id, item.estado),
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => onPress(item)}
      disabled={isDeleting}
    >
      <View style={styles.listItemContent}>
        <View style={styles.listItemHeader}>
          <View style={styles.listItemInfo}>
            <Text style={styles.listItemTitle}>{item.motivo}</Text>
            <Text style={styles.listItemSubtitle}>Día económico</Text>
          </View>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: getEstadoColor(item.estado) },
            ]}
          >
            <Text style={styles.estadoText}>{getEstadoText(item.estado)}</Text>
          </View>
        </View>

        <View style={styles.listItemFooter}>
          <Text style={styles.listItemDetail}>
            <Ionicons name="calendar-outline" size={14} color="#64748b" />{" "}
            {formatDate(item.fecha)}
          </Text>

          {item.estado === "pendiente" && (
            <TouchableOpacity
              onPress={handleDeletePress}
              disabled={isDeleting}
              style={styles.deleteButton}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#ef4444" />
              ) : (
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const DiasEconomicosList = ({
  diasEconomicos,
  onItemPress,
  onItemDelete,
  isDeleting = false,
}) => {
  if (diasEconomicos.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome name="calendar-o" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>
          No hay días económicos solicitados
        </Text>
        <Text style={styles.emptyStateSubtext}>
          Puedes solicitar días económicos usando el botón correspondiente
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={diasEconomicos}
      scrollEnabled={false}
      renderItem={({ item }) => (
        <DiaEconomicoItem
          item={item}
          onPress={onItemPress}
          onDelete={onItemDelete}
          isDeleting={isDeleting}
        />
      )}
      keyExtractor={(item) => item.id.toString()}
      contentContainerStyle={styles.listContainer}
    />
  );
};

export default DiasEconomicosList;
