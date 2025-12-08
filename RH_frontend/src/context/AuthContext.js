import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "expo-router";
import supabase from "../../supabaseClient.js";
// Crear el contexto
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Evita re-render inútil al escribir en inputs en Web
      if (event === "TOKEN_REFRESHED" || event === "PASSWORD_RECOVERY") return;

      if (event === "SIGNED_IN" && session?.user) {
        await checkUserStatus(session.user);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setUserProfile(null);
        setUserStatus(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      setLoading(false);
      return; // ← evita re-render doble
    }
    await checkUserStatus(session.user);
  };

  const checkUserStatus = async (authUser) => {
    try {
      setLoading(true);

      // 1. Obtener perfil del docente
      const { data: docente, error: docenteError } = await supabase
        .from("DOCENTES")
        .select("*")
        .eq("correo_institucional", authUser.email)
        .single();

      if (docenteError) throw docenteError;

      // 2. Obtener rol del usuario
      const { data: rolData, error: rolError } = await supabase
        .from("USER_ROL")
        .select("rol_id")
        .eq("user_id", authUser.id)
        .single();

      if (rolError) throw rolError;

      // 3. Guardar todo en el contexto
      setUser({
        ...authUser,
        rol_id: rolData.rol_id, // ← esto es lo que usas en AppNavigator
      });

      setUserProfile(docente);
      setUserStatus(docente.estado);
    } catch (error) {
      console.error("Error checking user status:", error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setUserProfile(null);
      setUserStatus(null);
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const value = {
    user,
    setUser, // ← Asegúrate de incluir esto
    userProfile,
    userStatus,
    setUserStatus, // ← Agrega esto también
    loading,
    logout,
    isApproved: userStatus === "approved",
    isPending: userStatus === "pending",
    isRejected: userStatus === "rejected",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe ser usado dentro de un AuthProvider");
  }
  return context;
};
