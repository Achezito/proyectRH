import React from "react";
import { View, Text, TextInput } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { styles } from "../styles";

const PersonalInfoCard = ({ userData }) => {
  const formData = {
    nombre: userData?.nombre || "",
    apellido: userData?.apellido || "",
    correo_institucional: userData?.correo_institucional || "",
    docencia: userData?.docencia || "",
    cumpleaños: userData?.cumpleaños || "",
    tipo_contrato: userData?.tipo_contrato || "",
  };

  const fieldLabels = {
    nombre: "Nombre",
    apellido: "Apellido",
    correo_institucional: "Correo Institucional",
    docencia: "Docencia",
    cumpleaños: "Cumpleaños",
    tipo_contrato: "Tipo de Contrato",
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <MaterialIcons name="person-outline" size={24} color="#4f46e5" />
        <Text style={styles.cardTitle}>Información Personal</Text>
      </View>

      <View style={styles.formGrid}>
        {Object.entries(formData).map(([key, value]) => (
          <View key={key} style={styles.inputContainer}>
            <Text style={styles.label}>{fieldLabels[key]}</Text>
            <TextInput
              style={styles.input}
              editable={false}
              value={value}
              placeholderTextColor="#94a3b8"
            />
          </View>
        ))}
      </View>
    </View>
  );
};

export default PersonalInfoCard;
