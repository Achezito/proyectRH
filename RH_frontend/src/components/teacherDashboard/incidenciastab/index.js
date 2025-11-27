import React, { useState, useEffect } from "react";
import { ScrollView, View, Text, Alert } from "react-native";
import { styles } from "./styles";
import { useIncidencias } from "./hooks/useIncidencias";
import { useImagePicker } from "./hooks/useImagePicker";
import StatsGrid from "./components/ui/statsGridd.js";
import ActionButtons from "./components/ui/ActionButtons";
import IncidenciasList from "./components/lists/IncidenciasList";
import DiasEconomicosList from "./components/lists/DiasEconomicosList.js";
import PermisosEspecialesList from "./components/lists/PermisosEspecialesList.js";
import IncidenciaModal from "./components/modals/IncidenciaModal";
import DiaEconomicoModal from "./components/modals/DiaEconomicoModal";
import CumpleanosModal from "./components/modals/CumpleanosModal";
import PermisoEspecialModal from "./components/modals/PermisoEspecialModal";
import ErrorModal from "./components/modals/ErrorModal";

const IncidenciasTab = ({ docenteId, userData }) => {
  const {
    incidencias,
    diasEconomicos,
    permisosEspeciales,
    stats,
    loading,
    refetch,
  } = useIncidencias(docenteId);

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

  const handleSuccess = (message) => {
    Alert.alert("Éxito", message);
    closeModal();
    refetch();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando incidencias...</Text>
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
          <IncidenciasList incidencias={incidencias} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis Días Económicos</Text>
          <DiasEconomicosList diasEconomicos={diasEconomicos} />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Permisos Especiales</Text>
          <PermisosEspecialesList permisosEspeciales={permisosEspeciales} />
        </View>
      </View>

      {/* Modales */}
      <IncidenciaModal
        visible={activeModal === "incidencia"}
        onClose={closeModal}
        onSubmit={() => handleSuccess("Incidencia registrada correctamente")}
        image={image}
        onPickImage={pickImage}
        onClearImage={clearImage}
      />

      <DiaEconomicoModal
        visible={activeModal === "diaEconomico"}
        onClose={closeModal}
        onSubmit={() => handleSuccess("Día económico solicitado correctamente")}
        diasDisponibles={stats.diasDisponibles}
      />

      <CumpleanosModal
        visible={activeModal === "cumpleanos"}
        onClose={closeModal}
        onSubmit={() =>
          handleSuccess("Día de cumpleaños solicitado correctamente")
        }
      />

      <PermisoEspecialModal
        visible={activeModal === "permisoEspecial"}
        onClose={closeModal}
        onSubmit={() =>
          handleSuccess("Permiso especial solicitado correctamente")
        }
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
