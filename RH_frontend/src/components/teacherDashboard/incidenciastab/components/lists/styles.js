import { StyleSheet } from "react-native";

export const styles = StyleSheet.create({
  listItem: {
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  listItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  listItemInfo: {
    flex: 1,
    marginRight: 12,
  },
  listItemTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  listItemSubtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 2,
  },
  estadoBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  estadoText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  listItemDetails: {
    gap: 4,
  },
  listItemDetail: {
    fontSize: 14,
    color: "#64748b",
    flexDirection: "row",
    alignItems: "center",
  },
  emptyState: {
    alignItems: "center",
    padding: 40,
  },
  emptyStateText: {
    marginTop: 12,
    fontSize: 16,
    color: "#64748b",
    textAlign: "center",
  },
});
