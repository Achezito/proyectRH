// EN LAS IMPORTACIONES, AGREGA:
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Switch,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Save, RefreshCw, AlertCircle, CheckCircle } from "lucide-react-native";

// AGREGAR ESTA IMPORTACIÓN:
import { API_BASE_URL } from "../../config/api";

const ConfigDiasEconomicosScreen = () => {
  const [configuraciones, setConfiguraciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [modified, setModified] = useState({});

  // Cargar configuraciones - MODIFICADO
  const cargarConfiguraciones = async () => {
    try {
      setLoading(true);

      // ANTES:
      // const response = await fetch("http://172.18.4.188:5000/diasEconomicos/configuracion");

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/configuracion`
      );

      const data = await response.json();

      if (data.success) {
        setConfiguraciones(data.data || []);
        setModified({}); // Limpiar modificaciones
      } else {
        Alert.alert("Error", data.error || "Error al cargar configuraciones");
      }
    } catch (error) {
      Alert.alert("Error", "No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarConfiguraciones();
  }, []);

  // Actualizar valor
  const handleUpdateValue = (configId, field, value) => {
    setConfiguraciones((prev) =>
      prev.map((config) =>
        config.id === configId ? { ...config, [field]: value } : config
      )
    );

    setModified((prev) => ({
      ...prev,
      [configId]: true,
    }));
  };

  // Guardar configuración - MODIFICADO
  const handleGuardarConfiguracion = async (configId) => {
    const config = configuraciones.find((c) => c.id === configId);
    if (!config) return;

    try {
      setSaving((prev) => ({ ...prev, [configId]: true }));

      // ANTES:
      // const response = await fetch(`http://172.18.4.188:5000/diasEconomicos/configuracion/${configId}`, {...});

      // DESPUÉS:
      const response = await fetch(
        `${API_BASE_URL}/diasEconomicos/configuracion/${configId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dias_economicos_limite:
              parseInt(config.dias_economicos_limite) || 0,
            renovacion_mensual: config.renovacion_mensual || false,
            activo: config.activo !== false,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        Alert.alert("Éxito", "Configuración guardada");
        setModified((prev) => ({
          ...prev,
          [configId]: false,
        }));
      } else {
        Alert.alert("Error", data.error || "Error al guardar");
      }
    } catch (error) {
      Alert.alert("Error", "Error de conexión");
    } finally {
      setSaving((prev) => ({ ...prev, [configId]: false }));
    }
  };

  // Renderizar tarjeta de configuración
  const renderConfigCard = (config) => {
    const isModified = modified[config.id];
    const isSaving = saving[config.id];
    return (
      <View key={config.id} style={styles.configCard}>
        <View style={styles.configHeader}>
          <View>
            <Text style={styles.configTitle}>
              {config.tipo_docente?.charAt(0).toUpperCase() +
                config.tipo_docente?.slice(1)}{" "}
              -
              {config.tipo_contrato?.charAt(0).toUpperCase() +
                config.tipo_contrato?.slice(1)}
            </Text>
            <Text style={styles.configDesc}>
              Configuración para {config.tipo_docente} con contrato{" "}
              {config.tipo_contrato}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              config.activo !== false
                ? styles.statusActive
                : styles.statusInactive,
            ]}
          >
            <Text style={styles.statusText}>
              {config.activo !== false ? "ACTIVO" : "INACTIVO"}
            </Text>
          </View>
        </View>

        <View style={styles.configFields}>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>
              Días por {config.renovacion_mensual ? "mes" : "período"}
            </Text>
            <TextInput
              style={styles.numberInput}
              value={config.dias_economicos_limite?.toString()}
              onChangeText={(value) =>
                handleUpdateValue(config.id, "dias_economicos_limite", value)
              }
              keyboardType="numeric"
              placeholder="0"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Renovación mensual</Text>
            <Switch
              value={config.renovacion_mensual || false}
              onValueChange={(value) =>
                handleUpdateValue(config.id, "renovacion_mensual", value)
              }
              trackColor={{ false: "#d1d5db", true: "#3b82f6" }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Estado</Text>
            <Switch
              value={config.activo !== false}
              onValueChange={(value) =>
                handleUpdateValue(config.id, "activo", value)
              }
              trackColor={{ false: "#d1d5db", true: "#10b981" }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.configFooter}>
          <Text style={styles.configNote}>
            {config.renovacion_mensual
              ? "Los días se renuevan cada mes"
              : "Los días son por período completo"}
          </Text>

          {isModified && (
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
              onPress={() => handleGuardarConfiguracion(config.id)}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Save size={16} color="#fff" />
                  <Text style={styles.saveButtonText}>Guardar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text style={styles.loadingText}>Cargando configuraciones...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Configuración de Días Económicos</Text>
        <Text style={styles.headerSubtitle}>
          Define los límites según tipo de contrato y colaborador
        </Text>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={cargarConfiguraciones}
        >
          <RefreshCw size={18} color="#3b82f6" />
          <Text style={styles.refreshButtonText}>Actualizar</Text>
        </TouchableOpacity>
      </View>

      {/* Información */}
      <View style={styles.infoBox}>
        <AlertCircle size={20} color="#3b82f6" />
        <View style={styles.infoContent}>
          <Text style={styles.infoTitle}>Importante:</Text>
          <Text style={styles.infoText}>
            • Los cambios afectarán a todas las solicitudes futuras{"\n"}• Las
            solicitudes ya aprobadas mantendrán su estado{"\n"}• Revise
            cuidadosamente los valores antes de guardar
          </Text>
        </View>
      </View>

      {/* Lista de configuraciones */}
      <ScrollView style={styles.content}>
        {configuraciones.length === 0 ? (
          <View style={styles.emptyState}>
            <AlertCircle size={48} color="#9ca3af" />
            <Text style={styles.emptyStateTitle}>No hay configuraciones</Text>
            <Text style={styles.emptyStateText}>
              Contacte al administrador del sistema
            </Text>
          </View>
        ) : (
          configuraciones.map(renderConfigCard)
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  header: {
    backgroundColor: "#fff",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 16,
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  refreshButtonText: {
    color: "#3b82f6",
    fontWeight: "500",
    fontSize: 14,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    margin: 16,
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    color: "#1e40af",
    lineHeight: 18,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 32,
  },
  // Tarjeta de configuración
  configCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  configHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  configTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  configDesc: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: "#d1fae5",
  },
  statusInactive: {
    backgroundColor: "#f3f4f6",
  },
  statusText: {
    fontSize: 10,
    fontWeight: "600",
  },
  configFields: {
    gap: 16,
    marginBottom: 16,
  },
  fieldGroup: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  numberInput: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    width: 80,
    textAlign: "center",
    fontSize: 16,
    backgroundColor: "#fff",
  },
  configFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  configNote: {
    fontSize: 12,
    color: "#6b7280",
    fontStyle: "italic",
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3b82f6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 6,
  },
  saveButtonDisabled: {
    backgroundColor: "#9ca3af",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});

export default ConfigDiasEconomicosScreen;
