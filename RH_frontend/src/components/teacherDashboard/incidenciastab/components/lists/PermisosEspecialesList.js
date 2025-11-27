import React from "react";
import { View, Text, FlatList } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { styles } from "./styles";
import { formatDate } from "../../shared/utils/dateFormatter";

const PermisoEspecialItem = ({ item }) => {
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

  const getTipoPermisoText = (tipo) => {
    switch (tipo) {
      case "paternidad":
        return "Paternidad";
      case "defuncion":
        return "Defunción";
      case "titulacion":
        return "Titulación";
      default:
        return tipo;
    }
  };

  return (
    <View style={styles.listItem}>
      <View style={styles.listItemHeader}>
        <View style={styles.listItemInfo}>
          <Text style={styles.listItemTitle}>
            {getTipoPermisoText(item.tipo)}
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
      <Text style={styles.listItemDetail}>
        <Ionicons name="calendar-outline" size={14} color="#64748b" />{" "}
        {formatDate(item.fecha)}
      </Text>
    </View>
  );
};

const PermisosEspecialesList = ({ permisosEspeciales }) => {
  if (permisosEspeciales.length === 0) {
    return (
      <View style={styles.emptyState}>
        <MaterialIcons name="family-restroom" size={48} color="#cbd5e1" />
        <Text style={styles.emptyStateText}>No hay permisos especiales</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={permisosEspeciales}
      scrollEnabled={false}
      renderItem={({ item }) => <PermisoEspecialItem item={item} />}
      keyExtractor={(item) => item.id.toString()}
    />
  );
};

export default PermisosEspecialesList;
