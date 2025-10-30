import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from 'C:/xampp/htdocs/proyectRH/RH_frontend/supabaseClient.js';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/sidebar';
import Header from '../../components/header';
import Papa from 'papaparse';

export default function UsuariosScreen() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [resultadosCSV, setResultadosCSV] = useState(null);
  const fileInputRef = useRef(null);

  // 🧾 Subida y procesamiento del CSV
  const handleCSVUpload = async (event) => {
    const file = event.target.files[0];
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://192.168.1.84:5000/admin/import-docentes', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();

      setResultadosCSV(result);
      setModalVisible(true);
      fetchUsuarios();
    } catch (err) {
      console.error('Error al subir CSV:', err);
      alert('Error al importar el archivo.');
    }
  };

  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('DOCENTES')
      .select('id, nombre, correo_institucional, estado, docencia, cumpleaños');
    if (!error) setUsuarios(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  if (!user || user.rol_id !== 1) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.mainWrapper}>
          <Sidebar />
          <View style={styles.contentWrapper}>
            <Text style={styles.title}>Acceso denegado</Text>
            <Text style={styles.subtitle}>
              Esta sección es exclusiva para administradores.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  const handleApprove = async (id) => {
    await supabase.from('DOCENTES').update({ estado: 'aprobado' }).eq('id', id);
    fetchUsuarios();
  };

  const handleReject = async (id) => {
    await supabase.from('DOCENTES').update({ estado: 'rechazado' }).eq('id', id);
    fetchUsuarios();
  };

  const getStatusBadge = (estado) => {
    const colorMap = {
      pendiente: '#facc15',
      aprobado: '#22c55e',
      rechazado: '#ef4444',
    };
    return (
      <View style={[styles.badge, { backgroundColor: colorMap[estado] || '#ccc' }]}>
        <Text style={styles.badgeText}>{estado?.toUpperCase()}</Text>
      </View>
    );
  };

  const filteredUsuarios = usuarios.filter((u) => {
    const matchSearch =
      u.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.correo_institucional?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'todos' || u.estado === statusFilter;
    return matchSearch && matchStatus;
  });

  const pendingCount = usuarios.filter((u) => u.estado === 'pendiente').length;
  const approvedCount = usuarios.filter((u) => u.estado === 'aprobado').length;
  const rejectedCount = usuarios.filter((u) => u.estado === 'rechazado').length;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainWrapper}>
        <Sidebar />
        <View style={styles.contentWrapper}>
          <Header />
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            <View style={styles.headerSection}>
              <Text style={styles.title}>Gestión de Usuarios</Text>
              <Text style={styles.subtitle}>
                Verifica y administra las solicitudes de registro
              </Text>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Buscar por nombre o email"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />

            {/* 📊 Filtros */}
            <View style={styles.filterRow}>
              {['todos', 'pendiente', 'aprobado', 'rechazado'].map((estado) => (
                <TouchableOpacity
                  key={estado}
                  style={[
                    styles.filterButton,
                    statusFilter === estado && styles.filterButtonActive,
                  ]}
                  onPress={() => setStatusFilter(estado)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      statusFilter === estado && styles.filterTextActive,
                    ]}
                  >
                    {estado.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* 🧮 Resumen */}
            <View style={styles.summaryRow}>
              <View style={[styles.summaryCard, { borderColor: '#facc15' }]}>
                <Text style={styles.summaryTitle}>Pendientes</Text>
                <Text style={styles.summaryCount}>{pendingCount}</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: '#22c55e' }]}>
                <Text style={styles.summaryTitle}>Aprobados</Text>
                <Text style={styles.summaryCount}>{approvedCount}</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: '#ef4444' }]}>
                <Text style={styles.summaryTitle}>Rechazados</Text>
                <Text style={styles.summaryCount}>{rejectedCount}</Text>
              </View>
            </View>

            {/* 📥 Botón Importar CSV */}
            <TouchableOpacity
              style={styles.importButton}
              onPress={() => fileInputRef.current?.click()}
            >
              <Ionicons name="cloud-upload-outline" size={20} color="#fff" />
              <Text style={styles.importText}> Importar CSV de Docentes</Text>
            </TouchableOpacity>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display: 'none' }}
              onChange={handleCSVUpload}
            />

            {/* 🧾 Tabla */}
            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, { flex: 2 }]}>Nombre</Text>
              <Text style={[styles.headerText, { flex: 2 }]}>Apellido</Text>
              <Text style={[styles.headerText, { flex: 2 }]}>Docencia</Text>
              <Text style={[styles.headerText, { flex: 3 }]}>Correo</Text>
              <Text style={[styles.headerText, { flex: 3 }]}>Cumpleaños</Text>
              <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
              <Text style={[styles.headerText, { flex: 1 }]}>Acciones</Text>
            </View>

            {loading ? (
              <ActivityIndicator size="large" color="#ef4444" />
            ) : (
              <FlatList
                data={filteredUsuarios}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.cardRow}>
                    <Text style={[styles.cellText, { flex: 2 }]}>{item.nombre}</Text>
                    <Text style={[styles.cellText, { flex: 2 }]}>{item.apellido}</Text>
                    <Text style={[styles.cellText, { flex: 2 }]}>{item.docencia}</Text>
                    <Text style={[styles.cellText, { flex: 3 }]}>{item.correo_institucional}</Text>
                    <Text style={[styles.cellText, { flex: 3 }]}>{item.cumpleaños}</Text>
                    <View style={[styles.cellText, { flex: 1 }]}>{getStatusBadge(item.estado)}</View>
                    <View style={[styles.actions, { flex: 1 }]}>
                      {item.estado === 'pending' && (
                        <>
                          <TouchableOpacity onPress={() => handleApprove(item.id)}>
                            <Ionicons name="checkmark-circle" size={24} color="#22c55e" />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => handleReject(item.id)}>
                            <Ionicons name="close-circle" size={24} color="#ef4444" />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                )}
              />
            )}
          </ScrollView>
        </View>
      </View>

      {/* 📋 Modal con resultados del CSV */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Resultado de la Importación</Text>
            {resultadosCSV ? (
              <>
                <Text style={styles.modalSubtitle}>✅ Actualizados:</Text>
                {Array.isArray(resultadosCSV.actualizados) && resultadosCSV.actualizados.length > 0 ? (
                  resultadosCSV.actualizados.map((u, i) => (
                    <Text key={i} style={styles.modalItem}>• {u}</Text>
                  ))
                ) : (
                  <Text style={styles.modalItem}>Ninguno</Text>
                )}

                <Text style={[styles.modalSubtitle, { marginTop: 8 }]}>⚠️ No encontrados:</Text>
                {Array.isArray(resultadosCSV.no_encontrados) && resultadosCSV.no_encontrados.length > 0 ? (
                  resultadosCSV.no_encontrados.map((u, i) => (
                    <Text key={i} style={styles.modalItem}>• {u}</Text>
                  ))
                ) : (
                  <Text style={styles.modalItem}>Ninguno</Text>
                )}
              </>
            ) : (
              <ActivityIndicator size="large" color="#ef4444" />
            )}
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mainWrapper: { flexDirection: 'row', flex: 1 },
  contentWrapper: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#6b7280' },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 8, marginBottom: 12,
  },
  filterRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 12 },
  filterButton: { padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  filterButtonActive: { backgroundColor: '#ef4444' },
  filterText: { color: '#374151' },
  filterTextActive: { color: '#fff', fontWeight: 'bold' },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  summaryTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 4 },
  summaryCount: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#ccc',
    marginBottom: 8,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  badgeText: { color: '#fff', fontWeight: '600', fontSize: 12 },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cellText: { fontSize: 14, color: '#111827' },
  actions: { flexDirection: 'row', justifyContent: 'space-around' },
  importButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    padding: 10,
    borderRadius: 8,
    marginVertical: 12,
  },
  importText: { color: '#fff', fontWeight: 'bold', marginLeft: 6 },

  // 🔵 Modal
  modalBackground: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    backgroundColor: '#fff',
    width: '80%',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10, textAlign: 'center' },
  modalSubtitle: { fontWeight: 'bold', color: '#374151', marginTop: 8 },
  modalItem: { fontSize: 14, color: '#111827', marginLeft: 8 },
  closeButton: {
    backgroundColor: '#ef4444',
    padding: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  closeText: { color: '#fff', fontWeight: 'bold', textAlign: 'center' },
});
