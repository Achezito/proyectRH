import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Dimensions,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import Icon from "react-native-vector-icons/MaterialIcons";

import DocenteCard from "../../components/docenteCard";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import FiltrosAvanzados from "../../components/FiltrosAvanzadosDocente";
import ModalDetallesDocente from "../../components/ModalDetallesDocentes";
import ModalEditarDocente from "../../components/ModalEditarDocente";
import * as FileSystem from "expo-file-system";
import * as Sharing from "expo-sharing";

const API_BASE_URL = "http://10.194.1.108:5000";
const { width, height } = Dimensions.get("window");

const DocentesScreen = () => {
  const navigation = useNavigation();
  const [docentes, setDocentes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showDetalles, setShowDetalles] = useState(false);
  const [docenteSeleccionado, setDocenteSeleccionado] = useState(null);
  const [showModalEditar, setShowModalEditar] = useState(false);
  const [docenteAEditar, setDocenteAEditar] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const scrollY = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef(null);

  // Estados para búsqueda con debounce
  const [searchTimeout, setSearchTimeout] = useState(null);

  // Filtros basados en la BD real
  const [filtros, setFiltros] = useState({
    tipo_contrato: "",
    tipo_colaborador: "",
    estado: "",
    docencia: "",
  });

  const [paginacion, setPaginacion] = useState({
    page: 1,
    per_page: 20,
    total: 0,
    total_pages: 1,
    has_next: false,
    has_prev: false,
  });

  const [estadisticas, setEstadisticas] = useState({
    total: 0,
    activos: 0,
    inactivos: 0,
    pendientes: 0,
    con_cumpleanos: 0,
    sin_cumpleanos: 0,
  });

  const [filtrosDisponibles, setFiltrosDisponibles] = useState({
    tipos_contrato: [],
    tipos_colaborador: [],
    estados: [],
    docencias: [],
    periodos_activos: [],
  });

  // Efecto para cargar filtros disponibles al inicio
  useEffect(() => {
    cargarFiltrosDisponibles();
  }, []);

  // Cargar filtros disponibles desde la API
  const cargarFiltrosDisponibles = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/adminDocente/filtros/disponibles`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFiltrosDisponibles(data.data);
        }
      }
    } catch (error) {
      console.error("Error cargando filtros:", error);
    }
  };

  // Cargar docentes con filtros y paginación
  const cargarDocentes = async (
    page = 1,
    aplicarFiltros = false,
    search = null
  ) => {
    try {
      if (page === 1) {
        setLoading(true);
      }

      // Construir parámetros de consulta
      const params = new URLSearchParams({
        page: page.toString(),
        per_page: paginacion.per_page.toString(),
      });

      const searchValue = search !== null ? search : searchText;
      if (searchValue.trim()) {
        params.append("search", searchValue.trim());
      }

      if (filtros.tipo_contrato)
        params.append("tipo_contrato", filtros.tipo_contrato);
      if (filtros.tipo_colaborador)
        params.append("tipo_colaborador", filtros.tipo_colaborador);
      if (filtros.estado) params.append("estado", filtros.estado);
      if (filtros.docencia) params.append("docencia", filtros.docencia);

      const response = await fetch(
        `${API_BASE_URL}/adminDocente/docentes?${params.toString()}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Error en la respuesta del servidor");
      }

      if (aplicarFiltros || page === 1) {
        setDocentes(data.data || []);
      } else {
        setDocentes((prev) => [...prev, ...(data.data || [])]);
      }

      setPaginacion(
        data.pagination || {
          page: page,
          per_page: 20,
          total: 0,
          total_pages: 1,
          has_next: false,
          has_prev: false,
        }
      );

      if (data.statistics) {
        setEstadisticas((prev) => ({
          ...prev,
          ...data.statistics,
        }));
      }
    } catch (error) {
      console.error("Error cargando docentes:", error);
      Alert.alert(
        "Error",
        error.message ||
          "No se pudieron cargar los docentes. Verifica tu conexión."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
      setInitialLoading(false);
    }
  };

  // Búsqueda con debounce
  const handleSearchChange = (text) => {
    setSearchText(text);

    // Limpiar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Establecer nuevo timeout
    const timeout = setTimeout(() => {
      cargarDocentes(1, true, text);
    }, 500);

    setSearchTimeout(timeout);
  };

  // Cargar más datos al hacer scroll
  const cargarMasDocentes = () => {
    if (paginacion.has_next && !loading && !refreshing) {
      cargarDocentes(paginacion.page + 1, false);
    }
  };

  // Refresh control
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    cargarDocentes(1, true);
  }, []);

  // Aplicar filtros avanzados
  const aplicarFiltros = (nuevosFiltros) => {
    setFiltros(nuevosFiltros);
    setShowFilters(false);
    cargarDocentes(1, true);
  };

  // Limpiar todos los filtros
  const limpiarFiltros = () => {
    setFiltros({
      tipo_contrato: "",
      tipo_colaborador: "",
      estado: "",
      docencia: "",
    });
    setSearchText("");
    cargarDocentes(1, true);
  };

  // Ver detalles del docente
  const verDetallesDocente = async (docente) => {
    try {
      // Cargar información detallada del docente
      const response = await fetch(
        `${API_BASE_URL}/adminDocente/docentes/${docente.id}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setDocenteSeleccionado(data.data);
          setShowDetalles(true);
        } else {
          setDocenteSeleccionado(docente);
          setShowDetalles(true);
        }
      } else {
        setDocenteSeleccionado(docente);
        setShowDetalles(true);
      }
    } catch (error) {
      console.error("Error cargando detalles:", error);
      setDocenteSeleccionado(docente);
      setShowDetalles(true);
    }
  };

  // Editar docente
  const handleEditarDocente = (docente) => {
    setDocenteAEditar(docente);
    setShowModalEditar(true);
  };

  // Eliminar docente
  const handleEliminarDocente = async (docenteId) => {
    Alert.alert(
      "Eliminar Docente",
      "¿Está seguro de eliminar este docente? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(
                `${API_BASE_URL}/adminDocente/docentes/${docenteId}`,
                {
                  method: "DELETE",
                  headers: { "Content-Type": "application/json" },
                }
              );

              if (response.ok) {
                Alert.alert("Éxito", "Docente eliminado correctamente", [
                  {
                    text: "OK",
                    onPress: () => cargarDocentes(paginacion.page, true),
                  },
                ]);
              } else {
                throw new Error("Error al eliminar docente");
              }
            } catch (error) {
              console.error("Error eliminando docente:", error);
              Alert.alert("Error", "No se pudo eliminar el docente");
            }
          },
        },
      ]
    );
  };

  // Desactivar/Activar docente
  const handleDesactivarDocente = async (docenteId, estadoActual) => {
    const esActivo = estadoActual?.toLowerCase() === "activo";
    const accion = esActivo ? "desactivar" : "activar";
    const textoAccion = esActivo ? "desactivado" : "activado";

    Alert.alert(
      `${esActivo ? "Desactivar" : "Activar"} Docente`,
      `¿Está seguro de ${accion} este docente? ${
        esActivo
          ? "No podrá acceder al sistema."
          : "Podrá acceder al sistema nuevamente."
      }`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: esActivo ? "Desactivar" : "Activar",
          style: esActivo ? "destructive" : "default",
          onPress: async () => {
            try {
              const endpoint = esActivo
                ? `${API_BASE_URL}/adminDocente/docentes/${docenteId}/desactivar`
                : `${API_BASE_URL}/adminDocente/docentes/${docenteId}/activar`;

              const response = await fetch(endpoint, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
              });

              if (response.ok) {
                const data = await response.json();
                Alert.alert(
                  "Éxito",
                  data.message || `Docente ${textoAccion} correctamente`,
                  [
                    {
                      text: "OK",
                      onPress: () => cargarDocentes(paginacion.page, true),
                    },
                  ]
                );
              } else {
                throw new Error(`Error ${response.status}`);
              }
            } catch (error) {
              console.error(`Error ${accion} docente:`, error);
              Alert.alert("Error", `No se pudo ${accion} el docente`);
            }
          },
        },
      ]
    );
  };

  // Exportar docentes a CSV
  const handleExportarDocentes = async () => {
    if (exporting) return;

    try {
      setExporting(true);

      const params = new URLSearchParams();
      if (searchText.trim()) params.append("search", searchText.trim());
      if (filtros.tipo_contrato)
        params.append("tipo_contrato", filtros.tipo_contrato);
      if (filtros.tipo_colaborador)
        params.append("tipo_colaborador", filtros.tipo_colaborador);
      if (filtros.estado) params.append("estado", filtros.estado);
      if (filtros.docencia) params.append("docencia", filtros.docencia);

      const response = await fetch(
        `${API_BASE_URL}/adminDocente/docentes/exportar?${params.toString()}`,
        {
          method: "GET",
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      // Obtener el blob del archivo
      const blob = await response.blob();

      // Crear URL del blob
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Nombre del archivo con fecha
      const fecha = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      link.download = `docentes_exportados_${fecha}.csv`;

      // Simular clic para descargar
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Liberar URL
      window.URL.revokeObjectURL(url);

      Alert.alert("Éxito", "Archivo descargado correctamente", [
        { text: "OK" },
      ]);
    } catch (error) {
      console.error("Error exportando docentes:", error);
      Alert.alert(
        "Error",
        "No se pudo exportar el archivo. Intenta nuevamente."
      );
    } finally {
      setExporting(false);
    }
  };

  // Guardar cambios del docente
  const handleGuardarDocente = async (docenteActualizado) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/adminDocente/docentes/${docenteActualizado.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(docenteActualizado),
        }
      );

      if (response.ok) {
        const data = await response.json();

        // Mostrar mensaje de éxito
        Alert.alert(
          "Éxito",
          data.message || "Docente actualizado correctamente",
          [
            {
              text: "OK",
              onPress: async () => {
                try {
                  // 1. Cerrar el modal primero
                  setShowModalEditar(false);

                  // 2. Recargar la lista de docentes (página actual)
                  await cargarDocentes(paginacion.page, true);

                  // 3. Recargar las estadísticas completas INMEDIATAMENTE
                  await cargarEstadisticasCompletas();
                } catch (error) {
                  console.error("Error recargando datos:", error);
                }
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar");
      }
    } catch (error) {
      console.error("Error actualizando docente:", error);
      Alert.alert(
        "Error",
        error.message || "No se pudo actualizar el docente. Verifica los datos."
      );
    }
  };

  // Función separada para cargar estadísticas completas
  const cargarEstadisticasCompletas = async () => {
    try {
      console.log("📊 Cargando estadísticas completas...");
      const response = await fetch(
        `${API_BASE_URL}/adminDocente/docentes/estadisticas/completas`
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          console.log("✅ Estadísticas actualizadas:", data.data);
          setEstadisticas((prev) => ({ ...prev, ...data.data }));
        } else {
          console.warn("⚠️ Respuesta de estadísticas sin datos:", data);
        }
      } else {
        console.error("❌ Error HTTP al cargar estadísticas:", response.status);
      }
    } catch (error) {
      console.error("❌ Error cargando estadísticas:", error);
    }
  };

  // Cargar datos cuando la pantalla está enfocada
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const cargarDatosIniciales = async () => {
        try {
          if (!isActive) return;

          // Cargar docentes iniciales
          await cargarDocentes();

          // Cargar estadísticas completas
          await cargarEstadisticasCompletas();
        } catch (error) {
          console.error("Error en carga inicial:", error);
        }
      };

      cargarDatosIniciales();

      return () => {
        isActive = false;
        if (searchTimeout) {
          clearTimeout(searchTimeout);
        }
      };
    }, [])
  );

  // También puedes añadir un useEffect para refrescar estadísticas cuando se carga la pantalla
  useEffect(() => {
    const intervalId = setInterval(() => {
      // Opcional: Refrescar estadísticas cada 30 segundos
      cargarEstadisticasCompletas();
    }, 30000);

    return () => clearInterval(intervalId);
  }, []);
  // Header animado basado en scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [180, 100],
    extrapolate: "clamp",
  });

  // Renderizar header con búsqueda y estadísticas
  const renderHeader = () => (
    <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          ref={searchInputRef}
          style={styles.searchInput}
          placeholder="Buscar docentes..."
          value={searchText}
          onChangeText={handleSearchChange}
          returnKeyType="search"
          onSubmitEditing={() => cargarDocentes(1, true)}
        />
        {searchText ? (
          <TouchableOpacity
            onPress={() => {
              setSearchText("");
              cargarDocentes(1, true, "");
            }}
            style={styles.clearButton}
          >
            <Icon name="close" size={20} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Estadísticas */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{estadisticas.total || 0}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statCard, styles.statActive]}>
          <Text style={styles.statNumber}>{estadisticas.activos || 0}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={[styles.statCard, styles.statInactive]}>
          <Text style={styles.statNumber}>{estadisticas.inactivos || 0}</Text>
          <Text style={styles.statLabel}>Inactivos</Text>
        </View>
        <View style={[styles.statCard, styles.statPending]}>
          <Text style={styles.statNumber}>{estadisticas.pendientes || 0}</Text>
          <Text style={styles.statLabel}>Pendientes</Text>
        </View>
      </View>
    </Animated.View>
  );

  // Renderizar filtros aplicados
  const renderFiltrosAplicados = () => {
    const filtrosActivos = Object.values(filtros).filter((f) => f).length;
    if (filtrosActivos === 0) return null;

    return (
      <View style={styles.filtrosContainer}>
        <Text style={styles.filtrosTitle}>Filtros aplicados:</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.filtrosList}>
            {filtros.tipo_contrato && (
              <View style={styles.filtroTag}>
                <Text style={styles.filtroTagText}>
                  {filtrosDisponibles.tipos_contrato?.find(
                    (t) => t.id.toString() === filtros.tipo_contrato
                  )?.tipo_contrato || filtros.tipo_contrato}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFiltros((prev) => ({ ...prev, tipo_contrato: "" }));
                    cargarDocentes(1, true);
                  }}
                >
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {filtros.tipo_colaborador && (
              <View style={styles.filtroTag}>
                <Text style={styles.filtroTagText}>
                  {filtros.tipo_colaborador}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    setFiltros((prev) => ({ ...prev, tipo_colaborador: "" }));
                    cargarDocentes(1, true);
                  }}
                >
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {filtros.estado && (
              <View style={styles.filtroTag}>
                <Text style={styles.filtroTagText}>{filtros.estado}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setFiltros((prev) => ({ ...prev, estado: "" }));
                    cargarDocentes(1, true);
                  }}
                >
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            {filtros.docencia && (
              <View style={styles.filtroTag}>
                <Text style={styles.filtroTagText}>{filtros.docencia}</Text>
                <TouchableOpacity
                  onPress={() => {
                    setFiltros((prev) => ({ ...prev, docencia: "" }));
                    cargarDocentes(1, true);
                  }}
                >
                  <Icon name="close" size={14} color="#fff" />
                </TouchableOpacity>
              </View>
            )}

            <TouchableOpacity
              style={styles.limpiarTodoBtn}
              onPress={limpiarFiltros}
            >
              <Text style={styles.limpiarFiltrosText}>Limpiar todo</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Renderizar footer para carga infinita
  const renderFooter = () => {
    if (!paginacion.has_next || docentes.length === 0) return null;

    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#3498db" />
        <Text style={styles.footerText}>
          {loading ? "Cargando más docentes..." : "Desliza para cargar más"}
        </Text>
      </View>
    );
  };

  // Renderizar estado vacío
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people-outline" size={80} color="#bdc3c7" />
      <Text style={styles.emptyTitle}>
        {searchText || Object.values(filtros).some((f) => f)
          ? "No hay resultados"
          : "No hay docentes registrados"}
      </Text>
      <Text style={styles.emptyText}>
        {searchText || Object.values(filtros).some((f) => f)
          ? "No se encontraron docentes con los filtros aplicados"
          : "Comienza agregando nuevos docentes al sistema"}
      </Text>
      {(searchText || Object.values(filtros).some((f) => f)) && (
        <TouchableOpacity style={styles.limpiarBtn} onPress={limpiarFiltros}>
          <Icon name="filter-alt-off" size={20} color="#fff" />
          <Text style={styles.limpiarBtnText}>Limpiar filtros</Text>
        </TouchableOpacity>
      )}
      {!searchText && !Object.values(filtros).some((f) => f) && (
        <TouchableOpacity
          style={styles.addEmptyBtn}
          onPress={() => navigation.navigate("NuevoDocente")}
        >
          <Icon name="person-add" size={20} color="#fff" />
          <Text style={styles.addEmptyBtnText}>Agregar primer docente</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (initialLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />
        <View style={styles.loadingFullScreen}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Cargando docentes...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#f8f9fa" />

      {renderHeader()}
      {renderFiltrosAplicados()}

      {/* Barra de acciones */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="filter-list" size={20} color="#3498db" />
          <Text style={styles.filterBtnText}>Filtros</Text>
          {(filtros.tipo_contrato ||
            filtros.tipo_colaborador ||
            filtros.estado ||
            filtros.docencia) && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>
                {Object.values(filtros).filter((f) => f).length}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.exportBtn}
          onPress={handleExportarDocentes}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator size="small" color="#27ae60" />
          ) : (
            <Icon name="download" size={20} color="#27ae60" />
          )}
          <Text style={[styles.exportBtnText, exporting && { opacity: 0.7 }]}>
            {exporting ? "Exportando..." : "Exportar"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate("NuevoDocente")}
        >
          <Icon name="person-add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Nuevo</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de docentes */}
      {loading && docentes.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3498db" />
          <Text style={styles.loadingText}>Cargando docentes...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={docentes}
          renderItem={({ item }) => (
            <DocenteCard
              docente={item}
              onPress={() => verDetallesDocente(item)}
              onEdit={() => handleEditarDocente(item)}
              onDelete={() => handleEliminarDocente(item.id)}
              onDesactivar={() => handleDesactivarDocente(item.id, item.estado)}
            />
          )}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#3498db"]}
              tintColor="#3498db"
              title="Actualizando..."
              titleColor="#3498db"
            />
          }
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          onEndReached={cargarMasDocentes}
          onEndReachedThreshold={0.3}
          ListFooterComponent={renderFooter}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={
            docentes.length === 0 ? styles.emptyListContent : styles.listContent
          }
          showsVerticalScrollIndicator={false}
          initialNumToRender={10}
          maxToRenderPerBatch={20}
          windowSize={10}
        />
      )}

      {/* Modal de filtros */}
      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
        statusBarTranslucent={true}
      >
        <FiltrosAvanzados
          filtros={filtros}
          filtrosDisponibles={filtrosDisponibles}
          onAplicar={aplicarFiltros}
          onCancelar={() => setShowFilters(false)}
          onLimpiar={limpiarFiltros}
        />
      </Modal>

      {/* Modal de detalles */}
      <ModalDetallesDocente
        visible={showDetalles}
        docente={docenteSeleccionado}
        onClose={() => setShowDetalles(false)}
        onEditar={handleEditarDocente}
        onDesactivar={(id) => {
          if (docenteSeleccionado) {
            handleDesactivarDocente(id, docenteSeleccionado.estado);
          }
        }}
      />

      {/* Modal de edición */}
      <ModalEditarDocente
        visible={showModalEditar}
        docente={docenteAEditar}
        filtrosDisponibles={filtrosDisponibles}
        onClose={() => setShowModalEditar(false)}
        onGuardar={handleGuardarDocente}
        onDesactivar={(id) => {
          if (docenteAEditar) {
            handleDesactivarDocente(id, docenteAEditar.estado);
          }
        }}
      />
    </SafeAreaView>
  );
};

// ==================== ESTILOS ====================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  loadingFullScreen: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 10,
    paddingBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    overflow: "hidden",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f3f4",
    borderRadius: 10,
    paddingHorizontal: 12,
    marginTop: 12,
    marginBottom: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 4,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    marginHorizontal: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e9ecef",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statActive: {
    backgroundColor: "#e8f5e9",
    borderColor: "#c8e6c9",
  },
  statInactive: {
    backgroundColor: "#ffebee",
    borderColor: "#ffcdd2",
  },
  statPending: {
    backgroundColor: "#fff3e0",
    borderColor: "#ffe0b2",
  },
  statNumber: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2c3e50",
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    fontWeight: "500",
  },
  filtrosContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  filtrosTitle: {
    fontSize: 14,
    fontWeight: "500",
    color: "#5d6d7e",
    marginBottom: 8,
  },
  filtrosList: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 16,
  },
  filtroTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 8,
  },
  filtroTagText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "500",
    marginRight: 6,
  },
  limpiarTodoBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#e74c3c",
  },
  limpiarFiltrosText: {
    color: "#e74c3c",
    fontSize: 13,
    fontWeight: "500",
  },
  actionBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  filterBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3498db",
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
    position: "relative",
  },
  filterBtnText: {
    color: "#3498db",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  exportBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#27ae60",
    flex: 1,
    marginHorizontal: 4,
    justifyContent: "center",
  },
  exportBtnText: {
    color: "#27ae60",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    justifyContent: "center",
  },
  addBtnText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 6,
  },
  filterBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: "#e74c3c",
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "bold",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#7f8c8d",
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2c3e50",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: "#7f8c8d",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  limpiarBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#3498db",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  limpiarBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  addEmptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2ecc71",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addEmptyBtnText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  footerLoader: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 20,
  },
  footerText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#7f8c8d",
  },
});

export default DocentesScreen;
