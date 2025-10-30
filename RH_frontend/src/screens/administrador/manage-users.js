import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from 'C:/xampp/htdocs/proyectRH/RH_frontend/supabaseClient.js';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from '../../components/sidebar';
import Header from '../../components/header';
import DocumentPicker from 'react-native-document-picker';
import Papa from 'papaparse';


export default function UsuariosScreen() {
  const { user } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [loading, setLoading] = useState(true);

  const importarDatosDesdeCSV = async () => {
  try {
    const file = await DocumentPicker.pickSingle({
      type: [DocumentPicker.types.plainText],
    });

    const contenido = await fetch(file.uri).then((r) => r.text());
    const { data, errors, meta } = Papa.parse(contenido, {
      header: true,
      skipEmptyLines: true,
    });

    const columnasEsperadas = ['correo_institucional', 'nombre', 'apellido'];
    const columnasCSV = meta.fields;
    const faltantes = columnasEsperadas.filter(c => !columnasCSV.includes(c));

    if (faltantes.length > 0) {
      alert(`Faltan columnas en el CSV: ${faltantes.join(', ')}`);
      return;
    }

    const { data: docentesDB, error } = await supabase
      .from('DOCENTES')
      .select('id, correo_institucional');

    if (error) throw error;

    const mapaDocentes = {};
    docentesDB.forEach(d => {
      mapaDocentes[d.correo_institucional.trim().toLowerCase()] = d.id;
    });

    let actualizados = 0;
    let noCoinciden = [];

    for (const fila of data) {
      const correo = fila.correo_institucional?.trim().toLowerCase();
      const nombre = fila.nombre?.trim();
      const apellido = fila.apellido?.trim();

      const id = mapaDocentes[correo];
      if (id && (nombre || apellido)) {
        await supabase
          .from('DOCENTES')
          .update({ nombre, apellido })
          .eq('id', id);
        actualizados++;
      } else {
        noCoinciden.push(correo);
      }
    }

    alert(`Actualizados: ${actualizados}\nNo encontrados: ${noCoinciden.length}`);
    fetchUsuarios();
  } catch (err) {
    console.error("Error al importar:", err);
    alert("Hubo un error al procesar el archivo.");
  }
};


  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('DOCENTES')
      .select('id, nombre, correo_institucional, estado');
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

            <View style={styles.tableHeader}>
              <Text style={[styles.headerText, { flex: 2 }]}>Nombre</Text>
              <Text style={[styles.headerText, { flex: 3 }]}>Correo</Text>
              <Text style={[styles.headerText, { flex: 1 }]}>Estado</Text>
              <Text style={[styles.headerText, { flex: 1 }]}>Acciones</Text>
            </View>
            <TouchableOpacity style={styles.importButton} onPress={importarDatosDesdeCSV}>
  <Text style={styles.importText}>Importar datos desde CSV</Text>
</TouchableOpacity>

            {loading ? (
              <ActivityIndicator size="large" color="#ef4444" />
            ) : (
              <FlatList
                data={filteredUsuarios}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.cardRow}>
                    <Text style={[styles.cellText, { flex: 2 }]}>{item.nombre}</Text>
                    <Text style={[styles.cellText, { flex: 3 }]}>{item.correo_institucional}</Text>
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
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  mainWrapper: { flexDirection: 'row', flex: 1 },
  contentWrapper: { flex: 1, padding: 16 },
  scrollView: { flex: 1 },
  scrollContent: { paddingBottom: 32 },
  headerSection: { marginBottom: 16 },
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
  summaryTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  summaryCount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
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
  badgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  cellText: {
    fontSize: 14,
    color: '#111827',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
 importButton: {
  backgroundColor: '#2563eb',
  padding: 10,
  borderRadius: 8,
  marginVertical: 12,
},

importText: {
  color: '#fff',
  textAlign: 'center',
  fontWeight: 'bold',
},

});
