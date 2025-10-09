import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";

const data = [
  {
    name: "Pendientes",
    value: 8,
    color: "#ff595e",
    legendFontColor: "#333",
    legendFontSize: 13,
  },
  {
    name: "En Proceso",
    value: 12,
    color: "#8ac926",
    legendFontColor: "#333",
    legendFontSize: 13,
  },
  {
    name: "Resueltas",
    value: 21,
    color: "#1982c4",
    legendFontColor: "#333",
    legendFontSize: 13,
  },
];

export default function StatusDistribution() {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>Estado de Incidencias</Text>
      <PieChart
        data={data.map((item) => ({
          name: item.name,
          population: item.value,
          color: item.color,
          legendFontColor: item.legendFontColor,
          legendFontSize: item.legendFontSize,
        }))}
        width={Dimensions.get("window").width - 1500}
        height={250}
        chartConfig={{
          color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
        }}
        accessor={"population"}
        backgroundColor={"transparent"}
        paddingLeft={15}
        absolute
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
    margin: 0,
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0077b6",
    marginBottom: 10,
  },
});
