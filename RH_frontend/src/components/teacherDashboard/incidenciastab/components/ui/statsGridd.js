// StatsGrid.js - VERSIÓN DEFINITIVA
import React from "react";
import { View, Text } from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { styles } from "./styles";

const StatCard = ({ icon, number, label, iconColor, bgColor }) => (
  <View style={styles.statCard}>
    <View style={[styles.statIcon, { backgroundColor: bgColor }]}>{icon}</View>
    <Text style={styles.statNumber}>{number}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const StatsGrid = ({ stats, diasEconomicosStats }) => {
  // DEBUG EXTENDIDO
  console.log("🎯 StatsGrid - Datos recibidos:", {
    statsDiasDisponibles: stats?.diasDisponibles,
    diasEconomicosStatsCompleto: diasEconomicosStats,
    diasEconomicosStatsDisponibles: diasEconomicosStats?.disponibles,
    diasEconomicosStatsUsados: diasEconomicosStats?.usados,
  });

  // USAR SIEMPRE los datos reales de diasEconomicosStats si existen
  // Si no existen, mostrar 0 (no usar los datos mock de stats)
  const diasUsados = diasEconomicosStats?.usados ?? 0;
  const diasDisponibles = diasEconomicosStats?.disponibles ?? 0;

  console.log("✅ Valores finales para render:", {
    diasUsados,
    diasDisponibles,
  });

  return (
    <View style={styles.statsGrid}>
      <StatCard
        icon={
          <Ionicons name="document-text-outline" size={24} color="#0369a1" />
        }
        number={stats?.totalIncidencias || 0}
        label="Incidencias"
        bgColor="#e0f2fe"
      />
      <StatCard
        icon={<Ionicons name="time-outline" size={24} color="#d97706" />}
        number={stats?.incidenciasPendientes || 0}
        label="Pendientes"
        bgColor="#fef3c7"
      />
      <StatCard
        icon={<FontAwesome name="calendar-check-o" size={20} color="#16a34a" />}
        number={diasUsados}
        label="Días Usados"
        bgColor="#dcfce7"
      />
      <StatCard
        icon={<FontAwesome name="calendar-plus-o" size={20} color="#7c3aed" />}
        number={diasDisponibles}
        label="Días Disponibles"
        bgColor="#f3e8ff"
      />
    </View>
  );
};

export default StatsGrid;
