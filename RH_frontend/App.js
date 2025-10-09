import React, { useState } from "react";
import { AuthContext } from "./src/context/AuthContext";
import AppNavigator from "./src/navigation/AppNavigator";

export default function App() {
  const [user, setUser] = useState(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      <AppNavigator />
    </AuthContext.Provider>
  );
}