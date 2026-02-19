// client/screens/EventFeed.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Image,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { GlobalStyles } from '../constants/styles';
import { getMyEvents, deleteEvent } from '../util/events';

const EventFeed = () => {
  const navigation = useNavigation();
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, funded, completed

  // Load events when filter changes
  useEffect(() => {
    loadEvents();
  }, [filter]);

  // ✅ NEW: Reload events when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 EventFeed focused - reloading events...');
      loadEvents();
    }, [filter])
  );

  const loadEvents = async () => {
    try {
      console.log('📡 Fetching events from API...');
      setIsLoading(true);
      // Use getMyEvents to get events created by current user
      const fetchedEvents = await getMyEvents();
      console.log('✅ Events loaded:', fetchedEvents?.length || 0);
      setEvents(fetchedEvents);
    } catch (error) {
      console.error('❌ Error loading events:', error);
      Alert.alert('Error', 'Failed to load events. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadEvents();
    setIsRefreshing(false);
  }, [filter]);

  const handleEventPress = (eventId) => {
    navigation.navigate('EventDetails', { eventId });
  };

  const handleCreateEvent = () => {
    navigation.navigate('CreateInvestmentEvent');
  };

  const handleDelete = async (eventId, eventTitle) => {
    console.log('🗑️ handleDelete called with:', eventId, eventTitle);
    
    // Web-compatible confirmation
    const confirmDelete = async () => {
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
        return window.confirm(`Delete "${eventTitle}"?\n\nThis action cannot be undone.`);
      } else {
        // Mobile - use Alert with Promise
        return new Promise((resolve) => {
          Alert.alert(
            'Delete Event',
            `Are you sure you want to delete "${eventTitle}"?\n\nThis action cannot be undone.`,
            [
              { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
              { text: 'Delete', style: 'destructive', onPress: () => resolve(true) }
            ]
          );
        });
      }
    };

    const confirmed = await confirmDelete();
    console.log('🗑️ User confirmed:', confirmed);
    
    if (!confirmed) {
      console.log('❌ User cancelled delete');
      return;
    }

    try {
      console.log('🗑️ Calling delete API...');
      await deleteEvent(eventId);
      console.log('✅ Delete API successful');
      
      // Remove from local state
      setEvents(prev => prev.filter(e => e._id !== eventId && e.id !== eventId));
      
      // Show success message
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // Web - non-blocking alert
        setTimeout(() => {
          //alert('Event deleted successfully');
        }, 100);
      } else {
        //Alert.alert('Success', 'Event deleted successfully');
      }
    } catch (error) {
      console.error('❌ Delete error:', error);
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        alert('Failed to delete event. Please try again.');
      } else {
        Alert.alert('Error', 'Failed to delete event');
      }
      loadEvents(); // Reload to sync
    }
  };

  const renderEventCard = ({ item }) => {
    const progress = (item.currentAmount / item.targetAmount) * 100;
    const daysLeft = item.deadline
      ? Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => handleEventPress(item._id || item.id)}
          activeOpacity={0.7}
        >
          {/* Event Image */}
          <Image
            source={
              item.recipientImage || item.imageUrl
                ? { uri: item.recipientImage || item.imageUrl }
                : { uri: 'https://via.placeholder.com/400x200?text=Event' }
            }
            style={styles.eventImage}
          />

          {/* Status Badge */}
          <View style={[styles.statusBadge, styles[`status${item.status}`]]}>
            <Text style={styles.statusText}>
              {item.status === 'active' && '🔥 Active'}
              {item.status === 'funded' && '✅ Funded'}
              {item.status === 'awaiting_investment' && '⏳ Ready'}
              {item.status === 'invested' && '💰 Invested'}
              {item.status === 'completed' && '🎉 Complete'}
              {item.status === 'cancelled' && '❌ Cancelled'}
            </Text>
          </View>

        {/* Event Content */}
        <View style={styles.eventContent}>
          {/* Event Title */}
          <Text style={styles.eventTitle}>{item.eventTitle || item.title}</Text>

          {/* Recipient Info */}
          {item.recipientName && (
            <View style={styles.recipientRow}>
              <Ionicons name="person-circle-outline" size={16} color={GlobalStyles.colors.gray500} />
              <Text style={styles.recipientText}>
                for <Text style={styles.recipientName}>{item.recipientName}</Text>
              </Text>
            </View>
          )}

          {/* Event Date */}
          {item.eventDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color={GlobalStyles.colors.gray500} />
              <Text style={styles.infoText}>
                {new Date(item.eventDate).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {/* Stock Symbol */}
          {item.selectedInvestments && item.selectedInvestments.length > 0 && (
            <View style={styles.stockRow}>
              <Ionicons name="trending-up" size={16} color={GlobalStyles.colors.primary500} />
              <Text style={styles.stockText}>
                {item.selectedInvestments.map(s => s.symbol).join(', ')}
              </Text>
            </View>
          )}

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
            </View>
            <Text style={styles.progressText}>{progress.toFixed(0)}% funded</Text>
          </View>

          {/* Amount Info */}
          <View style={styles.amountRow}>
            <View style={styles.amountItem}>
              <Text style={styles.amountValue}>${(item.currentAmount || 0).toFixed(2)}</Text>
              <Text style={styles.amountLabel}>raised</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountItem}>
              <Text style={styles.amountValue}>${(item.targetAmount || 0).toFixed(2)}</Text>
              <Text style={styles.amountLabel}>goal</Text>
            </View>
            <View style={styles.amountDivider} />
            <View style={styles.amountItem}>
              <Text style={styles.amountValue}>{(item.contributors?.length || 0)}</Text>
              <Text style={styles.amountLabel}>contributors</Text>
            </View>
          </View>

          {/* Days Left */}
          {item.status === 'active' && daysLeft && daysLeft > 0 && (
            <View style={styles.daysLeftContainer}>
              <Ionicons name="time-outline" size={14} color={GlobalStyles.colors.primary500} />
              <Text style={styles.daysLeftText}>
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </Text>
            </View>
          )}

          {/* Contribute Button */}
          {item.status === 'active' && (
            <TouchableOpacity
              style={styles.contributeButton}
              onPress={() => {
                navigation.navigate('ContributionScreen', { eventId: item._id || item.id });
              }}
            >
              <Text style={styles.contributeButtonText}>Contribute</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
        </TouchableOpacity>

        {/* Delete Button - Outside TouchableOpacity so it's independently clickable */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => {
            console.log('🗑️ Delete button pressed for event:', item._id || item.id);
            handleDelete(item._id || item.id, item.eventTitle || item.title);
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>Investment Events</Text>
      <Text style={styles.headerSubtitle}>
        Gift stocks to friends and family for special occasions
      </Text>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {['all', 'active', 'funded', 'completed'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[styles.filterTab, filter === filterOption && styles.filterTabActive]}
            onPress={() => setFilter(filterOption)}
          >
            <Text
              style={[
                styles.filterTabText,
                filter === filterOption && styles.filterTabTextActive,
              ]}
            >
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="gift-outline" size={80} color={GlobalStyles.colors.gray300} />
      <Text style={styles.emptyTitle}>No events yet</Text>
      <Text style={styles.emptySubtitle}>
        Create your first investment event to start gifting stocks!
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreateEvent}>
        <Text style={styles.emptyButtonText}>Create Event</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item._id || item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={GlobalStyles.colors.primary500}
          />
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Create Button */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleCreateEvent}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: GlobalStyles.colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray50,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: GlobalStyles.colors.gray500,
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    marginBottom: 20,
  },
  filterContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: GlobalStyles.colors.gray100,
  },
  filterTabActive: {
    backgroundColor: GlobalStyles.colors.primary500,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.gray600,
  },
  filterTabTextActive: {
    color: '#fff',
  },
  eventCard: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardTouchable: {
    flex: 1,
    zIndex: 1,
  },
  eventImage: {
    width: '100%',
    height: 200,
    backgroundColor: GlobalStyles.colors.gray200,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 999,
  },
  statusactive: {
    backgroundColor: GlobalStyles.colors.primary500,
  },
  statusfunded: {
    backgroundColor: GlobalStyles.colors.success500,
  },
  statusawaiting_investment: {
    backgroundColor: GlobalStyles.colors.warning500,
  },
  statusinvested: {
    backgroundColor: GlobalStyles.colors.info500,
  },
  statuscompleted: {
    backgroundColor: GlobalStyles.colors.accent500,
  },
  statuscancelled: {
    backgroundColor: GlobalStyles.colors.error500,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#fff',
  },
  eventContent: {
    padding: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 8,
  },
  recipientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
  },
  recipientName: {
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  stockText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary600,
    flex: 1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: GlobalStyles.colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: GlobalStyles.colors.gray600,
    textAlign: 'right',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  amountItem: {
    alignItems: 'center',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
  },
  amountLabel: {
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
    marginTop: 2,
  },
  amountDivider: {
    width: 1,
    backgroundColor: GlobalStyles.colors.gray300,
  },
  daysLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  daysLeftText: {
    fontSize: 12,
    fontWeight: '600',
    color: GlobalStyles.colors.primary600,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 12,
    borderRadius: 8,
  },
  contributeButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray700,
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: GlobalStyles.colors.primary500,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});

export default EventFeed;