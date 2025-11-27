import React from "react";
import { View, TouchableOpacity, Text } from "react-native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { styles } from "./styles";

const ActionButton = ({ title, onPress, backgroundColor, icon }) => (
  <TouchableOpacity
    style={[styles.actionButton, { backgroundColor }]}
    onPress={onPress}
  >
    {icon}
    <Text style={styles.actionButtonText}>{title}</Text>
  </TouchableOpacity>
);

const ActionButtons = ({ onOpenModal }) => (
  <View style={styles.actionGrid}>
    <ActionButton
      title="Nueva Incidencia"
      backgroundColor="#4f46e5"
      icon={<Ionicons name="time-outline" size={20} color="white" />}
      onPress={() => onOpenModal("incidencia")}
    />
    <ActionButton
      title="Día Económico"
      backgroundColor="#10b981"
      icon={<FontAwesome name="calendar-plus-o" size={18} color="white" />}
      onPress={() => onOpenModal("diaEconomico")}
    />
    <ActionButton
      title="Cumpleaños"
      backgroundColor="#f59e0b"
      icon={<Ionicons name="gift-outline" size={20} color="white" />}
      onPress={() => onOpenModal("cumpleanos")}
    />
    <ActionButton
      title="Permiso Especial"
      backgroundColor="#ec4899"
      icon={<MaterialIcons name="family-restroom" size={20} color="white" />}
      onPress={() => onOpenModal("permisoEspecial")}
    />
  </View>
);

export default ActionButtons;
