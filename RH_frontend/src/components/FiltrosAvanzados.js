// src/screens/administrador/components/FiltrosAvanzados.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from "react-native";
import { Calendar, X, Check } from "lucide-react-native";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function FiltrosAvanzados({ filtros, setFiltros, onAplicar }) {
  const [showFechaDesde, setShowFechaDesde] = useState(false);
  const [showFechaHasta, setShowFechaHasta] = useState(false);

  const estados = [
    { value: "todos", label: "Todos los estados" },
    { value: "pendiente", label: "Pendiente" },
    { value: "aprobada", label: "Aprobada" },
    { value: "rechazada", label: "Rechazada" },
  ];

  const tipos = [
    { value: "todos", label: "Todos los tipos" },
    { value: "retardo", label: "Retardo" },
    { value: "falta", label: "Falta" },
    { value: "permiso", label: "Permiso" },
  ];

  const handleFechaDesde = (event, selectedDate) => {
    setShowFechaDesde(false);
    if (selectedDate) {
      setFiltros({
        ...filtros,
        fechaDesde: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  const handleFechaHasta = (event, selectedDate) => {
    setShowFechaHasta(false);
    if (selectedDate) {
      setFiltros({
        ...filtros,
        fechaHasta: selectedDate.toISOString().split("T")[0],
      });
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      estado: "todos",
      tipo: "todos",
      fechaDesde: "",
      fechaHasta: "",
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filtros Avanzados</Text>
        <TouchableOpacity onPress={limpiarFiltros}>
          <Text style={styles.limpiarText}>Limpiar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* FILTRO POR ESTADO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Estado</Text>
          <View style={styles.optionsContainer}>
            {estados.map((estado) => (
              <TouchableOpacity
                key={estado.value}
                style={[
                  styles.option,
                  filtros.estado === estado.value && styles.optionSelected,
                ]}
                onPress={() => setFiltros({ ...filtros, estado: estado.value })}
              >
                <Text
                  style={[
                    styles.optionText,
                    filtros.estado === estado.value &&
                      styles.optionTextSelected,
                  ]}
                >
                  {estado.label}
                </Text>
                {filtros.estado === estado.value && (
                  <Check size={16} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FILTRO POR TIPO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de Incidencia</Text>
          <View style={styles.optionsContainer}>
            {tipos.map((tipo) => (
              <TouchableOpacity
                key={tipo.value}
                style={[
                  styles.option,
                  filtros.tipo === tipo.value && styles.optionSelected,
                ]}
                onPress={() => setFiltros({ ...filtros, tipo: tipo.value })}
              >
                <Text
                  style={[
                    styles.optionText,
                    filtros.tipo === tipo.value && styles.optionTextSelected,
                  ]}
                >
                  {tipo.label}
                </Text>
                {filtros.tipo === tipo.value && (
                  <Check size={16} color="#3b82f6" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* FILTRO POR FECHA */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rango de Fechas</Text>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Desde:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFechaDesde(true)}
            >
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.dateButtonText}>
                {filtros.fechaDesde || "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>
            {filtros.fechaDesde && (
              <TouchableOpacity
                onPress={() => setFiltros({ ...filtros, fechaDesde: "" })}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>Hasta:</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowFechaHasta(true)}
            >
              <Calendar size={16} color="#6b7280" />
              <Text style={styles.dateButtonText}>
                {filtros.fechaHasta || "Seleccionar fecha"}
              </Text>
            </TouchableOpacity>
            {filtros.fechaHasta && (
              <TouchableOpacity
                onPress={() => setFiltros({ ...filtros, fechaHasta: "" })}
              >
                <X size={16} color="#ef4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.applyButton} onPress={onAplicar}>
          <Text style={styles.applyButtonText}>Aplicar Filtros</Text>
        </TouchableOpacity>
      </View>

      {/* DATE PICKERS */}
      {showFechaDesde && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleFechaDesde}
        />
      )}

      {showFechaHasta && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleFechaHasta}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: 400,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  limpiarText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "500",
  },
  scrollView: {
    maxHeight: 300,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4b5563",
    marginBottom: 8,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
  },
  optionSelected: {
    backgroundColor: "#eff6ff",
    borderColor: "#3b82f6",
  },
  optionText: {
    fontSize: 12,
    color: "#6b7280",
    marginRight: 4,
  },
  optionTextSelected: {
    color: "#3b82f6",
    fontWeight: "500",
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  dateLabel: {
    width: 60,
    fontSize: 14,
    color: "#6b7280",
  },
  dateButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
    backgroundColor: "#f9fafb",
    marginRight: 8,
  },
  dateButtonText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  footer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  applyButton: {
    backgroundColor: "#3b82f6",
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontWeight: "500",
    fontSize: 14,
  },
});
