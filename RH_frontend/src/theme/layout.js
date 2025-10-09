import React from "react";
import { View, StyleSheet } from "react-native";

// Aquí podrías usar tu tema
import { useColorScheme } from "react-native";
import { lightTheme, darkTheme } from "./theme";

export default function RootLayout({ children }) {
  const scheme = useColorScheme();
  const theme = scheme === "dark" ? darkTheme : lightTheme;

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
