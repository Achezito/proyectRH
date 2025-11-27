// components/lists/IncidenciasList.js - VERSIÓN MODIFICADA
import React from "react";
import { View, Text, TouchableOpacity, FlatList, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "./styles";

const IncidenciasList = ({
  incidencias,
  onPressIncidencia,
  onDeleteIncidencia, // ← NUEVA PROPS PARA ELIMINAR
}) => {
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

  const getTipoText = (tipo) => {
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

  // FUNCIÓN PARA MANEJAR ELIMINACIÓN
  const handleDelete = (item, event) => {
    event.stopPropagation(); // Evitar que se active el onPress del item

    // Verificar si está aprobado
    if (item.estado.toLowerCase() === "aprobado") {
      Alert.alert(
        "No se puede eliminar",
        "Las incidencias aprobadas no pueden ser eliminadas.",
        [{ text: "Entendido" }]
      );
      return;
    }

    // Verificar si está rechazado
    if (item.estado.toLowerCase() === "rechazado") {
      Alert.alert(
        "No se puede eliminar",
        "Las incidencias rechazadas no pueden ser eliminadas.",
        [{ text: "Entendido" }]
      );
      return;
    }

    // Solo permitir eliminar incidencias pendientes
    if (item.estado.toLowerCase() === "pendiente" && onDeleteIncidencia) {
      onDeleteIncidencia(item.id, item.tipo_incidencia, item.estado);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.listItem}
      onPress={() => onPressIncidencia(item)}
    >
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemTitle}>
            {getTipoText(item.tipo_incidencia)}
          </Text>
          <Text style={styles.listItemSubtitle}>{item.motivo}</Text>
        </View>

        <View style={styles.headerRight}>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: getEstadoColor(item.estado) },
            ]}
          >
            <Text style={styles.estadoText}>{item.estado}</Text>
          </View>

          {/* Botón de eliminar - SOLO para incidencias pendientes */}
          {item.estado.toLowerCase() === "pendiente" && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={(e) => handleDelete(item, e)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="trash-outline" size={18} color="#ef4444" />
            </TouchableOpacity>
          )}

          {/* Icono de bloqueo para incidencias no eliminables */}
          {(item.estado.toLowerCase() === "aprobado" ||
            item.estado.toLowerCase() === "rechazado") && (
            <View style={styles.lockedIcon}>
              <Ionicons name="lock-closed" size={16} color="#94a3b8" />
            </View>
          )}
        </View>
      </View>

      <View style={styles.listItemDetails}>
        <Text style={styles.listItemDetail}>
          <Ionicons name="calendar-outline" size={14} color="#64748b" />
          {formatDate(item.fecha)}
        </Text>
        {item.minutos > 0 && (
          <Text style={styles.listItemDetail}>
            <Ionicons name="time-outline" size={14} color="#64748b" />
            {item.minutos} minutos
          </Text>
        )}
        {item.justificaciones && item.justificaciones.startsWith("http") && (
          <Text style={styles.listItemDetail}>
            <Ionicons name="image-outline" size={14} color="#64748b" />
            Con imagen
          </Text>
        )}
      </View>

      <View style={styles.listItemArrow}>
        <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
      </View>
    </TouchableOpacity>
  );

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
      renderItem={renderItem}
      keyExtractor={(item) => item.id.toString()}
      scrollEnabled={false}
      showsVerticalScrollIndicator={false}
    />
  );
};

export default IncidenciasList;
