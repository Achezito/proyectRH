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
  const [resumen, setResumen] = useState(null);

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
      const res = await fetch(
        "http://10.194.1.108:5000/admin/preview-docentes",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setPreviewData(data.preview);
      setCsvDisponible(data.csv_disponible);
      setResumen(data.resumen); // Guardar el resumen
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
      const res = await fetch(
        "http://10.194.1.108:5000/admin/confirmar-docentes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ docentes: previewData }),
        }
      );

      const result = await res.json();
      if (result.error) throw new Error(result.error);

      alert(`✅ ${result.insertados} docentes agregados correctamente`);

      // Limpiar el estado después de confirmar
      if (result.errores && result.errores.length > 0) {
        alert(`Algunos errores: ${JSON.stringify(result.errores)}`);
      }

      setPreviewData([]);
      setResumen(null);
      setCsvDisponible(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

      const response = await fetch(
        "http://10.194.1.108:5000/admin/generar-csv-docentes",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(previewData),
        }
      );

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

  // Definir las columnas a mostrar
  const columns = [
    { key: "nombre", label: "Nombre", width: 1.5 },
    { key: "apellido", label: "Apellido", width: 1.5 },
    { key: "correo_institucional", label: "Correo", width: 2 },
    { key: "docencia", label: "Docencia", width: 1.5 },
    { key: "tipo_contrato", label: "Contrato", width: 1.2 },
    { key: "tipo_colaborador", label: "Tipo", width: 1.2 },
    { key: "contrasena", label: "Contraseña", width: 1.5 },
  ];

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
                nombre, apellido, correo_institucional, docencia, cumpleanos,
                tipo_contrato, tipo_colaborador
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

              <TouchableOpacity
                style={styles.previewButton}
                onPress={handlePreview}
                disabled={loading}
              >
                <Ionicons name="document-text-outline" size={18} color="#fff" />
                <Text style={styles.buttonText}>
                  {loading ? "Procesando..." : "Generar vista previa"}
                </Text>
              </TouchableOpacity>
            </View>

            {loading && <ActivityIndicator size="large" color="#007BFF" />}

            {/* Resumen de importación */}
            {resumen && (
              <View style={styles.resumenContainer}>
                <Text style={styles.resumenTitle}>Resumen de importación:</Text>
                <View style={styles.resumenGrid}>
                  <View style={styles.resumenItem}>
                    <Text style={styles.resumenCount}>
                      {resumen.colaboradores_anual}
                    </Text>
                    <Text style={styles.resumenLabel}>Colaboradores Anual</Text>
                  </View>
                  <View style={styles.resumenItem}>
                    <Text style={styles.resumenCount}>
                      {resumen.colaboradores_cuatrimestral}
                    </Text>
                    <Text style={styles.resumenLabel}>
                      Colaboradores Cuatrimestral
                    </Text>
                  </View>
                  <View style={styles.resumenItem}>
                    <Text style={styles.resumenCount}>
                      {resumen.administrativos_anual}
                    </Text>
                    <Text style={styles.resumenLabel}>
                      Administrativos Anual
                    </Text>
                  </View>
                  <View style={styles.resumenItem}>
                    <Text style={styles.resumenCount}>
                      {resumen.administrativos_cuatrimestral}
                    </Text>
                    <Text style={styles.resumenLabel}>
                      Administrativos Cuatrimestral
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {previewData.length > 0 && (
              <>
                <Text style={styles.previewTitle}>
                  Vista previa de docentes ({previewData.length} registros)
                </Text>

                {/* Tabla con scroll horizontal */}
                <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                  <View>
                    {/* Header de la tabla */}
                    <View style={styles.tableHeader}>
                      {columns.map((column) => (
                        <View
                          key={column.key}
                          style={[
                            styles.tableHeaderCell,
                            { flex: column.width },
                          ]}
                        >
                          <Text style={styles.tableHeaderText}>
                            {column.label}
                          </Text>
                        </View>
                      ))}
                    </View>

                    {/* Filas de la tabla */}
                    <FlatList
                      data={previewData}
                      keyExtractor={(item, index) => index.toString()}
                      renderItem={({ item }) => (
                        <View style={styles.tableRow}>
                          {columns.map((column) => (
                            <View
                              key={column.key}
                              style={[styles.tableCell, { flex: column.width }]}
                            >
                              <Text style={styles.tableCellText}>
                                {item[column.key]}
                              </Text>
                            </View>
                          ))}
                        </View>
                      )}
                    />
                  </View>
                </ScrollView>

                <View style={styles.buttonsRow}>
                  {csvDisponible && (
                    <TouchableOpacity
                      style={styles.downloadButton}
                      onPress={handleDownload}
                    >
                      <Ionicons
                        name="download-outline"
                        size={18}
                        color="#fff"
                      />
                      <Text style={styles.buttonText}>Descargar CSV</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleConfirm}
                  >
                    <Ionicons
                      name="checkmark-done-outline"
                      size={18}
                      color="#fff"
                    />
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
  subtitle: { fontSize: 14, color: "#555", marginBottom: 20, lineHeight: 20 },
  uploadSection: { marginBottom: 20 },
  previewButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#007BFF",
    padding: 12,
    borderRadius: 8,
    justifyContent: "center",
  },
  buttonText: { color: "#fff", marginLeft: 8, fontWeight: "bold" },
  previewTitle: { fontSize: 18, fontWeight: "600", marginVertical: 15 },

  // Resumen styles
  resumenContainer: {
    backgroundColor: "#e8f4fd",
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
  },
  resumenTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#0369a1",
  },
  resumenGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  resumenItem: {
    alignItems: "center",
    marginBottom: 10,
    minWidth: "48%",
  },
  resumenCount: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#007BFF",
  },
  resumenLabel: {
    fontSize: 12,
    color: "#64748b",
    textAlign: "center",
  },

  // Table styles
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#007BFF",
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    minWidth: 800, // Ancho mínimo para evitar que se comprima demasiado
  },
  tableHeaderCell: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  tableHeaderText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 12,
    textAlign: "center",
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingVertical: 10,
    minWidth: 800, // Mismo ancho mínimo que el header
  },
  tableCell: {
    paddingHorizontal: 8,
    justifyContent: "center",
  },
  tableCellText: {
    fontSize: 12,
    color: "#334155",
    textAlign: "center",
  },
  buttonsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginVertical: 20,
    gap: 10,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#28a745",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
  downloadButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#17a2b8",
    padding: 12,
    borderRadius: 8,
    flex: 1,
    justifyContent: "center",
  },
});
