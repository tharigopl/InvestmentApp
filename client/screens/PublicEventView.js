// client/screens/PublicEventView.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Platform,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import axios from 'axios';
import { showAlert } from '../util/platform-alert';
import apiClient from '../util/api-client';

const PublicEventView = ({ route, navigation }) => {
  const { shareId } = route.params;
  
  const [event, setEvent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // RSVP Modal
  const [showRSVPModal, setShowRSVPModal] = useState(false);
  const [rsvpForm, setRsvpForm] = useState({
    name: '',
    email: '',
    rsvpStatus: 'going',
    plusOnes: 0,
    dietaryRestrictions: '',
  });
  const [isSubmittingRSVP, setIsSubmittingRSVP] = useState(false);

  useEffect(() => {
    loadPublicEvent();
  }, [shareId]);

  const loadPublicEvent = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // ✅ Public API call (no auth token needed)
      const API_URL = Platform.OS === 'web' 
        ? 'http://localhost:5000/api'
        : 'http://10.0.2.2:5000/api';
      
      //const response = await axios.get(/public/events/${shareId}`);
      const response = await apiClient.get(`/public/events/${shareId}`);
      
      setEvent(response.data.event);
      
    } catch (error) {
      console.error('Error loading public event:', error);
      setError(error.response?.data?.message || 'Event not found');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRSVP = async () => {
    // Validation
    if (!rsvpForm.name.trim() || !rsvpForm.email.trim()) {
      showAlert('Required Fields', 'Please enter your name and email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rsvpForm.email)) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsSubmittingRSVP(true);

      const API_URL = Platform.OS === 'web' 
        ? 'http://localhost:5000/api'
        : 'http://10.0.2.2:5000/api';

      //await axios.post(`${API_URL}/public/events/${shareId}/rsvp`, rsvpForm);
      await apiClient.post(`/public/events/${shareId}/rsvp`, rsvpForm);
      showAlert(
        '✅ RSVP Confirmed!',
        `Thanks ${rsvpForm.name}! We'll see you there!`,
        [
          {
            text: 'OK',
            onPress: () => {
              setShowRSVPModal(false);
              loadPublicEvent(); // Refresh to show updated count
            }
          }
        ]
      );

    } catch (error) {
      console.error('RSVP error:', error);
      showAlert('Error', error.response?.data?.message || 'Failed to save RSVP');
    } finally {
      setIsSubmittingRSVP(false);
    }
  };

  const handleContribute = () => {
    navigation.navigate('GuestContribution', { 
      shareId, 
      event 
    });
  };

  const handleShare = async () => {
    const shareUrl = Platform.OS === 'web'
      ? `${window.location.origin}/events/share/${shareId}`
      : `https://yourapp.com/events/share/${shareId}`;

    const shareMessage = `🎉 You're invited to ${event.eventTitle}!

For: ${event.recipientUser?.name || 'Someone special'}
📅 ${event.eventDate ? new Date(event.eventDate).toLocaleDateString() : 'Date TBD'}
${event.location?.address ? `📍 ${event.location.address}` : ''}

${event.hasGoal ? `💰 Goal: $${event.targetAmount} (${((event.currentAmount / event.targetAmount) * 100).toFixed(0)}% funded)` : `💰 Total Raised: $${event.currentAmount || 0}`}

RSVP & Contribute: ${shareUrl}`;

    if (Platform.OS === 'web') {
      if (navigator.share) {
        try {
          await navigator.share({
            title: event.eventTitle,
            text: shareMessage,
            url: shareUrl,
          });
        } catch (error) {
          // User cancelled or error - try copy instead
          copyToClipboard(shareUrl);
        }
      } else {
        copyToClipboard(shareUrl);
      }
    } else {
      // Mobile
      try {
        const { Share } = require('react-native');
        await Share.share({
          message: shareMessage,
          title: event.eventTitle,
        });
      } catch (error) {
        console.error('Share error:', error);
      }
    }
  };

  const copyToClipboard = async (text) => {
    if (Platform.OS === 'web') {
      try {
        await navigator.clipboard.writeText(text);
        showAlert('✅ Link Copied!', 'Event link copied to clipboard');
      } catch (error) {
        showAlert('Link', text);
      }
    } else {
      const { Clipboard } = require('react-native');
      Clipboard.setString(text);
      showAlert('✅ Link Copied!', 'Event link copied to clipboard');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorTitle}>Event Not Found</Text>
        <Text style={styles.errorText}>
          {error || 'This event link may be invalid or the event has been removed.'}
        </Text>
      </View>
    );
  }

  const progress = event.hasGoal && event.targetAmount > 0
    ? (event.currentAmount / event.targetAmount) * 100
    : 0;
  const isFullyFunded = progress >= 100;

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={isFullyFunded ? ['#4ECDC4', '#44A08D'] : ['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🎁</Text>
        <Text style={styles.eventTitle}>{event.eventTitle}</Text>
        {event.recipientUser && (
          <Text style={styles.recipientText}>
            For: {event.recipientUser.name}
          </Text>
        )}
      </LinearGradient>

      {/* Design Image */}
      {event.design?.customImageUrl && (
        <Image 
          source={{ uri: event.design.customImageUrl }}
          style={styles.designImage}
          resizeMode="cover"
        />
      )}

        {/* Event Details */}
        <View style={styles.content}>{[
        /* Event Type */
        event.eventType ? (
            <View key="eventType" style={styles.infoRow}>
            <Ionicons name="pricetag" size={20} color="#666" />
            <Text style={styles.infoText}>
                {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
            </Text>
            </View>
        ) : null,

        /* Date */
        event.eventDate ? (
            <View key="eventDate" style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoText}>
                {new Date(event.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                })}
                {event.eventTime ? ` at ${event.eventTime}` : ''}
            </Text>
            </View>
        ) : null,

        /* Location */
        event.location?.address ? (
            <View key="location" style={styles.infoRow}>
            <Ionicons name="location" size={20} color="#666" />
            <View style={styles.locationInfo}>
                {event.location.venueName ? (
                <Text style={styles.venueName}>{event.location.venueName}</Text>
                ) : null}
                <Text style={styles.address}>
                {event.location.address}
                {event.location.city ? `, ${event.location.city}` : ''}
                {event.location.state ? `, ${event.location.state}` : ''}
                </Text>
            </View>
            </View>
        ) : null,

        /* Description */
        event.eventDescription ? (
            <View key="description" style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>{event.eventDescription}</Text>
            </View>
        ) : null,
        ].filter(Boolean)}

        {/* Progress Section */}
        {(event.registryType === 'stock' || event.registryType === 'cash_fund') && (
        <View style={styles.progressSection}>{[
            <Text key="title" style={styles.sectionTitle}>
            {event.hasGoal ? 'Funding Progress' : 'Total Contributions'}
            </Text>,
            
            event.hasGoal && event.targetAmount > 0 ? (
            <View key="withGoal">
                <View style={styles.progressBar}>
                <LinearGradient
                    colors={isFullyFunded ? ['#4ECDC4', '#44A08D'] : ['#FF6B6B', '#FF8E53']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
                />
                </View>
                
                <View style={styles.progressStats}>
                <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>
                    ${event.currentAmount?.toFixed(2) || '0.00'}
                    </Text>
                    <Text style={styles.progressStatLabel}>Raised</Text>
                </View>
                
                <View style={styles.progressStat}>
                    <Text style={[styles.progressStatValue, isFullyFunded && styles.statValueComplete]}>
                    {progress.toFixed(0)}%
                    </Text>
                    <Text style={styles.progressStatLabel}>Funded</Text>
                </View>
                
                <View style={styles.progressStat}>
                    <Text style={styles.progressStatValue}>
                    ${event.targetAmount?.toFixed(2) || '0.00'}
                    </Text>
                    <Text style={styles.progressStatLabel}>Goal</Text>
                </View>
                </View>
            </View>
            ) : (
            <View key="noGoal" style={styles.goallessProgress}>
                <Text style={styles.totalRaisedAmount}>
                ${(event.currentAmount || 0).toFixed(2)}
                </Text>
                <Text style={styles.totalRaisedLabel}>Total Raised</Text>
                <View style={styles.contributorCount}>
                <Ionicons name="people" size={18} color="#4ECDC4" />
                <Text style={styles.contributorText}>
                    {event.contributorCount || 0} contribution{(event.contributorCount || 0) !== 1 ? 's' : ''}
                </Text>
                </View>
            </View>
            ),
        ]}</View>
        )}

        {/* RSVP Stats */}
        {event.rsvpStats && event.rsvpStats.total > 0 && (
        <View style={styles.rsvpSection}>
            <Text style={styles.sectionTitle}>Guest Responses</Text>
            <View style={styles.rsvpStats}>
            <View style={styles.rsvpStat}>
                <Text style={styles.rsvpNumber}>{event.rsvpStats.going}</Text>
                <Text style={styles.rsvpLabel}>Going</Text>
            </View>
            <View style={styles.rsvpStat}>
                <Text style={styles.rsvpNumber}>{event.rsvpStats.maybe}</Text>
                <Text style={styles.rsvpLabel}>Maybe</Text>
            </View>
            <View style={styles.rsvpStat}>
                <Text style={styles.rsvpNumber}>{event.rsvpStats.pending}</Text>
                <Text style={styles.rsvpLabel}>Pending</Text>
            </View>
            </View>
        </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>{[
        /* RSVP Button */
        event.publicSettings?.allowGuestRSVP ? (
            <TouchableOpacity
            key="rsvp"
            style={styles.primaryButton}
            onPress={() => setShowRSVPModal(true)}
            >
            <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
            >
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.buttonText}>RSVP</Text>
            </LinearGradient>
            </TouchableOpacity>
        ) : null,

        /* Contribute Button */
        event.publicSettings?.allowGuestContributions ? (
            <TouchableOpacity
            key="contribute"
            style={styles.primaryButton}
            onPress={handleContribute}
            >
            <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
            >
                <Ionicons name="gift" size={24} color="#fff" />
                <Text style={styles.buttonText}>Contribute</Text>
            </LinearGradient>
            </TouchableOpacity>
        ) : null,

        /* Share Button */
        <TouchableOpacity
            key="share"
            style={styles.secondaryButton}
            onPress={handleShare}
        >
            <Ionicons name="share-social" size={20} color="#4ECDC4" />
            <Text style={styles.secondaryButtonText}>Share Event</Text>
        </TouchableOpacity>,
        ].filter(Boolean)}</View>

        {/* Host Info */}
        {event.createdBy && (
        <View style={styles.hostSection}>
            <Text style={styles.hostLabel}>Hosted by</Text>
            <Text style={styles.hostName}>{event.createdBy.name}</Text>
        </View>
        )}
      </View>

      {/* RSVP Modal */}
      <Modal
        visible={showRSVPModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowRSVPModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>RSVP to {event.eventTitle}</Text>
              <TouchableOpacity onPress={() => setShowRSVPModal(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              {/* Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John Doe"
                  value={rsvpForm.name}
                  onChangeText={(text) => setRsvpForm({ ...rsvpForm, name: text })}
                />
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  value={rsvpForm.email}
                  onChangeText={(text) => setRsvpForm({ ...rsvpForm, email: text })}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* RSVP Status */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Will you attend?</Text>
                <View style={styles.rsvpOptions}>
                  {['going', 'maybe', 'not_going'].map((status) => (
                    <TouchableOpacity
                      key={status}
                      style={[
                        styles.rsvpOption,
                        rsvpForm.rsvpStatus === status && styles.rsvpOptionActive
                      ]}
                      onPress={() => setRsvpForm({ ...rsvpForm, rsvpStatus: status })}
                    >
                      <Text style={[
                        styles.rsvpOptionText,
                        rsvpForm.rsvpStatus === status && styles.rsvpOptionTextActive
                      ]}>
                        {status === 'going' ? '✅ Going' : status === 'maybe' ? '🤔 Maybe' : '❌ Can\'t Go'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Plus Ones */}
              {rsvpForm.rsvpStatus === 'going' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Plus Ones</Text>
                  <View style={styles.plusOneControls}>
                    <TouchableOpacity
                      style={styles.plusOneButton}
                      onPress={() => setRsvpForm({ 
                        ...rsvpForm, 
                        plusOnes: Math.max(0, rsvpForm.plusOnes - 1) 
                      })}
                    >
                      <Ionicons name="remove" size={20} color="#666" />
                    </TouchableOpacity>
                    <Text style={styles.plusOneValue}>{rsvpForm.plusOnes}</Text>
                    <TouchableOpacity
                      style={styles.plusOneButton}
                      onPress={() => setRsvpForm({ 
                        ...rsvpForm, 
                        plusOnes: Math.min(5, rsvpForm.plusOnes + 1) 
                      })}
                    >
                      <Ionicons name="add" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Dietary Restrictions */}
              {rsvpForm.rsvpStatus === 'going' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Dietary Restrictions (Optional)</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="e.g., Vegetarian, Gluten-free..."
                    value={rsvpForm.dietaryRestrictions}
                    onChangeText={(text) => setRsvpForm({ ...rsvpForm, dietaryRestrictions: text })}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              )}
            </ScrollView>

            {/* Submit Button */}
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleRSVP}
              disabled={isSubmittingRSVP}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitGradient}
              >
                {isSubmittingRSVP ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                    <Text style={styles.submitText}>Submit RSVP</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F5F5F5',
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  header: {
    padding: 32,
    alignItems: 'center',
  },
  headerEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  designImage: {
    width: '100%',
    height: 200,
  },
  content: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  locationInfo: {
    flex: 1,
  },
  venueName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  descriptionContainer: {
    marginTop: 12,
    marginBottom: 24,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 24,
  },
  progressSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E5E5E5',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  statValueComplete: {
    color: '#4ECDC4',
  },
  progressStatLabel: {
    fontSize: 13,
    color: '#666',
  },
  goallessProgress: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  totalRaisedAmount: {
    fontSize: 42,
    fontWeight: '800',
    color: '#4ECDC4',
    marginBottom: 8,
  },
  totalRaisedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginBottom: 16,
  },
  contributorCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F0FFFE',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  contributorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  rsvpSection: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },
  rsvpStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  rsvpStat: {
    alignItems: 'center',
  },
  rsvpNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  rsvpLabel: {
    fontSize: 13,
    color: '#666',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  primaryButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    gap: 8,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  hostSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  hostLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
  },
  hostName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
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
    maxHeight: '90%',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  rsvpOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  rsvpOptionActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FFFE',
  },
  rsvpOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  rsvpOptionTextActive: {
    color: '#4ECDC4',
  },
  plusOneControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  plusOneButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  plusOneValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    minWidth: 40,
    textAlign: 'center',
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

export default PublicEventView;