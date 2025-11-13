import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import DashboardScreen from "../screens/DashboardScreen";
import IncidenciasForm from "../screens/IncidenciasForm";
import CumpleaniosScreen from "../screens/CumpleaniosScreen";
import DiasEconomicosForm from "../screens/DiasEconomicosForm";

const Drawer = createDrawerNavigator();

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Dashboard"
      screenOptions={{
        headerShown: true,
        drawerType: "slide",
      }}
    >
      <Drawer.Screen name="Inicio" component={DashboardScreen} />
      <Drawer.Screen name="Incidencias" component={IncidenciasForm} />
      <Drawer.Screen name="Cumpleaños" component={CumpleaniosScreen} />
      <Drawer.Screen name="Día Económico" component={DiasEconomicosForm} />
    </Drawer.Navigator>
  );
}
