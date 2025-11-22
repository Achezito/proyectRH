// src/components/TeacherDashboard/StatsCards.js
import React from "react";
import { View, Text } from "react-native";
import { styles } from "./styles";

const StatsCards = ({ stats }) => (
  <View style={styles.statsGrid}>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{stats.totalIncidencias}</Text>
      <Text style={styles.statLabel}>Total Incidencias</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{stats.incidenciasPendientes}</Text>
      <Text style={styles.statLabel}>Pendientes</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{stats.diasEconomicosUsados}</Text>
      <Text style={styles.statLabel}>Días Usados</Text>
    </View>
    <View style={styles.statCard}>
      <Text style={styles.statNumber}>{stats.diasDisponibles}</Text>
      <Text style={styles.statLabel}>Días Disponibles</Text>
    </View>
  </View>
);

export default StatsCards;
