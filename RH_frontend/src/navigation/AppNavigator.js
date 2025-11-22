import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../components/login";
import RegisterScreen from "../components/register";
import DocenteHomeScreen from "../../src/components/teacherDashboard/teacherdashboard";
import AdminHomeScreen from "../screens/administrador/HomeScreenAdmin";
import docenteScreenManagment from "../screens/administrador/manage-docentes";
import UsuariosPanel from "../screens/administrador/manage-users";
import { View, Text, ActivityIndicator } from "react-native";

import { AuthContext } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, userStatus, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#ef4444" />
        <Text style={{ marginTop: 12, color: "#6b7280" }}>
          Cargando usuario...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {user ? (
          // Usuario autenticado
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
            <>
              <Stack.Screen
                name="AdminHome"
                component={AdminHomeScreen}
                options={{ headerShown: false }}
              />
              {/* AGREGA AQUÍ LA NUEVA PANTALLA */}
              <Stack.Screen
                name="Usuarios"
                component={UsuariosPanel}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="Docentes"
                component={docenteScreenManagment}
                options={{ headerShown: false }}
              />
            </>
          ) : (
            <Stack.Screen
              name="DocenteHome"
              component={DocenteHomeScreen}
              options={{ headerShown: false }}
            />
          )
        ) : (
          // Usuario no autenticado
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="Register"
              component={RegisterScreen}
              options={{ headerShown: false }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
