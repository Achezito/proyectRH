import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Sidebar } from "../../components/sidebar";
import Header from "../../components/header";

export default function UsuariosScreen() {
  const [previewData, setPreviewData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [csvFile, setCsvFile] = useState(null);
  const [csvDisponible, setCsvDisponible] = useState(false);

  const fileInputRef = useRef(null);

  const handleSelectFile = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    setCsvFile(file);
  };

  // 📤 Subir CSV y generar contraseñas
  const handlePreview = async () => {
    if (!csvFile) return alert("Por favor selecciona un archivo CSV primero.");
    setLoading(true);

    const formData = new FormData();
    formData.append("file", csvFile);

    try {
      const res = await fetch("http://192.168.1.84:5000/admin/preview-docentes", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPreviewData(data.preview);
      setCsvDisponible(data.csv_disponible);
    } catch (err) {
      console.error("❌ Error al generar vista previa:", err);
      alert("Error al procesar el archivo.");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Confirmar importación
  const handleConfirm = async () => {
    if (previewData.length === 0) return alert("No hay datos para confirmar.");

    try {
      const res = await fetch("http://192.168.1.84:5000/admin/confirmar-docentes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ docentes: previewData }),
      });

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      alert(`✅ ${result.insertados} docentes agregados correctamente`);
    } catch (err) {
      console.error("Error confirmando docentes:", err);
      alert("Error al confirmar docentes.");
    }
  };

  // 📥 Descargar CSV con contraseñas
  const handleDownload = async () => {
  try {
    if (previewData.length === 0) {
      alert("No hay datos para descargar");
      return;
    }

    const response = await fetch("http://192.168.1.84:5000/admin/generar-csv-docentes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(previewData),
    });

    if (!response.ok) throw new Error("No se pudo descargar el CSV");

    // Convertir respuesta a Blob y crear link temporal de descarga
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "docentes_contrasenas.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();

  } catch (error) {
    console.error("Error descargando CSV:", error);
    alert("Error descargando CSV");
  }
};


  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainWrapper}>
        <Sidebar />
        <View style={styles.contentWrapper}>
          <Header title="Gestión de Usuarios" />
          <ScrollView style={styles.scrollContainer}>
            <Text style={styles.title}>📂 Importar docentes desde CSV</Text>

            <Text style={styles.subtitle}>
              El archivo CSV debe incluir las siguientes columnas:{" "}
              <Text style={{ fontWeight: "bold" }}>
                nombre, apellido, correo_institucional, docencia, cumpleanos
              </Text>
            </Text>

            <View style={styles.uploadSection}>
              <input
                type="file"
                accept=".csv"
                ref={fileInputRef}
                onChange={handleSelectFile}
                style={{ marginVertical: 10 }}
              />

              <TouchableOpacity style={styles.previewButton} onPress={handlePreview}>
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>Generar vista previa</Text>
              </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" color="#007BFF" />}

            {previewData.length > 0 && (
              <>
                <Text style={styles.previewTitle}>Vista previa de docentes</Text>
                <View style={styles.tableHeader}>
                  <Text style={styles.tableHeaderText}>Nombre</Text>
                  <Text style={styles.tableHeaderText}>Correo</Text>
                  <Text style={styles.tableHeaderText}>Contraseña</Text>
                </View>
                <FlatList
                  data={previewData}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.tableRow}>
                      <Text style={styles.tableCell}>{item.nombre} {item.apellido}</Text>
                      <Text style={styles.tableCell}>{item.correo_institucional}</Text>
                      <Text style={styles.tableCell}>{item.contrasena}</Text>
                    </View>
                  )}
                />

                <View style={styles.buttonsRow}>
                  {csvDisponible && (
                    <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
                      <Ionicons name="download-outline" size={18} color="#fff" />
                      <Text style={styles.buttonText}>Descargar CSV</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
                    <Ionicons name="checkmark-done-outline" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Confirmar Importación</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f4f6f8" },
  mainWrapper: { flexDirection: "row", flex: 1 },
  contentWrapper: { flex: 1, padding: 20 },
  scrollContainer: { paddingHorizontal: 10 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 14, color: "#555", marginBottom: 20 },
  uploadSection: { marginBottom: 20 },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
    padding: 10,
    borderRadius: 8,
  },
  buttonText: { color: "#fff", marginLeft: 5, fontWeight: "bold" },
  previewTitle: { fontSize: 18, fontWeight: "600", marginVertical: 15 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#007BFF",
    padding: 8,
    borderRadius: 6,
  },
  tableHeaderText: { color: "#fff", flex: 1, fontWeight: "bold", textAlign: "center" },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingVertical: 6,
    borderRadius: 4,
  },
  tableCell: { flex: 1, textAlign: "center", fontSize: 13 },
  buttonsRow: { flexDirection: "row", justifyContent: "space-between", marginVertical: 20 },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    padding: 10,
    borderRadius: 8,
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17a2b8",
    padding: 10,
    borderRadius: 8,
  },
});
