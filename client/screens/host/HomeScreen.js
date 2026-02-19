import React, { useState, useEffect } from "react";
import { View, Text, FlatList, Pressable, StyleSheet, ActivityIndicator, RefreshControl, Alert } from "react-native";
import { useFocusEffect } from '@react-navigation/native';
import { globalStyles } from "../../theme/globalStyles";
import { colors } from "../../theme/colors";
import { spacing } from "../../theme/spacing";
import WebLayout from "../../components/WebLayout";
import { Platform, useWindowDimensions } from "react-native";
import { getMyEvents, deleteEvent } from "../../util/events";
import { Ionicons } from '@expo/vector-icons';



export default function HomeScreen({ navigation }) {
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 900;
  const numColumns = isDesktop ? 2 : 1;

  // Load events when screen comes into focus (including first mount)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 HomeScreen focused - loading events...');
      loadEvents();
    }, [])
  );

  const loadEvents = async () => {
    try {
      console.log('📡 Fetching MY events from API...');
      setIsLoading(true);
      const data = await getMyEvents();
      console.log('✅ My events loaded:', data?.length || 0, 'events');
      console.log('Events data:', data);
      setEvents(data || []);
    } catch (error) {
      console.error('❌ Failed to load events:', error);
      console.error('Error details:', error.response?.data);
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

  const handleDelete = async (eventId, eventTitle) => {
    // For web compatibility
    const confirmDelete = () => {
      return new Promise((resolve) => {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
          const confirmed = window.confirm(`Delete "${eventTitle}"?\n\nThis action cannot be undone.`);
          resolve(confirmed);
        } else {
          Alert.alert(
            'Delete Event',
            `Are you sure you want to delete "${eventTitle}"?\n\nThis action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        }
      });
    };

    const confirmed = await confirmDelete();
    
    if (!confirmed) return;

    try {
      await deleteEvent(eventId);
      
      // Remove from local state immediately for better UX
      setEvents(prev => prev.filter(event => event._id !== eventId && event.id !== eventId));
      
      // Show success message
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Web - use setTimeout for non-blocking
        setTimeout(() => {
          alert('Event deleted successfully');
        }, 100);
      } else {
        Alert.alert('Success', 'Event deleted successfully');
      }
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', error.message || 'Failed to delete event. Please try again.');
      // Reload events to sync state
      loadEvents();
    }
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
              <View style={styles.eventHeader}>
                <View style={styles.eventInfo}>
                  <Text style={styles.eventTitle}>{item.eventTitle || item.title}</Text>
                  <Text style={styles.eventAmount}>
                    ${item.currentAmount || item.raised || 0} / ${item.targetAmount || 0}
                  </Text>
                  <Text style={styles.eventStatus}>
                    {item.status || 'active'}
                  </Text>
                </View>
                <Pressable 
                  style={styles.deleteButton}
                  onPress={() => handleDelete(item._id || item.id, item.eventTitle || item.title)}
                >
                  <Ionicons name="trash-outline" size={20} color={colors.error || '#ef4444'} />
                </Pressable>
              </View>
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

  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  eventInfo: {
    flex: 1,
    marginRight: spacing.md,
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

  deleteButton: {
    padding: spacing.sm,
    borderRadius: 8,
    backgroundColor: colors.background || '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
});