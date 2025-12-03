import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Importa la pantalla principal del admin que incluye sidebar
import AdminMainScreen from "../screens/administrador/adminMainScreen"; // NUEVO

// Elimina estas importaciones individuales:
// import IncidenciasScreen from "../screens/administrador/IncidenciasScreen";
// import DocentesScreen from "../screens/administrador/DocentesScreen";
// ... etc.

// Solo mantén las pantallas que NO usan sidebar
import LoginScreen from "../components/login";

import DocenteHomeScreen from "../../src/components/teacherDashboard/index";

// Pantallas de estado
import { View, Text, ActivityIndicator } from "react-native";
import { AuthContext } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, userStatus, loading } = useContext(AuthContext);

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          userStatus === "pending" ? (
            <Stack.Screen
              name="PendingApproval"
              component={PendingApprovalScreen}
              options={{ headerShown: false }}
            />
          ) : userStatus === "rejected" ? (
            <Stack.Screen
              name="Rejected"
              component={RejectedScreen}
              options={{ headerShown: false }}
            />
          ) : user.rol_id === 1 ? ( // rol=1 → administrador
            // SOLO UNA PANTALLA PARA EL ADMINISTRADOR
            <Stack.Screen
              name="AdminMain"
              component={AdminMainScreen}
              options={{ headerShown: false }}
            />
          ) : (
            // PANTALLAS DEL DOCENTE
            <Stack.Screen
              name="DocenteHome"
              component={DocenteHomeScreen}
              options={{ headerShown: false }}
            />
          )
        ) : (
          // USUARIO NO AUTENTICADO
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
