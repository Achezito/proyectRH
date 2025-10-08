import React from "react";
import {View, TextInput, TouchableOpacity, StyleSheet} from "react-native";
import {Bell, Search} from "lucide-react-native";

export default function Header(){
    return(
        <View style={StyleSheet.header}>
            {/* Buscador */}
            <View style= {styles.searchContainer}>
            <Search size= {18} color= "#888" style={styles.searchIcon}/>
            <TextInput
                style={styles.input}
                placeholder="Buscar docentes, incidencias..."
                placeholderTextColor="#999"
            />
            </View>
             {/* Notificacion */}
             <TouchableOpacity style={styles.notificationButton}>
                <Bell size={22} color="#333"/>
                <View style={styles.notificationDot}/>
                </TouchableOpacity>
        </View>
    );
}
const styles = StyleSheet.create({
  header: {
    height: 60,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#ddd",
    paddingHorizontal: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
    borderRadius: 10,
    paddingHorizontal: 10,
    flex: 1,
    height: 40,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#333",
  },
  notificationButton: {
    position: "relative",
    padding: 8,
  },
  notificationDot: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0077b6", // color primario
  },
});