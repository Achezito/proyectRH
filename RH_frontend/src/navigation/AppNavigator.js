import React, { useContext } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import LoginScreen from "../components/login";
import RegisterScreen from "../components/register";
import HomeScreen from "../screens/docente/HomeScreen";
import AdminHomeScreen from "../screens/administrador/HomeScreenAdmin";
import PendingApproval from "C:/xampp/htdocs/proyectRH/RH_frontend/src/screens/docente/pending-approval.js"; // Ruta corregida
import Rejected from "C:/xampp/htdocs/proyectRH/RH_frontend/src/screens/docente/rejected.js"; // Asumiendo que está en la misma carpeta
import { AuthContext } from "../context/AuthContext";

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const { user, userStatus, loading } = useContext(AuthContext);

  if (loading) {
    return null; // O un loading screen
  }
  console.log("=== APP NAVIGATOR DEBUG ===");
  console.log("User:", user);
  console.log("User Status:", userStatus);
  console.log("Loading:", loading);
  console.log("===========================");
  return (
    <NavigationContainer>
      
      <Stack.Navigator>
        
        {user ? (
          // Usuario autenticado - verificar estado
          userStatus === 'pending' ? (
            <Stack.Screen 
              name="PendingApproval" 
              component={PendingApproval} 
              options={{ headerShown: false }}
            />
            
          ) : userStatus === 'rejected' ? (
            <Stack.Screen 
              name="Rejected" 
              component={Rejected} 
              options={{ headerShown: false }}
            />
          ) : user.rol === 1 ? ( // Asumiendo que rol=1 es admin
            <Stack.Screen 
              name="AdminHome" 
              component={AdminHomeScreen} 
              options={{ headerShown: false }}
            />
          ) : (
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
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