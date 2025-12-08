import React, { useState, useEffect, useCallback, useRef } from "react";
import { ScrollView, View, Text, Alert, RefreshControl } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "./styles";
import { useIncidenciasOperations } from "./hooks/useIncidenciasOperations";
import { useDiasEconomicos } from "./hooks/useDiaEconomicos";
import { useImagePicker } from "./hooks/useImagePicker";
import StatsGrid from "./components/ui/statsGridd";
import ActionButtons from "./components/ui/ActionButtons";
import IncidenciasList from "./components/lists/IncidenciasList";
import DiasEconomicosList from "./components/lists/DiasEconomicosList";
import DiasCumpleanosList from "./components/lists/DiaCumpleañosList";
import PermisosEspecialesList from "./components/lists/PermisosEspecialesList";
import IncidenciaModal from "./components/modals/IncidenciaModal";
import DiaEconomicoModal from "./components/modals/DiaEconomicoModal";
import CumpleanosModal from "./components/modals/CumpleanosModal";
import PermisoEspecialModal from "./components/modals/PermisoEspecialModal";
import ErrorModal from "./components/modals/ErrorModal";
import IncidenciaDetailModal from "./components/modals/incidenciaDetailsModal";
import CumpleanosDetailModal from "./components/modals/CumpleanosDetailModal";
import DiaEconomicoDetailModal from "./components/modals/DiaEconomicoDetail";
import ConfirmationModal from "./components/modals/confirmationModal";

const IncidenciasTab = ({ docenteId, userData }) => {
  // Referencias para control de ejecuciones
  const isMounted = useRef(false);
  const lastFetchTime = useRef(0);
  const isFetching = useRef(false);

  // Hooks personalizados
  const {
    incidencias,
    diasCumpleanos,
    permisosEspeciales,
    stats,
    loading: incidenciasLoading,
    refetch: refetchIncidencias,
    crearIncidencia,
    selectedIncidencia,
    isDetailModalVisible,
    isDeleting,
    openIncidenciaDetail,
    closeIncidenciaDetail,
    deleteIncidencia,
    selectedCumpleanos,
    isCumpleanosDetailVisible,
    openCumpleanosDetail,
    closeCumpleanosDetail,
    deleteCumpleanos,
    showConfirmation,
    incidenciaTipoToDelete,
    confirmDelete,
    cancelDelete,
    error: incidenciasError,
  } = useIncidenciasOperations(docenteId);

  const {
    diasEconomicos,
    estadisticasDias,
    loading: diasEconomicosLoading,
    selectedDiaEconomico,
    isDiaEconomicoDetailVisible,
    deleting: diaEconomicoDeleting,
    refetch: refetchDiasEconomicos,
    solicitarDiaEconomico,
    cancelarSolicitudDiaEconomico,
    openDiaEconomicoDetail,
    closeDiaEconomicoDetail,
    error: diasEconomicosError,
  } = useDiasEconomicos(docenteId);

  const { image, pickImage, clearImage } = useImagePicker();

  // Estados
  const [activeModal, setActiveModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  // Estados combinados
  const loading = incidenciasLoading || diasEconomicosLoading;

  // Manejo de errores
  const handleAuthError = useCallback(async (error) => {
    if (!error?.message) return false;

    const authErrors = ["401", "No autorizado", "token"];
    const isAuthError = authErrors.some((keyword) =>
      error.message.includes(keyword)
    );

    if (isAuthError) {
      const token = await AsyncStorage.getItem("auth_token_data");
      if (!token) {
        Alert.alert(
          "Sesión Expirada",
          "Tu sesión ha expirado. Por favor, inicia sesión nuevamente.",
          [{ text: "OK" }]
        );
        return true;
      }
    }
    return false;
  }, []);

  // Efecto para manejo centralizado de errores
  useEffect(() => {
    if (!isMounted.current) return;

    const checkErrors = async () => {
      if (incidenciasError) await handleAuthError(incidenciasError);
      if (diasEconomicosError) await handleAuthError(diasEconomicosError);
    };

    checkErrors();
  }, [incidenciasError, diasEconomicosError, handleAuthError]);

  // Funciones de UI
  const showError = (message) => {
    setErrorMessage(message);
    setActiveModal("error");
  };

  const closeModal = () => {
    setActiveModal(null);
    clearImage();
  };

  const showSuccessAlert = (title, message) => {
    Alert.alert(title, message);
  };

  // Función para refrescar todos los datos
  const refetchAll = useCallback(async () => {
    if (isFetching.current) return;

    const now = Date.now();
    const MIN_REFRESH_INTERVAL = 3000;

    if (now - lastFetchTime.current < MIN_REFRESH_INTERVAL) {
      return;
    }

    isFetching.current = true;
    lastFetchTime.current = now;

    try {
      setRefreshing(true);
      await Promise.allSettled([refetchIncidencias(), refetchDiasEconomicos()]);
    } catch (error) {
      console.error("Error al refrescar datos:", error);
    } finally {
      setRefreshing(false);
      isFetching.current = false;
    }
  }, [refetchIncidencias, refetchDiasEconomicos]);

  // useFocusEffect optimizado
  useFocusEffect(
    useCallback(() => {
      if (!isMounted.current) {
        isMounted.current = true;
      }

      const timer = setTimeout(() => refetchAll(), 500);
      return () => clearTimeout(timer);
    }, [refetchAll])
  );

  // Efecto de limpieza
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Handlers de acciones
  const handleCreateIncidencia = async (formData) => {
    try {
      await crearIncidencia(formData);
      showSuccessAlert("✅ Éxito", "Incidencia registrada correctamente");
      closeModal();
      refetchIncidencias();
    } catch (error) {
      const isAuthError = await handleAuthError(error);
      if (!isAuthError) {
        showError(error.message);
      }
    }
  };

  const handleSolicitarDiaEconomico = async (formData) => {
    try {
      await solicitarDiaEconomico(formData);
      showSuccessAlert(
        "✅ Éxito",
        "Solicitud de día económico enviada correctamente"
      );
      closeModal();
      refetchDiasEconomicos();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleSolicitarCumpleanos = async () => {
    try {
      await refetchIncidencias();
      showSuccessAlert(
        "✅ Éxito",
        "Solicitud de cumpleaños enviada correctamente"
      );
      closeModal();
    } catch (error) {
      showError(error.message);
    }
  };

  const handleDeleteDiaEconomico = async (solicitudId) => {
    if (!solicitudId) {
      Alert.alert("❌ Error", "ID de solicitud no válido");
      return;
    }

    try {
      const resultado = await cancelarSolicitudDiaEconomico(solicitudId);

      if (resultado?.success) {
        closeDiaEconomicoDetail();
        showSuccessAlert("✅ Éxito", "Solicitud cancelada correctamente");
        refetchDiasEconomicos();
      } else {
        Alert.alert("❌ Error", resultado?.error || "Error al cancelar");
      }
    } catch (error) {
      console.error("Error al cancelar día económico:", error);
      Alert.alert(
        "❌ Error",
        error.message || "Error al procesar la solicitud"
      );
    }
  };

  const onRefresh = useCallback(async () => {
    await refetchAll();
  }, [refetchAll]);

  // Componentes de lista configurados
  const listConfigs = [
    {
      title: "Mis Incidencias",
      component: IncidenciasList,
      props: {
        incidencias,
        onPressIncidencia: openIncidenciaDetail,
        onDeleteIncidencia: deleteIncidencia,
      },
    },
    {
      title: "Solicitudes de Cumpleaños",
      component: DiasCumpleanosList,
      props: { diasCumpleanos, onPressCumpleanos: openCumpleanosDetail },
    },
    {
      title: "Mis Días Económicos",
      component: DiasEconomicosList,
      props: {
        diasEconomicos,
        estadisticas: estadisticasDias,
        loading: diasEconomicosLoading,
        onItemPress: openDiaEconomicoDetail,
        onOpenModal: () => setActiveModal("diaEconomico"),
      },
    },
    {
      title: "Permisos Especiales",
      component: PermisosEspecialesList,
      props: { permisosEspeciales },
    },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#007AFF"]}
          tintColor="#007AFF"
        />
      }
    >
      <View style={styles.tabContent}>
        <StatsGrid stats={stats} diasEconomicosStats={estadisticasDias} />
        <ActionButtons onOpenModal={setActiveModal} />

        {listConfigs.map((config, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{config.title}</Text>
            <config.component {...config.props} />
          </View>
        ))}
      </View>

      {/* Modales */}
      <IncidenciaModal
        visible={activeModal === "incidencia"}
        onClose={closeModal}
        onSubmit={handleCreateIncidencia}
        image={image}
        onPickImage={pickImage}
        onClearImage={clearImage}
      />

      <DiaEconomicoModal
        visible={activeModal === "diaEconomico"}
        onClose={closeModal}
        docenteId={docenteId}
        onSolicitar={handleSolicitarDiaEconomico}
        estadisticas={estadisticasDias}
      />

      <CumpleanosModal
        visible={activeModal === "cumpleanos"}
        onClose={closeModal}
        docenteId={docenteId}
        onSuccess={handleSolicitarCumpleanos}
      />

      <PermisoEspecialModal
        visible={activeModal === "permisoEspecial"}
        onClose={closeModal}
        onSubmit={() => {
          Alert.alert("ℹ️ Info", "Funcionalidad en desarrollo");
          closeModal();
        }}
      />

      {/* Modales de detalles */}
      <IncidenciaDetailModal
        visible={isDetailModalVisible}
        onClose={closeIncidenciaDetail}
        incidencia={selectedIncidencia}
        onDelete={deleteIncidencia}
        isDeleting={isDeleting}
      />

      <DiaEconomicoDetailModal
        visible={isDiaEconomicoDetailVisible}
        onClose={closeDiaEconomicoDetail}
        diaEconomico={selectedDiaEconomico}
        onDelete={handleDeleteDiaEconomico}
        isDeleting={diaEconomicoDeleting}
      />

      <CumpleanosDetailModal
        visible={isCumpleanosDetailVisible}
        onClose={closeCumpleanosDetail}
        cumpleanos={selectedCumpleanos}
        onDeleteCumpleanos={deleteCumpleanos}
      />

      {/* Modal de confirmación */}
      <ConfirmationModal
        visible={showConfirmation}
        title="Eliminar Incidencia"
        message={`¿Estás seguro de que quieres eliminar esta incidencia de "${incidenciaTipoToDelete}"?\n\nEsta acción no se puede deshacer.`}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Eliminar"
        cancelText="Cancelar"
        isConfirming={isDeleting}
      />

      <ErrorModal
        visible={activeModal === "error"}
        message={errorMessage}
        onClose={closeModal}
      />
    </ScrollView>
  );
};

export default IncidenciasTab;
