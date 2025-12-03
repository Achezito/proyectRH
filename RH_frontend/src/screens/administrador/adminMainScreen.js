import React, { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sidebar } from "../../components/sidebar";
import Header from "../../components/header";
import { useNavigation, useRoute } from "@react-navigation/native";

// Importa todas las pantallas de administrador
import AdminHome from "./HomeScreenAdmin";
import IncidenciasScreen from "./IncidenciasScreen";
import DocentesScreen from "./DocentesScreen";
import DiasEconomicosScreen from "./DiasEconomicosScreen";
import CumpleanosScreen from "./CumpleanosScreen";
import PeriodosScreen from "./PeriodosScreen";
import ConfiguracionScreen from "./ConfigDiasEconomicosScreen";
import docenteScreenManagment from "./manage-users";
import UsuariosPanel from "./manage-users";

// Mapeo de rutas a componentes
const SCREEN_COMPONENTS = {
  AdminHome: AdminHome,
  Incidencias: IncidenciasScreen,
  Docentes: DocentesScreen,
  GestionDocentes: DocentesScreen, // Alias
  DiasEconomicos: DiasEconomicosScreen,
  Cumpleanos: CumpleanosScreen,
  Periodos: PeriodosScreen,
  Configuracion: ConfiguracionScreen,
  ImportCSV: docenteScreenManagment,
  Usuarios: UsuariosPanel,
};

// Títulos para cada pantalla
const SCREEN_TITLES = {
  AdminHome: "Dashboard",
  Incidencias: "Gestión de Incidencias",
  Docentes: "Gestión de Docentes",
  GestionDocentes: "Gestión de Docentes",
  DiasEconomicos: "Días Económicos",
  Cumpleanos: "Cumpleaños",
  Periodos: "Períodos Académicos",
  Configuracion: "Configuración del Sistema",
  ImportCSV: "Importar CSV",
  Usuarios: "Gestión de Usuarios",
};

// En AdminMainScreen.js, modifica:
export default function AdminMainScreen() {
  const navigation = useNavigation();
  const route = useRoute();

  // Obtener la pantalla actual de los parámetros de ruta
  const currentScreen = route.params?.screen || "AdminHome";
  const CurrentComponent = SCREEN_COMPONENTS[currentScreen] || AdminHome;
  const currentTitle = SCREEN_TITLES[currentScreen] || "Dashboard";

  // Función para cambiar de pantalla desde el sidebar
  const navigateToScreen = (screenName) => {
    // Actualiza los parámetros de la ruta actual
    navigation.setParams({ screen: screenName });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mainWrapper}>
        {/* Pasa la pantalla activa al Sidebar */}
        <Sidebar
          onNavigate={navigateToScreen}
          activeScreen={currentScreen} // NUEVO: pasa la pantalla activa
        />

        <View style={styles.contentWrapper}>
          <Header title={currentTitle} />

          {/* Renderiza el componente actual */}
          <View style={styles.content}>
            <CurrentComponent />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  mainWrapper: {
    flex: 1,
    flexDirection: "row",
  },
  contentWrapper: {
    flex: 1,
    flexDirection: "column",
  },
  content: {
    flex: 1,
    padding: 16,
  },
});
