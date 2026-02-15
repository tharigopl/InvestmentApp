import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";
import { globalStyles } from "../../theme/globalStyles";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import WebLayout from "../../components/WebLayout";
import { Platform, useWindowDimensions } from "react-native";




export default function HomeScreen({ navigation }) {
  const events = []; // Replace later with API data
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;
  const numColumns = isDesktop ? 2 : 1;



  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>No Events Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first investment event and let friends gift stocks instead
        of presents.
      </Text>
    </View>
  );

  return (
    <WebLayout>
        <View style={globalStyles.container}>
        <Text style={styles.header}>Your Investment Events</Text>

        <Pressable
            style={globalStyles.primaryButton}
            onPress={() => navigation.navigate("CreateEvent")}
        >
            <Text style={globalStyles.primaryButtonText}>
            + Create Event
            </Text>
        </Pressable>

        <FlatList
            key={numColumns}   
            data={events}
            numColumns={numColumns}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
            <View style={styles.eventCard}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.eventAmount}>
                ${item.raised} raised
                </Text>
            </View>
            )}
            ListEmptyComponent={renderEmptyState}
            columnWrapperStyle={
                numColumns > 1 ? { gap: 20 } : undefined
              }
            contentContainerStyle={{ marginTop: spacing.lg }}
        />
        </View>
    </WebLayout>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },

  emptyCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
  },

  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },

  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  eventCard: {
    backgroundColor: colors.card,
    padding: spacing.lg,
    borderRadius: 16,
    marginBottom: spacing.md,
  },

  eventTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "600",
  },

  eventAmount: {
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
});