import React, { createContext, useState, useEffect} from 'react';
import {supabase} from '../../supabaseClient';

export const AuthContext = createContext();


export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);

    useEffect(() => {
        const session = supabase.auth.getSession();
        session.then(({data}) => {
            setUser(data?.session?.user || null );
        });
    const { data: listener} = supabase.auth.onAuthStateChange((_event,session) => {
        setUser(session?.user || null);
    });

    return () => {
        listener.subcription.unsubscribe();
    };
   }, []);
   return (
    <AuthContext.Provider value= {{user, setUser}}>
        {children}
        </AuthContext.Provider>

   );
};
