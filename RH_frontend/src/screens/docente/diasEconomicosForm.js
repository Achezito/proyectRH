import React, { useState } from "react";
import { View, Text, TextInput, Button, StyleSheet, Alert } from "react-native";

export default function DiasEconomicosForm() {
  const [fecha, setFecha] = useState("");
  const [motivo, setMotivo] = useState("");

  const handleSubmit = () => {
    if (!fecha || !motivo)
      return Alert.alert("Error", "Completa todos los campos");
    Alert.alert("✅ Día Económico solicitado", `${fecha} - ${motivo}`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Solicitar Día Económico</Text>
      <TextInput
        style={styles.input}
        placeholder="Fecha (YYYY-MM-DD)"
        value={fecha}
        onChangeText={setFecha}
      />
      <TextInput
        style={styles.input}
        placeholder="Motivo"
        value={motivo}
        onChangeText={setMotivo}
      />
      <Button title="Enviar solicitud" onPress={handleSubmit} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 10,
    padding: 10,
    marginBottom: 15,
  },
});
