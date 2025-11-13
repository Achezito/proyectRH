import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function DashboardScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bienvenido al Portal Docente</Text>
      <Text style={styles.subtitle}>Selecciona una opción del menú lateral</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "bold" },
  subtitle: { marginTop: 10, fontSize: 16, color: "gray" },
});
