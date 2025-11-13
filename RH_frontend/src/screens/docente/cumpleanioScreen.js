import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function CumpleaniosScreen() {
  // Ejemplo de datos, en producción vendrán del backend
  const docente = {
    nombre: "Juan Pérez",
    cumpleanos: "1990-06-15",
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cumpleaños</Text>
      <Text style={styles.text}>Nombre: {docente.nombre}</Text>
      <Text style={styles.text}>Fecha de nacimiento: {docente.cumpleanos}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20 },
  text: { fontSize: 16, marginBottom: 10 },
});
