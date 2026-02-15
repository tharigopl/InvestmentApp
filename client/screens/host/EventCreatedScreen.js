import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { globalStyles } from "../../theme/globalStyles";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export default function EventCreatedScreen({ route, navigation }) {
  const { title, goal } = route.params;

  const fakeLink = "yourapp.com/invite/abc123";

  return (
    <View style={globalStyles.container}>
      <View style={styles.successCard}>
        <Text style={styles.emoji}>🎉</Text>

        <Text style={styles.header}>Event Created</Text>

        <Text style={styles.subText}>
          {title} is ready to receive stock contributions.
        </Text>

        {goal && (
          <Text style={styles.goalText}>
            Investment Goal: ${goal}
          </Text>
        )}

        <View style={styles.linkBox}>
          <Text style={styles.linkLabel}>Share this link</Text>
          <Text style={styles.linkText}>{fakeLink}</Text>
        </View>
      </View>

      <Pressable
        style={globalStyles.primaryButton}
        onPress={() => navigation.navigate("Home")}
      >
        <Text style={globalStyles.primaryButtonText}>
          Back to Dashboard
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  successCard: {
    backgroundColor: colors.card,
    padding: spacing.xl,
    borderRadius: 20,
    alignItems: "center",
    marginBottom: spacing.lg,
  },

  emoji: {
    fontSize: 42,
    marginBottom: spacing.md,
  },

  header: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  subText: {
    color: colors.textSecondary,
    textAlign: "center",
    marginTop: spacing.sm,
  },

  goalText: {
    marginTop: spacing.md,
    fontSize: 16,
    fontWeight: "600",
    color: colors.primary,
  },

  linkBox: {
    marginTop: spacing.lg,
    padding: spacing.md,
    backgroundColor: colors.background,
    borderRadius: 14,
    width: "100%",
  },

  linkLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: spacing.xs,
  },

  linkText: {
    color: colors.primary,
    fontWeight: "600",
  },
});