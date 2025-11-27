import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { styles } from "../styles";

const CumpleanosModal = ({ visible, onClose, onSubmit }) => {
  const [formData, setFormData] = useState({
    fechaCumpleanos: "",
    fechaDisfrute: "",
    motivo: "Día de cumpleaños según cláusula 27 del CCT",
  });

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Día de Cumpleaños</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <Text style={styles.modalSubtitle}>
            De acuerdo a lo establecido en el contrato colectivo de trabajo,
            cláusula 27
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Fecha de cumpleaños (DD-MM)"
            value={formData.fechaCumpleanos}
            onChangeText={(text) =>
              setFormData({ ...formData, fechaCumpleanos: text })
            }
            placeholderTextColor="#94a3b8"
          />

          <TextInput
            style={styles.input}
            placeholder="Fecha a disfrutar (DD-MM) - Si cae en inhábil"
            value={formData.fechaDisfrute}
            onChangeText={(text) =>
              setFormData({ ...formData, fechaDisfrute: text })
            }
            placeholderTextColor="#94a3b8"
          />

          <Text style={styles.helpText}>
            * En caso que el cumpleaños corresponda a un día inhábil o fin de
            semana, favor de mencionar el día hábil inmediato siguiente que
            tomará
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonText}>
              Solicitar Día de Cumpleaños
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

export default CumpleanosModal;
