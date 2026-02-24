// client/screens/EventFeed.js - UPDATED WITH EARLYBIRD STYLE + MANAGE FUNDS
import React, { useState, useEffect, useCallback, useContext } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalStyles } from '../constants/styles';
import { getMyEvents, deleteEvent } from '../util/events';
import { AuthContext } from '../store/auth-context';

const EventFeed = () => {
  const navigation = useNavigation();
  const authCtx = useContext(AuthContext);
  const currentUserId = authCtx?.uid;

  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState('all'); // all, active, funded, completed

  // Load events when filter changes
  useEffect(() => {
    loadEvents();
  }, [filter]);

  // ✅ Reload events when screen comes into focus
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

  const getStatusInfo = (event) => {
    const progress = (event.currentAmount / event.targetAmount) * 100;
    const isFullyFunded = progress >= 100;
    
    switch (event.status) {
      case 'funded':
        return {
          color: '#4ECDC4',
          icon: 'wallet',
          text: '💰 Ready to Invest',
          badge: true,
        };
      case 'purchasing':
        return {
          color: '#FFD93D',
          icon: 'cart',
          text: '🛒 Purchasing',
          badge: true,
        };
      case 'invested':
        return {
          color: '#95E1D3',
          icon: 'checkmark-circle',
          text: '✅ Invested',
          badge: true,
        };
      case 'completed':
        return {
          color: '#A8E6CF',
          icon: 'gift',
          text: '🎁 Completed',
          badge: true,
        };
      default:
        return isFullyFunded ? {
          color: '#4ECDC4',
          icon: 'wallet',
          text: '💰 Goal Reached!',
          badge: true,
        } : null;
    }
  };

  const renderEventCard = ({ item }) => {
    console.log("Render Event Card currentAmount and targetAmount ", item.currentAmount, item.targetAmount);
    const progress = (item.currentAmount / item.targetAmount) * 100;
    console.log("Render Event Card Progress ", progress);
    const isFullyFunded = progress >= 100;
    const statusInfo = getStatusInfo(item);
    const eventId = item._id || item.id;
    const daysLeft = item.deadline
      ? Math.ceil((new Date(item.deadline) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    // Check if current user is the event creator
    const isCreator = item.createdBy?._id === currentUserId || item.createdBy === currentUserId;

    return (
      <View style={styles.eventCard}>
        <TouchableOpacity
          style={styles.cardTouchable}
          onPress={() => handleEventPress(eventId)}
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

          {/* Status Badge (top right) */}
          {statusInfo?.badge && (
            <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
              <Ionicons name={statusInfo.icon} size={14} color="#fff" />
              <Text style={styles.statusText}>{statusInfo.text}</Text>
            </View>
          )}

        {/* Event Content */}
        <View style={styles.eventContent}>
          {/* Event Title */}
          <Text style={styles.eventTitle}>{item.eventTitle || item.title}</Text>

          {/* Recipient Info */}
          {(item.recipientName || item.recipientUser) && (
            <View style={styles.recipientRow}>
              <Text style={styles.recipientText}>
                For: <Text style={styles.recipientName}>
                  {item.recipientName || 
                   (item.recipientUser && `${item.recipientUser.fname} ${item.recipientUser.lname}`)}
                </Text>
              </Text>
            </View>
          )}

          {/* Event Date */}
          {item.eventDate && (
            <View style={styles.infoRow}>
              <Ionicons name="calendar-outline" size={16} color="#666" />
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
              <Ionicons name="trending-up" size={16} color="#4ECDC4" />
              <Text style={styles.stockText}>
                {item.selectedInvestments.map(s => s.symbol).join(', ')}
              </Text>
            </View>
          )}

          {/* Progress Bar */}
          {!Number.isNaN(progress) && (
            <View style={styles.progressSection}>
              <View style={styles.progressBar}>
                <LinearGradient
                  colors={isFullyFunded ? ['#4ECDC4', '#44A08D'] : ['#FF6B6B', '#FF8E53']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
                />
              </View>
              <View style={styles.progressInfo}>
                <Text style={styles.progressText}>
                  ${(item.currentAmount || 0).toFixed(0)} / ${(item.targetAmount || 0).toFixed(0)}
                </Text>
                <Text style={[
                  styles.progressPercent,
                  isFullyFunded && styles.progressPercentComplete
                ]}>
                  {progress.toFixed(0)}%
                </Text>
              </View>
            </View>
          )}
          {/* Contributors Count */}
          {item.contributors && item.contributors.length > 0 && (
            <View style={styles.contributorsRow}>
              <Ionicons name="people" size={16} color="#666" />
              <Text style={styles.contributorsText}>
                {item.contributors.length} contributor{item.contributors.length !== 1 ? 's' : ''}
              </Text>
            </View>
          )}

          {/* Days Left */}
          {item.status === 'active' && daysLeft && daysLeft > 0 && (
            <View style={styles.daysLeftContainer}>
              <Ionicons name="time-outline" size={14} color="#FF6B6B" />
              <Text style={styles.daysLeftText}>
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} left
              </Text>
            </View>
          )}

          {/* ✅ NEW: Manage Funds Button (For Creator When Funded) */}
          {isCreator && (item.status === 'funded' || item.status === 'purchasing') && (
            <TouchableOpacity
              style={styles.manageFundsButton}
              onPress={(e) => {
                e.stopPropagation();
                navigation.navigate('ManageEventFunds', { eventId });
              }}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.manageFundsGradient}
              >
                <Ionicons name="wallet" size={18} color="#fff" />
                <Text style={styles.manageFundsText}>Manage Funds</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Contribute Button (For Active Events) */}
          {item.status === 'active' && !isFullyFunded && (
            <TouchableOpacity
              style={styles.contributeButton}
              onPress={() => {
                navigation.navigate('ContributionScreen', { eventId });
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
            console.log('🗑️ Delete button pressed for event:', eventId);
            handleDelete(eventId, item.eventTitle || item.title);
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
        {['all', 'active', 'funded', 'invested'].map((filterOption) => (
          <TouchableOpacity
            key={filterOption}
            style={[
              styles.filterTab,
              filter === filterOption && styles.filterTabActive
            ]}
            onPress={() => setFilter(filterOption)}
          >
            <Text style={[
              styles.filterTabText,
              filter === filterOption && styles.filterTabTextActive
            ]}>
              {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📊</Text>
      <Text style={styles.emptyTitle}>No events found</Text>
      <Text style={styles.emptySubtitle}>
        {filter === 'all' 
          ? 'Create your first investment event!'
          : `No ${filter} events yet`
        }
      </Text>
      <TouchableOpacity style={styles.emptyButton} onPress={handleCreateEvent}>
        <Text style={styles.emptyButtonText}>Create Event</Text>
      </TouchableOpacity>
      <TouchableOpacity  style={styles.emptyButton}
        onPress={() => navigation.navigate('EventTypeSelection')}
      >
        <Text style={styles.emptyButtonText}>Create Event New</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading && events.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading events...</Text>
      </View>
    );
  }

  const filteredEvents = events.filter(event => {
    if (filter === 'all') return true;
    if (filter === 'active') return event.status === 'active';
    if (filter === 'funded') return event.status === 'funded';
    if (filter === 'invested') return event.status === 'invested' || event.status === 'completed';
    return true;
  });

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredEvents}
        renderItem={renderEventCard}
        keyExtractor={(item) => item._id || item.id}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B6B"
          />
        }
      />

      {/* Create Event FAB */}
      <TouchableOpacity style={styles.floatingButton} onPress={handleCreateEvent}>
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
      
      <TouchableOpacity  style={styles.floatingButton}
        onPress={() => navigation.navigate('EventTypeSelection')}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <Ionicons name="add" size={32} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: '#F5F5F5',
  },
  filterTabActive: {
    backgroundColor: '#FF6B6B',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTabTextActive: {
    color: '#fff',
  },
  eventCard: {
    position: 'relative',
    backgroundColor: '#fff',
    borderRadius: 20,
    marginHorizontal: 16,
    marginTop: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardTouchable: {
    flex: 1,
    zIndex: 1,
  },
  eventImage: {
    width: '100%',
    height: 200,
    backgroundColor: '#F0F0F0',
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    left: 12,
    backgroundColor: '#FF6B6B',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 999,
  },
  eventContent: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  recipientRow: {
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 14,
    color: '#666',
  },
  recipientName: {
    fontWeight: '700',
    color: '#333',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
  },
  stockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  stockText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
    flex: 1,
  },
  progressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#F0F0F0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  progressPercent: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  progressPercentComplete: {
    color: '#4ECDC4',
  },
  contributorsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  contributorsText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
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
    color: '#FF6B6B',
  },
  manageFundsButton: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 8,
  },
  manageFundsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  manageFundsText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 8,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FF6B6B',
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  contributeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  floatingButton: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EventFeed;