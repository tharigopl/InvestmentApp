// client/screens/evite/ManageInvitesScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../../util/api-client';
import { showAlert } from '../../util/platform-alert';

const ManageInvitesScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  
  const [event, setEvent] = useState(null);
  const [guests, setGuests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, going, maybe, pending, not_going
  
  // Add Guest Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newGuest, setNewGuest] = useState({
    name: '',
    email: '',
    phone: '',
  });
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    loadEventAndGuests();
  }, [eventId]);

  const loadEventAndGuests = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get(`/events/${eventId}`);
      setEvent(response.data);
      console.log(response.data.event.guestList);
      setGuests(response.data.event.guestList || []);
    } catch (error) {
      console.error('Error loading event:', error);
      showAlert('Error', 'Failed to load event details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddGuest = async () => {
    // Validation
    if (!newGuest.name.trim()) {
      showAlert('Required Field', 'Please enter guest name');
      return;
    }

    if (!newGuest.email.trim() && !newGuest.phone.trim()) {
      showAlert('Required Field', 'Please enter email or phone number');
      return;
    }

    // Email validation if provided
    if (newGuest.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(newGuest.email)) {
        showAlert('Invalid Email', 'Please enter a valid email address');
        return;
      }
    }

    try {
      setIsAdding(true);

      await apiClient.post(`/events/${eventId}/invite`, {
        guests: [{
          name: newGuest.name,
          email: newGuest.email || null,
          phone: newGuest.phone || null,
        }],
      });

      showAlert('✅ Guest Added', `${newGuest.name} has been added to the guest list`);
      
      // Reset form and close modal
      setNewGuest({ name: '', email: '', phone: '' });
      setShowAddModal(false);
      
      // Reload guests
      loadEventAndGuests();

    } catch (error) {
      console.error('Error adding guest:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to add guest');
    } finally {
      setIsAdding(false);
    }
  };

  const handleRemoveGuest = (guest) => {
    showAlert(
      'Remove Guest',
      `Remove ${guest.name} from the guest list?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/events/${eventId}/guests/${guest._id}`);
              showAlert('Removed', `${guest.name} has been removed`);
              loadEventAndGuests();
            } catch (error) {
              console.error('Error removing guest:', error);
              showAlert('Error', 'Failed to remove guest');
            }
          },
        },
      ]
    );
  };

  const handleResendInvite = async (guest) => {
    try {
      await apiClient.post(`/events/${eventId}/resend-invite`, {
        guestId: guest._id,
      });
      showAlert('✅ Invitation Sent', `Invitation resent to ${guest.name}`);
    } catch (error) {
      console.error('Error resending invite:', error);
      showAlert('Error', 'Failed to resend invitation');
    }
  };

  const handleSendAllInvites = async () => {
    const pendingGuests = guests.filter(g => g.rsvpStatus === 'pending');
    
    if (pendingGuests.length === 0) {
      showAlert('No Pending Invites', 'All guests have already been invited');
      return;
    }

    showAlert(
      'Send Invitations',
      `Send invitations to ${pendingGuests.length} pending guest${pendingGuests.length !== 1 ? 's' : ''}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send',
          onPress: async () => {
            try {
              await apiClient.post(`/events/${eventId}/send-all-invites`);
              showAlert('✅ Invitations Sent', `Invitations sent to ${pendingGuests.length} guests`);
              loadEventAndGuests();
            } catch (error) {
              console.error('Error sending invites:', error);
              showAlert('Error', 'Failed to send invitations');
            }
          },
        },
      ]
    );
  };

  const getFilteredGuests = () => {
    let filtered = guests;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(g => g.rsvpStatus === filterStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(g => 
        g.name?.toLowerCase().includes(query) ||
        g.email?.toLowerCase().includes(query) ||
        g.phone?.includes(query)
      );
    }

    return filtered;
  };

  const getRSVPStats = () => {
    return {
      total: guests.length,
      going: guests.filter(g => g.rsvpStatus === 'going').length,
      maybe: guests.filter(g => g.rsvpStatus === 'maybe').length,
      notGoing: guests.filter(g => g.rsvpStatus === 'not_going').length,
      pending: guests.filter(g => g.rsvpStatus === 'pending').length,
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'going': return '#4ECDC4';
      case 'maybe': return '#FFD93D';
      case 'not_going': return '#FF6B6B';
      case 'pending': return '#999';
      default: return '#999';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'going': return 'checkmark-circle';
      case 'maybe': return 'help-circle';
      case 'not_going': return 'close-circle';
      case 'pending': return 'time';
      default: return 'person';
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'going': return 'Going';
      case 'maybe': return 'Maybe';
      case 'not_going': return 'Not Going';
      case 'pending': return 'Pending';
      default: return 'Unknown';
    }
  };

  const renderGuestItem = ({ item: guest }) => (
    <View style={styles.guestCard}>
      <View style={styles.guestHeader}>
        <View style={styles.guestInfo}>
          <Text style={styles.guestName}>{guest.name}</Text>
          {guest.email && (
            <View style={styles.contactRow}>
              <Ionicons name="mail-outline" size={14} color="#666" />
              <Text style={styles.contactText}>{guest.email}</Text>
            </View>
          )}
          {guest.phone && (
            <View style={styles.contactRow}>
              <Ionicons name="call-outline" size={14} color="#666" />
              <Text style={styles.contactText}>{guest.phone}</Text>
            </View>
          )}
          {guest.plusOnes > 0 && (
            <View style={styles.contactRow}>
              <Ionicons name="people-outline" size={14} color="#666" />
              <Text style={styles.contactText}>+{guest.plusOnes} guest{guest.plusOnes !== 1 ? 's' : ''}</Text>
            </View>
          )}
        </View>

        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(guest.rsvpStatus)}20` }]}>
          <Ionicons 
            name={getStatusIcon(guest.rsvpStatus)} 
            size={16} 
            color={getStatusColor(guest.rsvpStatus)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(guest.rsvpStatus) }]}>
            {getStatusLabel(guest.rsvpStatus)}
          </Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.guestActions}>
        {guest.rsvpStatus === 'pending' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleResendInvite(guest)}
          >
            <Ionicons name="paper-plane-outline" size={18} color="#4ECDC4" />
            <Text style={styles.actionButtonText}>Resend</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleRemoveGuest(guest)}
        >
          <Ionicons name="trash-outline" size={18} color="#FF6B6B" />
          <Text style={[styles.actionButtonText, { color: '#FF6B6B' }]}>Remove</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading guest list...</Text>
      </View>
    );
  }

  const stats = getRSVPStats();
  const filteredGuests = getFilteredGuests();

  return (
    <View style={styles.container}>
      {/* Header with Stats */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerTitle}>Guest List</Text>
        <Text style={styles.headerSubtitle}>{event?.eventTitle}</Text>

        {/* RSVP Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{stats.total}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#4ECDC4' }]}>{stats.going}</Text>
            <Text style={styles.statLabel}>Going</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#FFD93D' }]}>{stats.maybe}</Text>
            <Text style={styles.statLabel}>Maybe</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statNumber, { color: '#999' }]}>{stats.pending}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Search and Filters */}
      <View style={styles.controlsContainer}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search guests..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
        >
          {['all', 'going', 'maybe', 'pending', 'not_going'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterButton,
                filterStatus === status && styles.filterButtonActive
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text style={[
                styles.filterText,
                filterStatus === status && styles.filterTextActive
              ]}>
                {status === 'all' ? 'All' : getStatusLabel(status)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Guest List */}
      <FlatList
        data={filteredGuests}
        renderItem={renderGuestItem}
        keyExtractor={(item, index) => item._id || index.toString()}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#CCC" />
            <Text style={styles.emptyTitle}>No Guests Yet</Text>
            <Text style={styles.emptyText}>
              {searchQuery || filterStatus !== 'all' 
                ? 'No guests match your search' 
                : 'Start adding guests to your event'}
            </Text>
          </View>
        }
      />

      {/* Action Buttons */}
      <View style={styles.actionBar}>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            <Ionicons name="person-add" size={24} color="#fff" />
            <Text style={styles.addButtonText}>Add Guest</Text>
          </LinearGradient>
        </TouchableOpacity>

        {stats.pending > 0 && (
          <TouchableOpacity
            style={styles.sendAllButton}
            onPress={handleSendAllInvites}
          >
            <Ionicons name="paper-plane" size={20} color="#FF6B6B" />
            <Text style={styles.sendAllText}>Send All Invites</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Add Guest Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Guest</Text>
              <TouchableOpacity onPress={() => setShowAddModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={newGuest.name}
                  onChangeText={(text) => setNewGuest({ ...newGuest, name: text })}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  value={newGuest.email}
                  onChangeText={(text) => setNewGuest({ ...newGuest, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  value={newGuest.phone}
                  onChangeText={(text) => setNewGuest({ ...newGuest, phone: text })}
                  keyboardType="phone-pad"
                />
              </View>

              <Text style={styles.inputHint}>
                * At least one contact method (email or phone) is required
              </Text>
            </ScrollView>

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddGuest}
              disabled={isAdding}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isAdding ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="person-add" size={24} color="#fff" />
                    <Text style={styles.submitText}>Add Guest</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  header: {
    padding: 24,
    paddingTop: 32,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    marginBottom: 24,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statBox: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  controlsContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    fontSize: 16,
    color: '#333',
  },
  filterContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#FF6B6B',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  listContainer: {
    padding: 16,
  },
  guestCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  guestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  guestInfo: {
    flex: 1,
  },
  guestName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  guestActions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F5F5F5',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  actionBar: {
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    gap: 12,
  },
  addButton: {
    borderRadius: 25,
    overflow: 'hidden',
  },
  addButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  sendAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#FF6B6B',
    backgroundColor: '#fff',
  },
  sendAllText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  inputHint: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
  submitButton: {
    margin: 20,
    borderRadius: 25,
    overflow: 'hidden',
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
});

export default ManageInvitesScreen;