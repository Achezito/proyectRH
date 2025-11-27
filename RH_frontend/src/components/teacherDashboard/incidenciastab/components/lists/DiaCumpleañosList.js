// src/components/teacherDashboard/IncidenciasTab/components/lists/DiasCumpleanosList.js
import React from "react";
import { View, Text, TouchableOpacity, FlatList } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const DiasCumpleanosList = ({ diasCumpleanos, onPressCumpleanos }) => {
  const getEstadoColor = (estado) => {
    switch (estado?.toLowerCase()) {
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

  const formatDate = (dateString) => {
    if (!dateString) return "Fecha no disponible";
    try {
      const date = new Date(dateString);
      const day = date.getDate().toString().padStart(2, "0");
      const month = (date.getMonth() + 1).toString().padStart(2, "0");
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => onPressCumpleanos(item)}
    >
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemTitle}>Día de Cumpleaños</Text>
          <Text style={styles.listItemSubtitle}>
            {item.motivo || "Solicitud de cumpleaños"}
          </Text>
        </View>
        <View
          style={[
            styles.estadoBadge,
            { backgroundColor: getEstadoColor(item.estado) },
          ]}
        >
          <Text style={styles.estadoText}>{item.estado || "pendiente"}</Text>
        </View>
      </View>

      <View style={styles.listItemDetails}>
        <Text style={styles.listItemDetail}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          Fecha disfrute: {formatDate(item.fecha_disfrute)}
        </Text>
        <Text style={styles.listItemDetail}>
          <Ionicons name="gift-outline" size={14} color="#64748b" />
          Cumpleaños: {formatDate(item.fecha_cumpleanos)}
        </Text>
        {item.creado_en && (
          <Text style={styles.listItemDetail}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            Solicitado: {formatDate(item.creado_en)}
          </Text>
        )}
      </View>

      <View style={styles.listItemArrow}>
        <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

  if (diasCumpleanos.length === 0) {
    return (
      <View style={styles.emptyState}>
        <Ionicons name="gift-outline" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>
          No hay solicitudes de cumpleaños
        </Text>
      </View>
    );
  }

  return (
    <FlatList
      data={diasCumpleanos}
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default DiasCumpleanosList;
