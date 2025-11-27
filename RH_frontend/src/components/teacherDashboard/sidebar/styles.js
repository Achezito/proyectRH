import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: "white",
    paddingTop: 60,
    borderRightWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  sidebarHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#4f46e5",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 15,
  },
  avatarText: {
    color: "white",
    fontSize: 24,
    fontWeight: "bold",
  },
  sidebarTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
    marginBottom: 4,
  },
  sidebarSubtitle: {
    fontSize: 14,
    color: "#64748b",
  },
  sidebarMenu: {
    paddingHorizontal: 15,
    paddingTop: 20,
  },
  sidebarBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  sidebarBtnActive: {
    backgroundColor: "#f1f5f9",
  },
  sidebarText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "500",
  },
  sidebarTextActive: {
    color: "#4f46e5",
    fontWeight: "600",
  },
  logoutBtn: {
    marginTop: 20,
  },
  logoutText: {
    color: "#ef4444",
  },
});
