import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  Platform,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import { Picker } from "@react-native-picker/picker";

const FiltrosAvanzados = ({
  filtros,
  filtrosDisponibles,
  onAplicar,
  onCancelar,
  onLimpiar,
}) => {
  const [filtrosLocales, setFiltrosLocales] = useState({ ...filtros });

  const handleAplicar = () => {
    onAplicar(filtrosLocales);
  };

  const handleLimpiar = () => {
    setFiltrosLocales({
      tipo_contrato: "",
      tipo_colaborador: "",
      estado: "",
      docencia: "",
    });
    onLimpiar();
  };

  return (
    <Modal transparent={true} visible={true} animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header del modal */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filtros Avanzados</Text>
            <TouchableOpacity onPress={onCancelar} style={styles.closeButton}>
              <Icon name="close" size={24} color="#5d6d7e" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Tipo de Contrato */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tipo de Contrato</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filtrosLocales.tipo_contrato}
                  onValueChange={(value) =>
                    setFiltrosLocales((prev) => ({
                      ...prev,
                      tipo_contrato: value,
                    }))
                  }
                  style={styles.picker}
                  dropdownIconColor="#3498db"
                >
                  <Picker.Item label="Todos los tipos" value="" />
                  {filtrosDisponibles.tipos_contrato?.map((tipo) => (
                    <Picker.Item
                      key={tipo.id}
                      label={tipo.tipo_contrato}
                      value={tipo.id.toString()}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Tipo de Colaborador */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Tipo de Colaborador</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filtrosLocales.tipo_colaborador}
                  onValueChange={(value) =>
                    setFiltrosLocales((prev) => ({
                      ...prev,
                      tipo_colaborador: value,
                    }))
                  }
                  style={styles.picker}
                  dropdownIconColor="#3498db"
                >
                  <Picker.Item label="Todos los tipos" value="" />
                  {filtrosDisponibles.tipos_colaborador?.map((tipo, index) => (
                    <Picker.Item key={index} label={tipo} value={tipo} />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Estado */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Estado</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filtrosLocales.estado}
                  onValueChange={(value) =>
                    setFiltrosLocales((prev) => ({ ...prev, estado: value }))
                  }
                  style={styles.picker}
                  dropdownIconColor="#3498db"
                >
                  <Picker.Item label="Todos los estados" value="" />
                  {filtrosDisponibles.estados?.map((estado, index) => (
                    <Picker.Item
                      key={index}
                      label={estado.charAt(0).toUpperCase() + estado.slice(1)}
                      value={estado}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Docencia */}
            <View style={styles.filterSection}>
              <Text style={styles.filterLabel}>Docencia</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={filtrosLocales.docencia}
                  onValueChange={(value) =>
                    setFiltrosLocales((prev) => ({ ...prev, docencia: value }))
                  }
                  style={styles.picker}
                  dropdownIconColor="#3498db"
                >
                  <Picker.Item label="Todas las docencias" value="" />
                  {filtrosDisponibles.docencias?.map((docencia, index) => (
                    <Picker.Item
                      key={index}
                      label={docencia}
                      value={docencia}
                    />
                  ))}
                </Picker>
              </View>
            </View>
          </ScrollView>

          {/* Footer con botones */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.footerButton, styles.limpiarButton]}
              onPress={handleLimpiar}
            >
              <Icon name="filter-alt-off" size={20} color="#e74c3c" />
              <Text style={styles.limpiarButtonText}>Limpiar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, styles.cancelButton]}
              onPress={onCancelar}
            >
              <Icon name="cancel" size={20} color="#7f8c8d" />
              <Text style={styles.cancelButtonText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.footerButton, styles.aplicarButton]}
              onPress={handleAplicar}
            >
              <Icon name="check" size={20} color="#fff" />
              <Text style={styles.aplicarButtonText}>Aplicar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2c3e50",
  },
  closeButton: {
    padding: 4,
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#5d6d7e",
    marginBottom: 8,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#d6dbdf",
    borderRadius: 8,
    backgroundColor: "#f8f9fa",
  },
  picker: {
    height: 50,
    color: "#2c3e50",
  },
  modalFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
    backgroundColor: "#f8f9fa",
  },
  footerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 4,
  },
  limpiarButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#fadbd8",
  },
  limpiarButtonText: {
    color: "#e74c3c",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  cancelButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#d6dbdf",
  },
  cancelButtonText: {
    color: "#7f8c8d",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  aplicarButton: {
    backgroundColor: "#3498db",
  },
  aplicarButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default FiltrosAvanzados;
