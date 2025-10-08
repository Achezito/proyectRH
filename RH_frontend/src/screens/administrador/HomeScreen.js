import React from  "react";
import {View, Text, ScrollView, StyleSheet, Flatlist} from "react-native";
import {AlertCircle, Users, Calendar, TrendingUp } from "lucide-react-native";
import DashboardChart from "../../components/dashboard-chart";
import StatusDistribution from "../../components/status-distribution";
import Header from "../../components/header";

export default function DashboardPage() {
  const stats = [
    {
      title: "Incidencias Activas",
      value: "24",
      change: "+12%",
      icon: AlertCircle,
      trend: "up",
    },
    {
      title: "Total Docentes",
      value: "156",
      change: "+3",
      icon: Users,
      trend: "up",
    },
    {
      title: "Días Económicos",
      value: "48",
      change: "-8%",
      icon: Calendar,
      trend: "down",
    },
    {
      title: "Tasa de Resolución",
      value: "87%",
      change: "+5%",
      icon: TrendingUp,
      trend: "up",
    },
  ];
   const incidencias = [
    { docente: "María García López", motivo: "Falta injustificada", fecha: "2025-01-05", estado: "Pendiente" },
    { docente: "Juan Pérez Martínez", motivo: "Retardo", fecha: "2025-01-04", estado: "En Proceso" },
    { docente: "Ana Rodríguez Silva", motivo: "Ausencia médica", fecha: "2025-01-03", estado: "Resuelta" },
  ];

  const diasEconomicos = [
    { docente: "Carlos Hernández", motivo: "Asunto personal", fecha: "2025-01-10", estado: "Aprobado" },
    { docente: "Laura Sánchez", motivo: "Trámite médico", fecha: "2025-01-12", estado: "Pendiente" },
    { docente: "Roberto Díaz", motivo: "Asunto familiar", fecha: "2025-01-15", estado: "Pendiente" },
  ];

  return ( 
    <View style= {styles.container}>
      <Header />
      <ScrollView contentContainerStyle= {styles.content}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Resumen general del sistema de incidencias</Text>
         {/* 📊 Tarjetas de estadísticas */}
         <View style= {styles.statsContainer}>
          {stats.map((stat, i) => (
            <View key= {i} style={styles.card}>
              <View style ={styles.cardHeader}>
              <Text style= {styles.cardHeader}>{stat.title} </Text>
              <stat.icon size={20} color="#666"/>
            </View>
            <Text style={styles.cardValue}>{stat.value}</Text>
            <Text 
            style= {[
              styles.cardChange,
              {color: stat.trend ==="up" ? "#0077b6" : "#888"},
            ]}
            >
              {stat.change} desde el mes pasado
              </Text>
            </View>
          ))}
         </View>
          {/* 📈 Gráficas */}
          <View style = {styles.chartsContainer} >
            <DashboardChart/>
            <StatusDistribution/>
          </View>
             {/* 📋 Listas de incidencias */}
             <View style ={styles.listContainer}>
              <View style={styles.card}>
                <Text style={styles.cardHeaderText}>Incidencias Recientes</Text>
                {incidencias.map((item, i) => (
                  <View Key= {i} style = {styles.listItem}>
                    <View style= {{flex:1}}>
                      <Text style={styles.listName}>{item.docente}</Text>
                      <Text style={styles.listDetail}>{item.motivo}</Text>
                    </View>
                    <View style={styles.listRight}>
                      <Text
                      style={[
                        styles.statusBadge,
                        item.estado === "Resuelta"
                        ? { backgroundColor: "#d1e7dd", color: "#0f5132"}
                        : item.estado ==="En Proceso"
                        ? { backgroundColor: "#fff3cd", color: "#664d03"}
                        : {backgroundColor: "#cfe2ff", color:"#084298" },
                      ]}
                      >
                      {item.estado}
                      </Text>
                      <Text style={styles.date}>{item.fecha}</Text>
                      </View>
                      </View>

                ))}
              </View>
              <View syle={StyleSheet.card}>
                <Text style={styles.cardHeaderText}>Días Económicos Solicitados</Text>
                {diasEconomicos.map((item, i) => ( 
                  <View key= {i} style={styles.listItem}>
                    <View style= {{flex: 1}}>
                      <Text style= {styles.listName}>{item.docente}</Text>
                      <Text style= {styles.listDetail}>{item.motivo}</Text>
                    </View>
                    <View style={styles.listRight}>
                      <Text
                      style={[
                        styles.statusBadge,
                        item.estado === "Äprobado"
                        ? {backgroundColor: "#d1e7dd", color: "#0f5132"}
                        : {backgroundColor: "#cfe2ff", color: "#084298"},

                      ]}
                      >
                        {item.estado}
                        </Text>
                        <Text style= {styles.date}>{item.fecha}</Text>
                        </View>
                        </View>
                ))}
              </View>
             </View>
      </ScrollView>  
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16 },
  title: { fontSize: 26, fontWeight: "bold", color: "#222" },
  subtitle: { color: "#666", marginBottom: 16 },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: "48%",
    elevation: 3,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between" },
  cardTitle: { color: "#666", fontSize: 13 },
  cardValue: { fontSize: 22, fontWeight: "bold", marginVertical: 6 },
  cardChange: { fontSize: 12 },
  chartsContainer: { marginTop: 20 },
  listContainer: { marginTop: 20 },
  cardHeaderText: { fontSize: 16, fontWeight: "bold", marginBottom: 10 },
  listItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    paddingVertical: 10,
  },
  listName: { fontWeight: "500", color: "#222" },
  listDetail: { fontSize: 13, color: "#666" },
  listRight: { alignItems: "flex-end" },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    fontSize: 12,
    fontWeight: "bold",
  },
  date: { fontSize: 12, color: "#666", marginTop: 3 },
});