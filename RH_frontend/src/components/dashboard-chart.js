import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { BarChart } from "react-native-chart-kit";

const data = {
  labels: ["Ago", "Sep", "Oct", "Nov", "Dic", "Ene"],
  datasets: [
    {
      data: [12, 19, 15, 22, 18, 24],
      color: () => "#ef4444", // incidencias
    },
    {
      data: [10, 15, 13, 18, 16, 21],
      color: () => "#00b4d8", // resueltas
    },
  ],
  legend: ["Incidencias", "Resueltas"] // Añade esta línea
};

export default function DashboardChart() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Incidencias por Mes</Text>
      <BarChart
        data={data}
        width={Dimensions.get("window").width - 1500}
        height={380} // Aumenté la altura para mejor visualización
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          barPercentage: 1, // Ajusté el porcentaje de barra
          propsForLabels: {
            fontSize: 15,
          },
          propsForBackgroundLines: {
            strokeWidth: 1,
            stroke: "#e5e5e5",
          },
        }}
        verticalLabelRotation={0}
        style={styles.chart}
        fromZero
        showBarTops={false}
        withInnerLines={true} // Añade líneas internas
        withHorizontalLabels={true} // Asegura etiquetas horizontales
        showValuesOnTopOfBars={true} // Muestra valores encima de las barras
      />
      
      {/* Leyenda personalizada */}
      <View style={styles.legendContainer}>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#ef4444" }]} />
          <Text style={styles.legendText}>Incidencias</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: "#00b4d8" }]} />
          <Text style={styles.legendText}>Resueltas</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    margin: 0,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0077b6",
    marginBottom: 10,
    textAlign: "center",
  },
  chart: {
    borderRadius: 8,
    marginVertical: 8,
  },
  legendContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 10,
    gap: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: "#666",
  },
});