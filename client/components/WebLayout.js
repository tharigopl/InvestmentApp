import React from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { colors } from "../theme/colors";
import { spacing } from "../theme/spacing";

export default function WebLayout({ children }) {
  if (Platform.OS !== "web") {
    return children;
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.sidebar}>
        <Text style={styles.logo}>InvestGift</Text>

        <Text style={styles.navItem}>Dashboard</Text>
        <Text style={styles.navItem}>Events</Text>
        <Text style={styles.navItem}>Settings</Text>
      </View>

      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    flex: 1,
  },

  sidebar: {
    width: 240,
    backgroundColor: colors.card,
    padding: spacing.lg,
  },

  logo: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: spacing.xl,
  },

  navItem: {
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },

  content: {
    flex: 1,
    padding: spacing.xl,
  },
});