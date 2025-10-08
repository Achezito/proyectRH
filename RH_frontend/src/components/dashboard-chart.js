import React from "react";""
import {View, Text, StyleSheet, Dimensions} from "react-native";
import {BarChart} from "react-native-chart-kit";

const data = {
    labels: ["Ago", "Sep", "Oct", "Nov", "Dic","Ene"],
    datasets: [
        {
            data: [12, 19, 15, 22, 18, 24],
            color: () => "#0077b6", //incidencias
            label: "Incidencias",
        },
        {
            data: [10,15,13,18,16,21],
            color: () => "#00b4d8", //resueltas
            label:"Resueltas", 
        },
    ],
};
export default function DashboardChart() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Incidencias por Mes</Text>
      <BarChart
        data={data}
        width={Dimensions.get("window").width - 40}
        height={250}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: "#ffffff",
          backgroundGradientFrom: "#ffffff",
          backgroundGradientTo: "#ffffff",
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          barPercentage: 0.5,
        }}
        verticalLabelRotation={0}
        style={styles.chart}
        fromZero
        showValuesOnTopOfBars
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    elevation: 4, // sombra Android
    shadowColor: "#000", // sombra iOS
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    margin: 16,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0077b6",
    marginBottom: 10,
  },
  chart: {
    borderRadius: 8,
  },
});