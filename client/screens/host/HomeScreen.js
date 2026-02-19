import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { globalStyles } from "../../theme/globalStyles";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import WebLayout from "../../components/WebLayout";
import { Platform, useWindowDimensions } from "react-native";
import { getEvents } from "../../util/events";



export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;
  const numColumns = isDesktop ? 2 : 1;

  // Load events on mount
  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const data = await getEvents();
      setEvents(data || []);
    } catch (error) {
      console.error('Failed to load events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  };



  const renderEmptyState = () => (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>No Events Yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first investment event and let friends gift stocks instead
        of presents.
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <WebLayout>
        <View style={[globalStyles.container, { justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: spacing.md, color: colors.textSecondary }}>
            Loading events...
          </Text>
        </View>
      </WebLayout>
    );
  }

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
            keyExtractor={(item) => item._id || item.id}
            renderItem={({ item }) => (
            <View style={styles.eventCard}>
                <Text style={styles.eventTitle}>{item.eventTitle || item.title}</Text>
                <Text style={styles.eventAmount}>
                ${item.currentAmount || item.raised || 0} / ${item.targetAmount || 0}
                </Text>
                <Text style={styles.eventStatus}>
                {item.status || 'active'}
                </Text>
            </View>
            )}
            ListEmptyComponent={renderEmptyState}
            columnWrapperStyle={
                numColumns > 1 ? { gap: 20 } : undefined
              }
            contentContainerStyle={{ marginTop: spacing.lg }}
            refreshControl={
              <RefreshControl
                refreshing={isRefreshing}
                onRefresh={handleRefresh}
                colors={[colors.primary]}
              />
            }
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

  eventStatus: {
    color: colors.primary,
    marginTop: spacing.xs,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
});