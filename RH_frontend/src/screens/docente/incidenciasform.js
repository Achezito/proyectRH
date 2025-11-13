import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";

export default function IncidenciasForm() {
  const [motivo, setMotivo] = useState("");
  const [justificada, setJustificada] = useState(false);

  const handleSubmit = () => {
    if (!motivo) return Alert.alert("Error", "Escribe un motivo");
    Alert.alert("✅ Incidencia registrada", `Motivo: ${motivo}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Registrar Incidencia</Text>
      <TextInput
        style={styles.input}
        placeholder="Motivo de la incidencia"
        value={motivo}
        onChangeText={setMotivo}
      />
      <Button title="Registrar" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, marginBottom: 20, fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
});
