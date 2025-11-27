import React from "react";
import { View, Text, ScrollView } from "react-native";
import { styles } from "./styles";
import PersonalInfoCard from "./components/personalInfoCard";
import ChangePasswordCard from "./components/changePasswordCard";

const ProfileTab = ({ userData, docenteId }) => {
  return (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeSection}>
        <Text style={styles.welcomeTitle}>¡Bienvenido de vuelta!</Text>
        <Text style={styles.welcomeSubtitle}>
          Gestiona tu perfil y configuración
        </Text>
      </View>

      <PersonalInfoCard userData={userData} />
      <ChangePasswordCard docenteId={docenteId} />
    </ScrollView>
  );
};

export default ProfileTab;
