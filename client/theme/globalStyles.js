import { StyleSheet } from "react-native";
import { colors } from "./colors";
import { spacing } from "./spacing";
import { Platform } from "react-native";

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.lg,
    alignSelf: "center",
    width: "100%",
    maxWidth: Platform.OS === "web" ? 1100 : "100%", // important for web
  },

  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
  },

  primaryButton: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: 14,
    alignItems: "center",
    cursor: "pointer", // web only but safe
  },

  primaryButtonText: {
    color: colors.textPrimary,
    fontWeight: "600",
    fontSize: 16,
  },
});