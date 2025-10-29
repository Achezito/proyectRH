import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { supabase } from 'C:/xampp/htdocs/proyectRH/RH_frontend/supabaseClient.js'; // Asegúrate de tener configurado supabaseClient.js
// Crear el contexto
export const AuthContext = createContext();

// Proveedor del contexto


export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [userStatus, setUserStatus] = useState(null); // 'pending', 'approved', 'rejected'
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          await checkUserStatus(session.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
          setUserProfile(null);
          setUserStatus(null);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      await checkUserStatus(session.user);
    } else {
      setLoading(false);
    }
  };

const checkUserStatus = async (authUser) => {
  try {
    setLoading(true);
    
    // 1. Obtener perfil del docente
    const { data: docente, error: docenteError } = await supabase
      .from('DOCENTES')
      .select('*')
      .eq('correo_institucional', authUser.email)
      .single();

    if (docenteError) throw docenteError;

    // 2. Obtener el rol del usuario
    const { data: rolData, error: rolError } = await supabase
      .from('USER_ROL')
      .select('rol_id')
      .eq('user_id', authUser.id)
      .single();

    // 3. Crear objeto de usuario completo con el rol
    const userWithRole = {
      ...authUser,
      rol: rolData?.rol_id || 2, // Default a docente (2) si no encuentra rol
    };

    setUser(userWithRole); // ← Esto es lo importante
    setUserProfile(docente);
    setUserStatus(docente.estado);

  } catch (error) {
    console.error('Error checking user status:', error);
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
      console.error('Error al cerrar sesión:', error);
    }
  };

  const value = {
    user,
    userProfile,
    userStatus,
    loading,
    logout,
    isApproved: userStatus === 'approved',
    isPending: userStatus === 'pending',
    isRejected: userStatus === 'rejected'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de un AuthProvider');
  }
  return context;
};