import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { globalStyles } from "../../theme/globalStyles";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";

export default function CreateEventScreen({ navigation }) {
  const [title, setTitle] = useState("");
  const [goal, setGoal] = useState("");
  const [description, setDescription] = useState("");

  function handleCreate() {
    navigation.navigate("EventCreated", {
      title,
      goal,
    });
  }

  return (
    <KeyboardAvoidingView
      style={globalStyles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Text style={styles.header}>Create Investment Event</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Event Title</Text>
        <TextInput
          placeholder="Emma's 30th Birthday"
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Investment Goal ($)</Text>
        <TextInput
          placeholder="1000"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
          style={styles.input}
          value={goal}
          onChangeText={setGoal}
        />

        <Text style={styles.label}>Description</Text>
        <TextInput
          placeholder="Help me invest for my future 🎯"
          placeholderTextColor={colors.textSecondary}
          style={[styles.input, { height: 100 }]}
          multiline
          value={description}
          onChangeText={setDescription}
        />
      </View>

      <Pressable
        style={globalStyles.primaryButton}
        onPress={handleCreate}
      >
        <Text style={globalStyles.primaryButtonText}>
          Create Event
        </Text>
      </Pressable>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  card: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.lg,
  },

  label: {
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    marginTop: spacing.md,
    fontSize: 14,
  },

  input: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: spacing.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
});