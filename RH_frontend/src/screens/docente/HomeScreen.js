import React, { useEffect, useState } from "react"
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Switch,
  Modal,
  StyleSheet,
} from "react-native"
import { useRouter } from "expo-router"
import { Feather } from "@expo/vector-icons"

export default function PortalDocentePage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("perfil")

  const [incidentForm, setIncidentForm] = useState({ fecha: "", motivo: "", justificacion: false })
  const [economicDayForm, setEconomicDayForm] = useState({ fecha: "", motivo: "" })
  const [isIncidentDialogOpen, setIsIncidentDialogOpen] = useState(false)
  const [isEconomicDayDialogOpen, setIsEconomicDayDialogOpen] = useState(false)

  const [incidencias, setIncidencias] = useState([
    { id: 1, fecha: "2025-01-15", motivo: "Cita médica", justificaciones: true, estado: "Aprobada" },
    { id: 2, fecha: "2025-01-08", motivo: "Retardo por tráfico", justificaciones: true, estado: "En Proceso" },
    { id: 3, fecha: "2024-12-20", motivo: "Asunto personal", justificaciones: false, estado: "Rechazada" },
  ])

  const [diasEconomicos, setDiasEconomicos] = useState([
    { id: 1, fecha: "2025-01-20", motivo: "Trámite bancario", estado: "Aprobado" },
  ])
  const [diasEconomicosRestantes, setDiasEconomicosRestantes] = useState(2)

  const docenteData = {
    nombre: "María García",
    apellido: "López",
    correo_institucional: "maria.garcia@universidad.edu",
    docencia: "Matemáticas",
    tipo_contrato: "Tiempo Completo",
    cumpleanos: "1985-05-15",
    diasEconomicosRestantes,
    diasEconomicosTotales: 3,
  }

  const handleSubmitIncident = () => {
    if (!incidentForm.fecha || !incidentForm.motivo) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }

    const newIncident = {
      id: incidencias.length + 1,
      fecha: incidentForm.fecha,
      motivo: incidentForm.motivo,
      justificaciones: incidentForm.justificacion,
      estado: "En Proceso",
    }
    setIncidencias([newIncident, ...incidencias])
    setIncidentForm({ fecha: "", motivo: "", justificacion: false })
    setIsIncidentDialogOpen(false)
  }

  const handleSubmitEconomicDay = () => {
    if (!economicDayForm.fecha || !economicDayForm.motivo) {
      Alert.alert("Error", "Por favor completa todos los campos")
      return
    }
    if (diasEconomicosRestantes === 0) {
      Alert.alert("Error", "No tienes días económicos disponibles")
      return
    }

    const newEconomicDay = {
      id: diasEconomicos.length + 1,
      fecha: economicDayForm.fecha,
      motivo: economicDayForm.motivo,
      estado: "En Proceso",
    }
    setDiasEconomicos([newEconomicDay, ...diasEconomicos])
    setDiasEconomicosRestantes(diasEconomicosRestantes - 1)
    setEconomicDayForm({ fecha: "", motivo: "" })
    setIsEconomicDayDialogOpen(false)
  }

  const getStatusStyle = (estado) => {
    switch (estado) {
      case "Aprobada":
      case "Aprobado":
        return { backgroundColor: "#FEE2E2", color: "#DC2626" }
      case "En Proceso":
        return { backgroundColor: "#FEF3C7", color: "#D97706" }
      default:
        return { backgroundColor: "#F3F4F6", color: "#6B7280" }
    }
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portal Docente</Text>
        <TouchableOpacity onPress={() => router.push("/login")} style={styles.logoutButton}>
          <Feather name="log-out" size={18} color="#DC2626" />
          <Text style={styles.logoutText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {["perfil", "incidencias", "dias"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === "perfil"
                ? "Mi Perfil"
                : tab === "incidencias"
                ? "Mis Incidencias"
                : "Días Económicos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* PERFIL */}
        {activeTab === "perfil" && (
          <View>
            <Text style={styles.sectionTitle}>Información Personal</Text>
            {Object.entries(docenteData)
              .filter(([key]) => !["diasEconomicosTotales", "diasEconomicosRestantes"].includes(key))
              .map(([key, value]) => (
                <View key={key} style={styles.fieldRow}>
                  <Text style={styles.fieldLabel}>{key.replace("_", " ")}:</Text>
                  <Text style={styles.fieldValue}>{value}</Text>
                </View>
              ))}

            <View style={styles.progressContainer}>
              <Text style={styles.progressNumber}>{docenteData.diasEconomicosRestantes}</Text>
              <Text style={styles.progressLabel}>de {docenteData.diasEconomicosTotales} días económicos</Text>
            </View>
          </View>
        )}

        {/* INCIDENCIAS */}
        {activeTab === "incidencias" && (
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Mis Incidencias</Text>
              <TouchableOpacity style={styles.addButton} onPress={() => setIsIncidentDialogOpen(true)}>
                <Feather name="plus" color="#fff" size={16} />
                <Text style={styles.addButtonText}>Nueva</Text>
              </TouchableOpacity>
            </View>

            {incidencias.map((i) => {
              const st = getStatusStyle(i.estado)
              return (
                <View key={i.id} style={styles.card}>
                  <Text style={styles.cardDate}>{i.fecha}</Text>
                  <Text style={styles.cardText}>{i.motivo}</Text>
                  <Text style={{ color: i.justificaciones ? "#DC2626" : "#6B7280", marginBottom: 8 }}>
                    Justificación: {i.justificaciones ? "Sí" : "No"}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: st.backgroundColor }]}>
                    <Text style={{ color: st.color, fontWeight: "600" }}>{i.estado}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}

        {/* DÍAS ECONÓMICOS */}
        {activeTab === "dias" && (
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.sectionTitle}>Días Económicos</Text>
              <TouchableOpacity
                style={[styles.addButton, diasEconomicosRestantes === 0 && { opacity: 0.5 }]}
                disabled={diasEconomicosRestantes === 0}
                onPress={() => setIsEconomicDayDialogOpen(true)}
              >
                <Feather name="plus" color="#fff" size={16} />
                <Text style={styles.addButtonText}>Solicitar</Text>
              </TouchableOpacity>
            </View>

            {diasEconomicos.map((d) => {
              const st = getStatusStyle(d.estado)
              return (
                <View key={d.id} style={styles.card}>
                  <Text style={styles.cardDate}>{d.fecha}</Text>
                  <Text style={styles.cardText}>{d.motivo}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: st.backgroundColor }]}>
                    <Text style={{ color: st.color, fontWeight: "600" }}>{d.estado}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        )}
      </ScrollView>

      {/* MODAL INCIDENCIA */}
      <Modal visible={isIncidentDialogOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nueva Incidencia</Text>
            <TextInput
              placeholder="Fecha (YYYY-MM-DD)"
              style={styles.input}
              value={incidentForm.fecha}
              onChangeText={(text) => setIncidentForm({ ...incidentForm, fecha: text })}
            />
            <TextInput
              placeholder="Motivo"
              style={[styles.input, { height: 80 }]}
              multiline
              value={incidentForm.motivo}
              onChangeText={(text) => setIncidentForm({ ...incidentForm, motivo: text })}
            />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Switch
                value={incidentForm.justificacion}
                onValueChange={(v) => setIncidentForm({ ...incidentForm, justificacion: v })}
                trackColor={{ false: "#E5E7EB", true: "#DC2626" }}
                thumbColor={incidentForm.justificacion ? "#fff" : "#f4f3f4"}
              />
              <Text style={styles.switchLabel}>Tengo justificación</Text>
            </View>
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsIncidentDialogOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmitIncident} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* MODAL DÍA ECONÓMICO */}
      <Modal visible={isEconomicDayDialogOpen} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Solicitar Día Económico</Text>
            <TextInput
              placeholder="Fecha (YYYY-MM-DD)"
              style={styles.input}
              value={economicDayForm.fecha}
              onChangeText={(text) => setEconomicDayForm({ ...economicDayForm, fecha: text })}
            />
            <TextInput
              placeholder="Motivo"
              style={[styles.input, { height: 80 }]}
              multiline
              value={economicDayForm.motivo}
              onChangeText={(text) => setEconomicDayForm({ ...economicDayForm, motivo: text })}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity onPress={() => setIsEconomicDayDialogOpen(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSubmitEconomicDay} style={styles.confirmBtn}>
                <Text style={styles.confirmBtnText}>Enviar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#c5c5c5ff",
    backgroundColor: "#661a1aff",
  },
  headerTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    color: "#fff" 
  },
  logoutButton: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  logoutText: { 
    color: "#DC2626", 
    fontWeight: "600" 
  },
  tabContainer: { 
    flexDirection: "row", 
    borderBottomWidth: 1, 
    borderBottomColor: "#FECACA",
    backgroundColor: "#fff",
  },
  tab: { 
    flex: 1, 
    alignItems: "center", 
    padding: 16 
  },
  activeTab: { 
    borderBottomWidth: 3, 
    borderBottomColor: "#DC2626" 
  },
  tabText: { 
    color: "#9CA3AF", 
    fontWeight: "500" 
  },
  activeTabText: { 
    color: "#DC2626", 
    fontWeight: "600" 
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 16,
    color: "#DC2626"
  },
  fieldRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginVertical: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#FECACA"
  },
  fieldLabel: { 
    color: "#7F1D1D", 
    fontWeight: "500" 
  },
  fieldValue: { 
    color: "#111827", 
    fontWeight: "600" 
  },
  progressContainer: { 
    alignItems: "center", 
    marginVertical: 24,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  progressNumber: { 
    fontSize: 32, 
    color: "#DC2626", 
    fontWeight: "bold",
    marginBottom: 4
  },
  progressLabel: { 
    color: "#7F1D1D",
    fontWeight: "500"
  },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#DC2626",
  },
  cardDate: { 
    fontWeight: "bold", 
    marginBottom: 8,
    color: "#7F1D1D",
    fontSize: 16
  },
  cardText: {
    color: "#374151",
    marginBottom: 8,
    lineHeight: 20
  },
  statusBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#DC2626",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: { 
    color: "#fff", 
    fontWeight: "600",
    fontSize: 14
  },
  headerRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    marginBottom: 16 
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: 20,
  },
  modalContent: { 
    backgroundColor: "#fff", 
    borderRadius: 16, 
    padding: 24, 
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  modalTitle: { 
    fontSize: 20, 
    fontWeight: "bold", 
    marginBottom: 20,
    color: "#DC2626",
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: 8,
    padding: 12,
    backgroundColor: "#fff",
    marginBottom: 16,
    fontSize: 16,
    color: "#374151",
  },
  switchLabel: {
    color: "#374151",
    fontWeight: "500"
  },
  modalButtons: { 
    flexDirection: "row", 
    justifyContent: "flex-end", 
    gap: 12, 
    marginTop: 8 
  },
  cancelBtn: { 
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#DC2626"
  },
  cancelBtnText: {
    color: "#DC2626",
    fontWeight: "600"
  },
  confirmBtn: { 
    paddingHorizontal: 20,
    paddingVertical: 10, 
    backgroundColor: "#DC2626", 
    borderRadius: 8 
  },
  confirmBtnText: { 
    color: "#fff", 
    fontWeight: "600" 
  },
})