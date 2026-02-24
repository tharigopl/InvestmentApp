import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import apiClient from '../../util/api-client';

export default function ManageInvitesScreen({ route, navigation }) {
  const { eventId } = route.params;

  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'going', 'pending'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadGuestList();
  }, []);

  const loadGuestList = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/events/${eventId}/guests`);
      
      // Combine registered users and external guests
      const allGuests = [
        ...(response.data.registeredUsers || []).map(p => ({
          ...p,
          type: 'registered',
          name: p.user ? `${p.user.fname} ${p.user.lname}` : 'Unknown',
          email: p.user?.email,
        })),
        ...(response.data.externalGuests || []).map(g => ({
          ...g,
          type: 'external',
        })),
      ];
      
      setGuests(allGuests);
      setStats(response.data.stats);
      
      // Also load event details
      const eventResponse = await apiClient.get(`/events/${eventId}`);
      setEvent(eventResponse.data.event || eventResponse.data);
      
    } catch (error) {
      console.error('Error loading guests:', error);
      Alert.alert('Error', 'Failed to load guest list');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReminder = async () => {
    try {
      Alert.alert(
        'Send Reminder',
        'Send RSVP reminder to all pending guests?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Send',
            onPress: async () => {
              await apiClient.post(`/events/${eventId}/remind`);
              Alert.alert('Success', 'Reminders sent!');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send reminders');
    }
  };

  const handleRemoveGuest = async (guestId, guestEmail) => {
    try {
      Alert.alert(
        'Remove Guest',
        'Are you sure you want to remove this guest?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const identifier = guestId || guestEmail;
              await apiClient.delete(`/events/${eventId}/guests/${identifier}`);
              loadGuestList();
              Alert.alert('Success', 'Guest removed');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to remove guest');
    }
  };

  const filteredGuests = guests.filter(guest => {
    // Filter by tab
    if (activeTab === 'going' && guest.rsvpStatus !== 'going') return false;
    if (activeTab === 'pending' && guest.rsvpStatus !== 'pending') return false;
    
    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        guest.name?.toLowerCase().includes(query) ||
        guest.email?.toLowerCase().includes(query)
      );
    }
    
    return true;
  });

  const renderGuestItem = ({ item: guest }) => (
    <View style={styles.guestCard}>
      <View style={styles.guestAvatar}>
        <Text style={styles.guestInitial}>
          {guest.name?.charAt(0).toUpperCase() || '?'}
        </Text>
      </View>
      
      <View style={styles.guestInfo}>
        <Text style={styles.guestName}>{guest.name || 'Unknown'}</Text>
        <Text style={styles.guestEmail}>{guest.email}</Text>
        {guest.type === 'external' && (
          <View style={styles.externalBadge}>
            <Text style={styles.externalText}>External Guest</Text>
          </View>
        )}
      </View>
      
      <View style={styles.guestStatus}>
        {guest.rsvpStatus === 'going' && (
          <View style={[styles.statusBadge, styles.statusGoing]}>
            <Ionicons name="checkmark-circle" size={16} color="#4ECDC4" />
            <Text style={[styles.statusText, { color: '#4ECDC4' }]}>Going</Text>
          </View>
        )}
        {guest.rsvpStatus === 'maybe' && (
          <View style={[styles.statusBadge, styles.statusMaybe]}>
            <Ionicons name="help-circle" size={16} color="#FFD93D" />
            <Text style={[styles.statusText, { color: '#FFB84D' }]}>Maybe</Text>
          </View>
        )}
        {guest.rsvpStatus === 'pending' && (
          <View style={[styles.statusBadge, styles.statusPending]}>
            <Ionicons name="time" size={16} color="#999" />
            <Text style={[styles.statusText, { color: '#999' }]}>Pending</Text>
          </View>
        )}
        {guest.rsvpStatus === 'not_going' && (
          <View style={[styles.statusBadge, styles.statusNotGoing]}>
            <Ionicons name="close-circle" size={16} color="#FF6B6B" />
            <Text style={[styles.statusText, { color: '#FF6B6B' }]}>Can't Make It</Text>
          </View>
        )}
        
        <TouchableOpacity
          onPress={() => handleRemoveGuest(guest._id, guest.email)}
          style={styles.removeButton}
        >
          <Ionicons name="trash-outline" size={20} color="#FF6B6B" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Manage Guests</Text>
          <Text style={styles.headerSubtitle}>{event?.eventTitle}</Text>
        </View>
      </LinearGradient>

      {/* Stats Cards */}
      {stats && (
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total Invited</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#4ECDC4' }]}>{stats.going}</Text>
            <Text style={styles.statLabel}>Going</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#999' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          
          <View style={styles.statCard}>
            <Text style={[styles.statNumber, { color: '#FFD93D' }]}>{stats.responseRate}%</Text>
            <Text style={styles.statLabel}>Response Rate</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All ({guests.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'going' && styles.tabActive]}
          onPress={() => setActiveTab('going')}
        >
          <Text style={[styles.tabText, activeTab === 'going' && styles.tabTextActive]}>
            Going ({guests.filter(g => g.rsvpStatus === 'going').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending ({guests.filter(g => g.rsvpStatus === 'pending').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search guests..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Guest List */}
      <FlatList
        data={filteredGuests}
        renderItem={renderGuestItem}
        keyExtractor={(item, index) => item._id || item.email || index.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No guests found</Text>
          </View>
        }
      />

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => navigation.navigate('AddGuests', { eventId })}
        >
          <Ionicons name="person-add" size={20} color="#4ECDC4" />
          <Text style={styles.actionButtonText}>Add Guests</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.actionButtonPrimary]}
          onPress={handleSendReminder}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.actionButtonGradient}
          >
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={styles.actionButtonTextWhite}>Send Reminder</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#999',
    textAlign: 'center',
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  tabActive: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#666',
  },
  tabTextActive: {
    color: '#fff',
  },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },

  // List
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },

  // Guest Card
  guestCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  guestAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4ECDC4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  guestInitial: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  guestEmail: {
    fontSize: 14,
    color: '#666',
  },
  externalBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD93D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  externalText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  guestStatus: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  statusGoing: {
    backgroundColor: '#F0FFFE',
  },
  statusMaybe: {
    backgroundColor: '#FFF9E6',
  },
  statusPending: {
    backgroundColor: '#F5F5F5',
  },
  statusNotGoing: {
    backgroundColor: '#FFE6E6',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  removeButton: {
    padding: 4,
  },

  // Empty State
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },

  // Bottom Bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  actionButtonPrimary: {
    borderWidth: 0,
    overflow: 'hidden',
  },
  actionButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 8,
  },
  actionButtonTextWhite: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});