// En tu index.js principal - VERSIÓN COMPLETA CON DÍAS ECONÓMICOS Y CUMPLEAÑOS
import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import { styles } from "./styles";
import { useIncidenciasOperations } from "./hooks/useIncidenciasOperations";
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
import DiaEconomicoDetailModal from "./components/modals/DiaEconomicoDetail"; // ← NUEVO
import ConfirmationModal from "./components/modals/confirmationModal";

const IncidenciasTab = ({ docenteId, userData }) => {
  const {
    // Datos
    incidencias,
    diasEconomicos,
    diasCumpleanos,
    permisosEspeciales,
    stats,
    loading,
    refetch,
    crearIncidencia,
    solicitarDiaCumpleanos,

    // Estados de incidencias
    selectedIncidencia,
    isDetailModalVisible,
    isDeleting,
    openIncidenciaDetail,
    closeIncidenciaDetail,
    deleteIncidencia,

    // Estados de días económicos ← NUEVO
    selectedDiaEconomico,
    isDiaEconomicoDetailVisible,
    openDiaEconomicoDetail,
    closeDiaEconomicoDetail,
    deleteDiaEconomico,

    // Estados de cumpleaños
    selectedCumpleanos,
    isCumpleanosDetailVisible,
    openCumpleanosDetail,
    closeCumpleanosDetail,
    deleteCumpleanos,

    // Estados/funciones para la confirmación
    showConfirmation,
    incidenciaTipoToDelete,
    confirmDelete,
    cancelDelete,
  } = useIncidenciasOperations(docenteId);

  const { image, pickImage, clearImage } = useImagePicker();
  const [activeModal, setActiveModal] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const showError = (message) => {
    setErrorMessage(message);
    setActiveModal("error");
  };

  const closeModal = () => {
    setActiveModal(null);
    clearImage();
  };

  // Función para manejar el envío exitoso de días económicos
  const handleDiaEconomicoSuccess = () => {
    refetch(); // Recargar datos para actualizar estadísticas
    closeModal();
    Alert.alert("✅ Éxito", "Solicitud de día económico enviada correctamente");
  };

  // Función para manejar el envío exitoso de cumpleaños
  const handleCumpleanosSuccess = () => {
    refetch();
    closeModal();
    Alert.alert("✅ Éxito", "Solicitud de cumpleaños enviada correctamente");
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando datos...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.tabContent}>
        <StatsGrid stats={stats} />

        <ActionButtons onOpenModal={setActiveModal} />

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Incidencias</Text>
          <IncidenciasList
            incidencias={incidencias}
            onPressIncidencia={openIncidenciaDetail}
            onDeleteIncidencia={deleteIncidencia}
          />
        </View>

        {/* SECCIÓN: Solicitudes de Cumpleaños */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Solicitudes de Cumpleaños</Text>
          <DiasCumpleanosList
            diasCumpleanos={diasCumpleanos}
            onPressCumpleanos={openCumpleanosDetail}
          />
        </View>

        {/* SECCIÓN ACTUALIZADA: Días Económicos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Días Económicos</Text>
          <DiasEconomicosList
            diasEconomicos={diasEconomicos}
            onItemPress={openDiaEconomicoDetail} // ← NUEVO
            onItemDelete={deleteDiaEconomico} // ← NUEVO
            isDeleting={isDeleting} // ← NUEVO
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permisos Especiales</Text>
          <PermisosEspecialesList permisosEspeciales={permisosEspeciales} />
        </View>
      </View>

      {/* Modales de creación */}
      <IncidenciaModal
        visible={activeModal === "incidencia"}
        onClose={closeModal}
        onSubmit={async (formData) => {
          try {
            console.log("🔄 Creando incidencia...");
            await crearIncidencia(formData);
            Alert.alert("✅ Éxito", "Incidencia registrada correctamente");
            closeModal();
          } catch (error) {
            console.error("❌ Error creando incidencia:", error);
            showError(error.message);
          }
        }}
        image={image}
        onPickImage={pickImage}
        onClearImage={clearImage}
      />

      {/* MODAL DE DÍA ECONÓMICO ACTUALIZADO */}
      <DiaEconomicoModal
        visible={activeModal === "diaEconomico"}
        onClose={closeModal}
        docenteId={docenteId}
        onSuccess={handleDiaEconomicoSuccess} // ← ACTUALIZADO
      />

      {/* MODAL DE CUMPLEAÑOS ACTUALIZADO */}
      <CumpleanosModal
        visible={activeModal === "cumpleanos"}
        onClose={closeModal}
        docenteId={docenteId}
        onSuccess={handleCumpleanosSuccess}
      />

      <PermisoEspecialModal
        visible={activeModal === "permisoEspecial"}
        onClose={closeModal}
        onSubmit={() => {
          Alert.alert("ℹ️ Info", "Funcionalidad en desarrollo");
          closeModal();
        }}
      />

      {/* Modal de Detalles de Incidencias */}
      <IncidenciaDetailModal
        visible={isDetailModalVisible}
        onClose={closeIncidenciaDetail}
        incidencia={selectedIncidencia}
        onDelete={deleteIncidencia}
        isDeleting={isDeleting}
      />

      {/* NUEVO: Modal de Detalles de Días Económicos */}
      <DiaEconomicoDetailModal
        visible={isDiaEconomicoDetailVisible}
        onClose={closeDiaEconomicoDetail}
        diaEconomico={selectedDiaEconomico}
        onDelete={deleteDiaEconomico}
        isDeleting={isDeleting}
      />

      {/* Modal de Detalles de Cumpleaños */}
      <CumpleanosDetailModal
        visible={isCumpleanosDetailVisible}
        onClose={closeCumpleanosDetail}
        cumpleanos={selectedCumpleanos}
        onDeleteCumpleanos={deleteCumpleanos}
      />

      {/* Modal de Confirmación */}
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
