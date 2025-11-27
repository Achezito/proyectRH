import React from "react";
import { View, Text, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";
import {
  formatDate,
  calcularMinutosIncidencia,
} from "../../shared/utils/dateFormatter";

const IncidenciaItem = ({ item }) => {
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

  const getTipoIncidenciaText = (tipo) => {
    switch (tipo) {
      case "retardo":
        return "Retardo (11-15 min)";
      case "retardo_mayor":
        return "Retardo mayor (16-20 min)";
      case "salida_anticipada":
        return "Salida anticipada";
      default:
        return tipo;
    }
  };

  return (
    <View style={styles.listItem}>
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemTitle}>
            {getTipoIncidenciaText(item.tipo)}
          </Text>
          <Text style={styles.listItemSubtitle}>{item.motivo}</Text>
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
      <View style={styles.listItemDetails}>
        <Text style={styles.listItemDetail}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />{" "}
          {formatDate(item.fecha)}
        </Text>
        <Text style={styles.listItemDetail}>
          <Ionicons name="time-outline" size={14} color="#64748b" />
          {calcularMinutosIncidencia(item)}
        </Text>
      </View>
    </View>
  );
};

const IncidenciasList = ({ incidencias }) => {
  if (incidencias.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="document-text-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>
          No hay incidencias registradas
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={incidencias}
      scrollEnabled={false}
      renderItem={({ item }) => <IncidenciaItem item={item} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

export default IncidenciasList;
