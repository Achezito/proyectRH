// src/docente/rejected.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Feather } from '@expo/vector-icons';

export default function Rejected() {
  const navigation = useNavigation();

  const handleLogout = async () => {
    navigation.navigate('Login');
  };

  return (
    <View style={styles.container}>
      <Feather name="x-circle" size={64} color="#DC2626" />
      <Text style={styles.title}>Cuenta Rechazada</Text>
      <Text style={styles.message}>
        Tu solicitud de registro ha sido rechazada. 
        Contacta al administrador para más información.
      </Text>
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Volver al Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#FEF2F2',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#DC2626',
    marginVertical: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#7F1D1D',
    marginBottom: 32,
    lineHeight: 24,
  },
  logoutButton: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '600',
  },
});