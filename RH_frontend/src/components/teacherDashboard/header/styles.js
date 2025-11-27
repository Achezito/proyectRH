import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  header: {
    height: 80,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderColor: "#e2e8f0",
    paddingHorizontal: 25,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  menuButton: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
  },
  headerTextContainer: {
    gap: 2,
  },
  headerName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e293b",
  },
  headerRole: {
    fontSize: 14,
    color: "#64748b",
  },
  notificationButton: {
    padding: 10,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
  },
});
