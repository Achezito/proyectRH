import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Modal,
  TextInput,
  Switch,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome, MaterialIcons } from "@expo/vector-icons";
import { styles } from "./styles";

// Datos de ejemplo actualizados según el formato
const mockData = {
  incidencias: [
    {
      id: 1,
      tipo: "retardo",
      motivo: "Tráfico pesado",
      fecha: "2024-01-15",
      estado: "aprobado",
      minutos: 15,
    },
    {
      id: 2,
      tipo: "salida_anticipada",
      motivo: "Cita médica",
      fecha: "2024-01-20",
      estado: "pendiente",
      minutos: 30,
    },
    {
      id: 3,
      tipo: "retardo_mayor",
      motivo: "Problemas familiares",
      fecha: "2024-02-01",
      estado: "aprobado",
      minutos: 18,
    },
  ],
  diasEconomicos: [
    {
      id: 1,
      motivo: "Vacaciones familiares",
      fecha: "2024-01-10",
      estado: "aprobado",
      tipo: "economico",
    },
    {
      id: 2,
      motivo: "Descanso personal",
      fecha: "2024-02-05",
      estado: "pendiente",
      tipo: "economico",
    },
  ],
  permisosEspeciales: [
    {
      id: 1,
      motivo: "Permiso de paternidad",
      fecha: "2024-03-01",
      estado: "aprobado",
      tipo: "paternidad",
    },
  ],
};

const IncidenciasTab = ({ docenteId, userData }) => {
  const [incidencias, setIncidencias] = useState([]);
  const [diasEconomicos, setDiasEconomicos] = useState([]);
  const [permisosEspeciales, setPermisosEspeciales] = useState([]);

  // Modales
  const [showIncidenciaModal, setShowIncidenciaModal] = useState(false);
  const [showDiaEconomicoModal, setShowDiaEconomicoModal] = useState(false);
  const [showCumpleanosModal, setShowCumpleanosModal] = useState(false);
  const [showPermisoEspecialModal, setShowPermisoEspecialModal] =
    useState(false);

  const [stats, setStats] = useState({
    totalIncidencias: 0,
    incidenciasPendientes: 0,
    diasEconomicosUsados: 0,
    diasDisponibles: 0,
    diasCumpleanos: 1, // Siempre 1 día de cumpleaños
  });

  // Formularios
  const [nuevaIncidencia, setNuevaIncidencia] = useState({
    tipo: "retardo",
    motivo: "",
    fecha: new Date().toISOString().split("T")[0],
    horaEntrada: "",
    horaSalida: "",
    minutos: 0,
  });

  const [nuevoDiaEconomico, setNuevoDiaEconomico] = useState({
    motivo: "",
    fecha: new Date().toISOString().split("T")[0],
    tipo: "economico",
  });

  const [diaCumpleanos, setDiaCumpleanos] = useState({
    fechaCumpleanos: "",
    fechaDisfrute: "",
    motivo: "Día de cumpleaños según cláusula 27 del CCT",
  });

  const [nuevoPermisoEspecial, setNuevoPermisoEspecial] = useState({
    tipo: "paternidad",
    motivo: "",
    fecha: new Date().toISOString().split("T")[0],
    duracion: 1,
  });

  useEffect(() => {
    loadIncidenciasData();
  }, []);

  const loadIncidenciasData = () => {
    setIncidencias(mockData.incidencias);
    setDiasEconomicos(mockData.diasEconomicos);
    setPermisosEspeciales(mockData.permisosEspeciales);

    const usadas = mockData.diasEconomicos.filter(
      (d) => d.estado === "aprobado"
    ).length;
    const pendientes = mockData.incidencias.filter(
      (i) => i.estado === "pendiente"
    ).length;

    // Calcular límite según tipo de contrato
    const diasLimite = userData?.tipo_contrato === "Anual" ? 30 : 15;

    setStats({
      totalIncidencias: mockData.incidencias.length,
      incidenciasPendientes: pendientes,
      diasEconomicosUsados: usadas,
      diasDisponibles: diasLimite - usadas,
      diasCumpleanos: 1,
    });
  };

  // HANDLERS PARA CADA TIPO DE SOLICITUD
  const handleNuevaIncidencia = () => {
    if (!nuevaIncidencia.motivo.trim()) {
      Alert.alert("Error", "Por favor ingresa el motivo de la incidencia");
      return;
    }

    const nueva = {
      id: incidencias.length + 1,
      ...nuevaIncidencia,
      estado: "pendiente",
    };

    setIncidencias([...incidencias, nueva]);
    setStats((s) => ({
      ...s,
      totalIncidencias: s.totalIncidencias + 1,
      incidenciasPendientes: s.incidenciasPendientes + 1,
    }));

    Alert.alert("Éxito", "Incidencia registrada correctamente");
    setNuevaIncidencia({
      tipo: "retardo",
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      horaEntrada: "",
      horaSalida: "",
      minutos: 0,
    });
    setShowIncidenciaModal(false);
  };

  const handleNuevoDiaEconomico = () => {
    if (!nuevoDiaEconomico.motivo.trim()) {
      Alert.alert("Error", "Por favor ingresa el motivo del día económico");
      return;
    }

    if (stats.diasDisponibles <= 0) {
      Alert.alert("Error", "No tienes días económicos disponibles");
      return;
    }

    const nuevo = {
      id: diasEconomicos.length + 1,
      ...nuevoDiaEconomico,
      estado: "pendiente",
    };

    setDiasEconomicos([...diasEconomicos, nuevo]);
    setStats((s) => ({ ...s, diasDisponibles: s.diasDisponibles - 1 }));

    Alert.alert("Éxito", "Día económico solicitado correctamente");
    setNuevoDiaEconomico({
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      tipo: "economico",
    });
    setShowDiaEconomicoModal(false);
  };

  const handleDiaCumpleanos = () => {
    if (!diaCumpleanos.fechaCumpleanos) {
      Alert.alert("Error", "Por favor ingresa la fecha de tu cumpleaños");
      return;
    }

    const nuevo = {
      id: Date.now(),
      tipo: "cumpleanos",
      motivo: diaCumpleanos.motivo,
      fecha: diaCumpleanos.fechaDisfrute || diaCumpleanos.fechaCumpleanos,
      estado: "pendiente",
      fechaCumpleanos: diaCumpleanos.fechaCumpleanos,
    };

    Alert.alert("Éxito", "Solicitud de día de cumpleaños registrada");
    setDiaCumpleanos({
      fechaCumpleanos: "",
      fechaDisfrute: "",
      motivo: "Día de cumpleaños según cláusula 27 del CCT",
    });
    setShowCumpleanosModal(false);
  };

  const handlePermisoEspecial = () => {
    if (!nuevoPermisoEspecial.motivo.trim()) {
      Alert.alert("Error", "Por favor ingresa el motivo del permiso");
      return;
    }

    const nuevo = {
      id: permisosEspeciales.length + 1,
      ...nuevoPermisoEspecial,
      estado: "pendiente",
    };

    setPermisosEspeciales([...permisosEspeciales, nuevo]);
    Alert.alert("Éxito", "Permiso especial solicitado correctamente");
    setNuevoPermisoEspecial({
      tipo: "paternidad",
      motivo: "",
      fecha: new Date().toISOString().split("T")[0],
      duracion: 1,
    });
    setShowPermisoEspecialModal(false);
  };

  const getEstadoColor = (estado) => {
    switch (estado) {
      case "aprobado":
        return "#10b981";
      case "pendiente":
        return "#f59e0b";
      case "rechazado":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  const getEstadoText = (estado) => {
    switch (estado) {
      case "aprobado":
        return "Aprobado";
      case "pendiente":
        return "Pendiente";
      case "rechazado":
        return "Rechazado";
      default:
        return estado;
    }
  };

  const getTipoIncidenciaText = (tipo) => {
    switch (tipo) {
      case "retardo":
        return "Retardo (11-15 min)";
      case "retardo_mayor":
        return "Retardo mayor (16-20 min)";
      case "salida_anticipada":
        return "Salida anticipada";
      default:
        return tipo;
    }
  };

  const getTipoPermisoText = (tipo) => {
    switch (tipo) {
      case "paternidad":
        return "Paternidad";
      case "defuncion":
        return "Defunción";
      case "titulacion":
        return "Titulación";
      default:
        return tipo;
    }
  };

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.tabContent}>
        {/* ESTADÍSTICAS */}
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#e0f2fe" }]}>
              <Ionicons
                name="document-text-outline"
                size={24}
                color="#0369a1"
              />
            </View>
            <Text style={styles.statNumber}>{stats.totalIncidencias}</Text>
            <Text style={styles.statLabel}>Incidencias</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#fef3c7" }]}>
              <Ionicons name="time-outline" size={24} color="#d97706" />
            </View>
            <Text style={styles.statNumber}>{stats.incidenciasPendientes}</Text>
            <Text style={styles.statLabel}>Pendientes</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
              <FontAwesome name="calendar-check-o" size={20} color="#16a34a" />
            </View>
            <Text style={styles.statNumber}>{stats.diasEconomicosUsados}</Text>
            <Text style={styles.statLabel}>Días Usados</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIcon, { backgroundColor: "#f3e8ff" }]}>
              <FontAwesome name="calendar-plus-o" size={20} color="#7c3aed" />
            </View>
            <Text style={styles.statNumber}>{stats.diasDisponibles}</Text>
            <Text style={styles.statLabel}>Días Disponibles</Text>
          </View>
        </View>

        {/* BOTONES DE ACCIÓN MEJORADOS */}
        <View style={styles.actionGrid}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#4f46e5" }]}
            onPress={() => setShowIncidenciaModal(true)}
          >
            <Ionicons name="time-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Nueva Incidencia</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#10b981" }]}
            onPress={() => setShowDiaEconomicoModal(true)}
          >
            <FontAwesome name="calendar-plus-o" size={18} color="white" />
            <Text style={styles.actionButtonText}>Día Económico</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#f59e0b" }]}
            onPress={() => setShowCumpleanosModal(true)}
          >
            <Ionicons name="gift-outline" size={20} color="white" />
            <Text style={styles.actionButtonText}>Cumpleaños</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: "#ec4899" }]}
            onPress={() => setShowPermisoEspecialModal(true)}
          >
            <MaterialIcons name="family-restroom" size={20} color="white" />
            <Text style={styles.actionButtonText}>Permiso Especial</Text>
          </TouchableOpacity>
        </View>

        {/* LISTA DE INCIDENCIAS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Incidencias</Text>
          {incidencias.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons
                name="document-text-outline"
                size={48}
                color="#cbd5e1"
              />
              <Text style={styles.emptyStateText}>
                No hay incidencias registradas
              </Text>
            </View>
          ) : (
            <FlatList
              data={incidencias}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemTitle}>
                        {getTipoIncidenciaText(item.tipo)}
                      </Text>
                      <Text style={styles.listItemSubtitle}>{item.motivo}</Text>
                    </View>
                    <View
                      style={[
                        styles.estadoBadge,
                        { backgroundColor: getEstadoColor(item.estado) },
                      ]}
                    >
                      <Text style={styles.estadoText}>
                        {getEstadoText(item.estado)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.listItemDetails}>
                    <Text style={styles.listItemDetail}>
                      <Ionicons
                        name="calendar-outline"
                        size={14}
                        color="#64748b"
                      />{" "}
                      {item.fecha}
                    </Text>
                    {item.minutos > 0 && (
                      <Text style={styles.listItemDetail}>
                        <Ionicons
                          name="time-outline"
                          size={14}
                          color="#64748b"
                        />
                        {item.minutos} minutos
                      </Text>
                    )}
                  </View>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </View>

        {/* LISTA DE DÍAS ECONÓMICOS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Días Económicos</Text>
          {diasEconomicos.length === 0 ? (
            <View style={styles.emptyState}>
              <FontAwesome name="calendar-o" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>
                No hay días económicos solicitados
              </Text>
            </View>
          ) : (
            <FlatList
              data={diasEconomicos}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemTitle}>{item.motivo}</Text>
                      <Text style={styles.listItemSubtitle}>Día económico</Text>
                    </View>
                    <View
                      style={[
                        styles.estadoBadge,
                        { backgroundColor: getEstadoColor(item.estado) },
                      ]}
                    >
                      <Text style={styles.estadoText}>
                        {getEstadoText(item.estado)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.listItemDetail}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#64748b"
                    />{" "}
                    {item.fecha}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </View>

        {/* LISTA DE PERMISOS ESPECIALES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permisos Especiales</Text>
          {permisosEspeciales.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="family-restroom" size={48} color="#cbd5e1" />
              <Text style={styles.emptyStateText}>
                No hay permisos especiales
              </Text>
            </View>
          ) : (
            <FlatList
              data={permisosEspeciales}
              scrollEnabled={false}
              renderItem={({ item }) => (
                <View style={styles.listItem}>
                  <View style={styles.listItemHeader}>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemTitle}>
                        {getTipoPermisoText(item.tipo)}
                      </Text>
                      <Text style={styles.listItemSubtitle}>{item.motivo}</Text>
                    </View>
                    <View
                      style={[
                        styles.estadoBadge,
                        { backgroundColor: getEstadoColor(item.estado) },
                      ]}
                    >
                      <Text style={styles.estadoText}>
                        {getEstadoText(item.estado)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.listItemDetail}>
                    <Ionicons
                      name="calendar-outline"
                      size={14}
                      color="#64748b"
                    />{" "}
                    {item.fecha}
                  </Text>
                </View>
              )}
              keyExtractor={(item) => item.id.toString()}
            />
          )}
        </View>
      </View>

      {/* MODALES - Los veremos en la siguiente respuesta por longitud */}
      <IncidenciaModal
        visible={showIncidenciaModal}
        onClose={() => setShowIncidenciaModal(false)}
        onSubmit={handleNuevaIncidencia}
        data={nuevaIncidencia}
        setData={setNuevaIncidencia}
      />

      <DiaEconomicoModal
        visible={showDiaEconomicoModal}
        onClose={() => setShowDiaEconomicoModal(false)}
        onSubmit={handleNuevoDiaEconomico}
        data={nuevoDiaEconomico}
        setData={setNuevoDiaEconomico}
        diasDisponibles={stats.diasDisponibles}
      />

      <CumpleanosModal
        visible={showCumpleanosModal}
        onClose={() => setShowCumpleanosModal(false)}
        onSubmit={handleDiaCumpleanos}
        data={diaCumpleanos}
        setData={setDiaCumpleanos}
      />

      <PermisoEspecialModal
        visible={showPermisoEspecialModal}
        onClose={() => setShowPermisoEspecialModal(false)}
        onSubmit={handlePermisoEspecial}
        data={nuevoPermisoEspecial}
        setData={setNuevoPermisoEspecial}
      />
    </ScrollView>
  );
};

// Componentes de Modal separados por claridad (los pondré en la siguiente respuesta)
const IncidenciaModal = ({ visible, onClose, onSubmit, data, setData }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Nueva Incidencia</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalSubtitle}>Tipo de Incidencia</Text>
        <View style={styles.radioGroup}>
          {[
            { value: "retardo", label: "Retardo (11-15 min)" },
            { value: "retardo_mayor", label: "Retardo mayor (16-20 min)" },
            { value: "salida_anticipada", label: "Salida anticipada" },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioOption,
                data.tipo === option.value && styles.radioOptionSelected,
              ]}
              onPress={() => setData({ ...data, tipo: option.value })}
            >
              <Text
                style={[
                  styles.radioText,
                  data.tipo === option.value && styles.radioTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Motivo de la incidencia"
          value={data.motivo}
          onChangeText={(text) => setData({ ...data, motivo: text })}
          multiline
          numberOfLines={3}
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          value={data.fecha}
          onChangeText={(text) => setData({ ...data, fecha: text })}
          placeholderTextColor="#94a3b8"
        />

        {(data.tipo === "retardo" || data.tipo === "retardo_mayor") && (
          <TextInput
            style={styles.input}
            placeholder="Hora de entrada (HH:MM)"
            value={data.horaEntrada}
            onChangeText={(text) => setData({ ...data, horaEntrada: text })}
            placeholderTextColor="#94a3b8"
          />
        )}

        {data.tipo === "salida_anticipada" && (
          <TextInput
            style={styles.input}
            placeholder="Hora de salida (HH:MM)"
            value={data.horaSalida}
            onChangeText={(text) => setData({ ...data, horaSalida: text })}
            placeholderTextColor="#94a3b8"
          />
        )}

        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
          <Text style={styles.primaryButtonText}>Registrar Incidencia</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

// Continuación de IncidenciasTab.js - Componentes Modal

const DiaEconomicoModal = ({
  visible,
  onClose,
  onSubmit,
  data,
  setData,
  diasDisponibles,
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Solicitar Día Económico</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text style={styles.diasDisponiblesText}>
          Días disponibles:{" "}
          <Text style={styles.diasCount}>{diasDisponibles}</Text>
        </Text>

        <Text style={styles.modalSubtitle}>
          De acuerdo con el contrato colectivo de trabajo, Cláusula 42
        </Text>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Motivo del día económico"
          value={data.motivo}
          onChangeText={(text) => setData({ ...data, motivo: text })}
          multiline
          numberOfLines={4}
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          style={styles.input}
          placeholder="Fecha del día económico (YYYY-MM-DD)"
          value={data.fecha}
          onChangeText={(text) => setData({ ...data, fecha: text })}
          placeholderTextColor="#94a3b8"
        />

        <TouchableOpacity
          style={[
            styles.primaryButton,
            diasDisponibles <= 0 && styles.primaryButtonDisabled,
          ]}
          onPress={onSubmit}
          disabled={diasDisponibles <= 0}
        >
          <Text style={styles.primaryButtonText}>
            {diasDisponibles <= 0
              ? "Sin días disponibles"
              : "Solicitar Día Económico"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const CumpleanosModal = ({ visible, onClose, onSubmit, data, setData }) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Día de Cumpleaños</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalSubtitle}>
          De acuerdo a lo establecido en el contrato colectivo de trabajo,
          cláusula 27
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Fecha de cumpleaños (DD-MM)"
          value={data.fechaCumpleanos}
          onChangeText={(text) => setData({ ...data, fechaCumpleanos: text })}
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          style={styles.input}
          placeholder="Fecha a disfrutar (DD-MM) - Si cae en inhábil"
          value={data.fechaDisfrute}
          onChangeText={(text) => setData({ ...data, fechaDisfrute: text })}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.helpText}>
          * En caso que el cumpleaños corresponda a un día inhábil o fin de
          semana, favor de mencionar el día hábil inmediato siguiente que tomará
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
          <Text style={styles.primaryButtonText}>
            Solicitar Día de Cumpleaños
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const PermisoEspecialModal = ({
  visible,
  onClose,
  onSubmit,
  data,
  setData,
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Permiso Especial</Text>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#64748b" />
          </TouchableOpacity>
        </View>

        <Text style={styles.modalSubtitle}>Tipo de Permiso</Text>
        <View style={styles.radioGroup}>
          {[
            { value: "paternidad", label: "Paternidad" },
            { value: "defuncion", label: "Defunción" },
            { value: "titulacion", label: "Titulación" },
          ].map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.radioOption,
                data.tipo === option.value && styles.radioOptionSelected,
              ]}
              onPress={() => setData({ ...data, tipo: option.value })}
            >
              <Text
                style={[
                  styles.radioText,
                  data.tipo === option.value && styles.radioTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Motivo del permiso (especifique detalles)"
          value={data.motivo}
          onChangeText={(text) => setData({ ...data, motivo: text })}
          multiline
          numberOfLines={3}
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          style={styles.input}
          placeholder="Fecha (YYYY-MM-DD)"
          value={data.fecha}
          onChangeText={(text) => setData({ ...data, fecha: text })}
          placeholderTextColor="#94a3b8"
        />

        <TextInput
          style={styles.input}
          placeholder="Duración en días"
          value={data.duracion.toString()}
          onChangeText={(text) =>
            setData({ ...data, duracion: parseInt(text) || 1 })
          }
          keyboardType="numeric"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.helpText}>
          * Nota: Estos permisos no se descontarán de los días económicos
        </Text>

        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
          <Text style={styles.primaryButtonText}>Solicitar Permiso</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default IncidenciasTab;
