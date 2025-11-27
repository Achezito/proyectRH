import React from "react";
import { View, Text, FlatList } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { styles } from "../styles";
import { formatDate } from "../../shared/utils/dateFormatter";

const DiaEconomicoItem = ({ item }) => {
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

  return (
    <View style={styles.listItem}>
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
      <Text style={styles.listItemDetail}>
        <Ionicons name="calendar-outline" size={14} color="#64748b" />{" "}
        {formatDate(item.fecha)}
      </Text>
    </View>
  );
};

const DiasEconomicosList = ({ diasEconomicos }) => {
  if (diasEconomicos.length === 0) {
    return (
      <View style={styles.emptyState}>
        <FontAwesome name="calendar-o" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>
          No hay días económicos solicitados
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={diasEconomicos}
      scrollEnabled={false}
      renderItem={({ item }) => <DiaEconomicoItem item={item} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

export default DiasEconomicosList;
