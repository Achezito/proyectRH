import React from "react";
import { AuthProvider } from "./src/context/AuthContext"; // Importa el Provider complejo
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  return (
    <AuthProvider>  {/* ← Usa el Provider complejo */}
      <AppNavigator />
    </AuthProvider>
  );
}