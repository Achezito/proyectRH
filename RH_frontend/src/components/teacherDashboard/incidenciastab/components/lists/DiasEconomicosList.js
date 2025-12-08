import React from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// Define los colores aquí mismo por seguridad
const LOCAL_COLORS = {
  primary: "#007AFF",
  success: "#34C759",
  warning: "#FF9500",
  danger: "#FF3B30",
  gray: "#8E8E93",
  text: "#000000",
  textSecondary: "#6C6C70",
  background: "#FFFFFF",
};

const DiasEconomicosList = ({
  diasEconomicos,
  estadisticas,
  loading,
  refreshing,
  onItemPress,
  onRefresh,
  onOpenModal,
}) => {
  const getEstadoColor = (estado) => {
    if (!estado) return LOCAL_COLORS.gray;

    const estadoLower = estado.toLowerCase();
    switch (estadoLower) {
      case "aprobado":
        return LOCAL_COLORS.success;
      case "pendiente":
        return LOCAL_COLORS.warning;
      case "rechazado":
        return LOCAL_COLORS.danger;
      case "cancelado":
        return LOCAL_COLORS.gray;
      default:
        return LOCAL_COLORS.gray;
    }
  };

  const getEstadoText = (estado) => {
    if (!estado) return "PENDIENTE";
    return estado.toUpperCase();
  };

  const renderItem = ({ item }) => {
    let fechaFormateada = "Fecha no disponible";
    let fechaSolicitud = "Fecha no disponible";

    try {
      if (item.fecha) {
        fechaFormateada = format(new Date(item.fecha), "dd 'de' MMMM, yyyy", {
          locale: es,
        });
      }
      if (item.creado_en) {
        fechaSolicitud = format(new Date(item.creado_en), "dd/MM/yyyy HH:mm", {
          locale: es,
        });
      }
    } catch (error) {
      console.error("Error formateando fecha:", error);
    }

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => onItemPress && onItemPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.fecha}>{fechaFormateada}</Text>
          <View
            style={[
              styles.estadoBadge,
              { backgroundColor: getEstadoColor(item.estado) },
            ]}
          >
            <Text style={styles.estadoText}>{getEstadoText(item.estado)}</Text>
          </View>
        </View>

        <Text style={styles.motivo} numberOfLines={2}>
          {item.motivo || "Sin motivo especificado"}
        </Text>

        <Text style={styles.fechaSolicitud}>Solicitado: {fechaSolicitud}</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>No hay solicitudes</Text>
      <Text style={styles.emptyText}>
        Aún no has solicitado días económicos.
        {estadisticas?.disponibles > 0 && (
          <>
            {"\n"}Tienes {estadisticas.disponibles} días disponibles.
          </>
        )}
      </Text>
      {estadisticas?.disponibles > 0 && onOpenModal && (
        <TouchableOpacity style={styles.emptyButton} onPress={onOpenModal}>
          <Text style={styles.emptyButtonText}>Solicitar día económico</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={LOCAL_COLORS.primary} />
        <Text style={styles.loadingText}>Cargando días económicos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={diasEconomicos || []}
        renderItem={renderItem}
        keyExtractor={(item) =>
          item.id?.toString() ||
          `item-${Math.random().toString(36).substr(2, 9)}`
        }
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={refreshing || false}
              onRefresh={onRefresh}
              colors={[LOCAL_COLORS.primary]}
              tintColor={LOCAL_COLORS.primary}
            />
          ) : undefined
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          !diasEconomicos || diasEconomicos.length === 0
            ? styles.flatListEmpty
            : styles.flatListContent
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 200,
  },
  flatListContent: {
    paddingVertical: 8,
  },
  flatListEmpty: {
    flexGrow: 1,
    justifyContent: "center",
  },
  card: {
    backgroundColor: LOCAL_COLORS.background,
    borderRadius: 10,
    padding: 15,
    marginHorizontal: 16,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  fecha: {
    fontSize: 16,
    fontWeight: "600",
    color: LOCAL_COLORS.text,
    flex: 1,
  },
  estadoBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 10,
    minWidth: 80,
    alignItems: "center",
  },
  estadoText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "bold",
  },
  motivo: {
    fontSize: 14,
    color: LOCAL_COLORS.textSecondary,
    marginBottom: 8,
    lineHeight: 18,
  },
  fechaSolicitud: {
    fontSize: 12,
    color: LOCAL_COLORS.gray,
    fontStyle: "italic",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 10,
    color: LOCAL_COLORS.textSecondary,
    fontSize: 14,
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: LOCAL_COLORS.text,
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    color: LOCAL_COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: LOCAL_COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 200,
    alignItems: "center",
  },
  emptyButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
});

export default DiasEconomicosList;
