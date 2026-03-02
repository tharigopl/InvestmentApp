// client/screens/EventDetails.js - UPDATED WITH EARLYBIRD STYLE + MANAGE FUNDS
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Share,
  Platform,
} from 'react-native';
// /import MapView, { Marker } from 'react-native-maps';
 import LocationMap from '../components/LocationMap';
 import { showAlert } from '../util/platform-alert';

import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { GlobalStyles } from '../constants/styles';
import { getEventById, cancelEvent } from '../util/events';
import { AuthContext } from '../store/auth-context';

const EventDetails = ({ route, navigation }) => {
  const { eventId } = route.params;
  const authCtx = useContext(AuthContext);
  const currentUserId = authCtx?.uid;
  
  const [event, setEvent] = useState(null);
  const [contributions, setContributions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadEventDetails();
  }, [eventId]);

  const loadEventDetails = async () => {
    try {
      setError(null);
      console.log('📡 Fetching event details for:', eventId);
      const eventData = await getEventById(eventId);
      console.log('✅ Event data loaded:', eventData);
      
      setEvent(eventData);
      // ✅ Use contributors from event data instead of separate API call
      setContributions(eventData.contributors || []);
    } catch (err) {
      console.error('❌ Error loading event details:', err);
      setError(err.message || 'Failed to load event details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadEventDetails();
  };

  const handleContribute = () => {
    if (event.status !== 'active') {
      showAlert('Event Closed', 'This event is no longer accepting contributions.');
      return;
    }
    navigation.navigate('ContributionScreen', { eventId: event._id || event.id });
  };

  const handleCancelEvent = () => {
    showAlert(
      'Cancel Event',
      'Are you sure you want to cancel this event? All contributions will be refunded.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelEvent(eventId, 'Cancelled by host');
              showAlert('Success', 'Event has been cancelled successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              showAlert('Error', 'Failed to cancel event. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    try {
      // Create share URL (adjust domain as needed)
      const shareUrl = event.shareId 
        ? (Platform.OS === 'web'
            ? `${window.location.origin}/events/share/${event.shareId}`
            : `https://localhost:8081/events/share/${event.shareId}`)
        : null;

      if (!shareUrl) {
        showAlert('Share Not Available', 'This event does not have a share link yet');
        return;
      }

      const eventUrl = shareUrl;
      
      const shareMessage = `🎉 You're invited to ${event.eventTitle || event.title}!
  
  For: ${event.recipientName || 
       (event.recipientUser && `${event.recipientUser.fname} ${event.recipientUser.lname}`) || 
       'Someone special'}
  📅 Date: ${event.eventDate ? new Date(event.eventDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }) : 'TBD'}
  ${event.location?.address ? `📍 Location: ${event.location.address}` : ''}
  
  ${event.hasGoal && event.targetAmount > 0 
    ? `💰 Goal: $${event.targetAmount} (${progress.toFixed(0)}% funded)`
    : `💰 Total Raised: $${event.currentAmount || 0}`}
  
  Join us! ${eventUrl}`;
  
      if (Platform.OS === 'web') {
        // Web: Use Web Share API if available, otherwise copy to clipboard
        if (navigator.share) {
          await navigator.share({
            title: event.eventTitle || event.title,
            text: shareMessage,
            url: eventUrl,
          });
        } else {
          // Fallback: Copy to clipboard
          await navigator.clipboard.writeText(shareMessage);
          showAlert('Copied!', 'Event details copied to clipboard');
        }
      } else {
        // Mobile: Use React Native Share
        const result = await Share.share({
          message: shareMessage,
          url: eventUrl, // iOS only
          title: event.eventTitle || event.title,
        });
  
        if (result.action === Share.sharedAction) {
          if (result.activityType) {
            console.log('Shared via:', result.activityType);
          } else {
            console.log('Shared successfully');
          }
        } else if (result.action === Share.dismissedAction) {
          console.log('Share dismissed');
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      showAlert('Error', 'Failed to share event. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading event...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadEventDetails}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Calculate progress safely
  let progress = 0;
  let remaining = 0;
  let isFullyFunded = false;
  const hasGoal = event.hasGoal && event.targetAmount > 0;

  if (hasGoal) {
    progress = (event.currentAmount / event.targetAmount) * 100;
    remaining = event.targetAmount - event.currentAmount;
    isFullyFunded = progress >= 100;
  } else {
    // Goalless event - no progress percentage
    progress = 0;
    remaining = 0;
    isFullyFunded = false;
  }

  console.log("EventDetails progress", progress, event.currentAmount, event.targetAmount, "hasGoal:", hasGoal);
  const isCreator = event.createdBy?._id === currentUserId || event.createdBy === currentUserId;
  const daysLeft = event.deadline
    ? Math.ceil((new Date(event.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  const getStatusInfo = () => {
    switch (event.status) {
      case 'funded':
        return {
          color: '#4ECDC4',
          icon: 'wallet',
          text: '💰 Ready to Invest',
          description: 'Goal reached! Time to buy stocks.',
        };
      case 'purchasing':
        return {
          color: '#FFD93D',
          icon: 'cart',
          text: '🛒 Purchasing Stocks',
          description: 'Host is buying the selected stocks.',
        };
      case 'invested':
        return {
          color: '#95E1D3',
          icon: 'checkmark-circle',
          text: '✅ Stocks Purchased',
          description: 'Investment complete! Stocks have been bought.',
        };
      case 'completed':
        return {
          color: '#A8E6CF',
          icon: 'gift',
          text: '🎁 Gift Delivered',
          description: 'Event completed successfully!',
        };
      default:
        return isFullyFunded ? {
          color: '#4ECDC4',
          icon: 'checkmark-circle',
          text: '🎉 Goal Reached!',
          description: 'Ready to invest!',
        } : {
          color: '#FF6B6B',
          icon: 'time',
          text: '⏳ Collecting Contributions',
          description: `$${remaining.toFixed(2)} more needed`,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} tintColor="#FF6B6B" />
      }
    >
      {/* Header with Gradient */}
      <LinearGradient
        colors={isFullyFunded ? ['#4ECDC4', '#44A08D'] : ['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🎁</Text>
        <Text style={styles.eventTitle}>{event.title || event.eventTitle}</Text>
        <Text style={styles.recipientText}>
          For: {event.recipientName || 
               (event.recipientUser && `${event.recipientUser.fname} ${event.recipientUser.lname}`)}
        </Text>
      </LinearGradient>

      {/* Status Banner */}
      <View style={[styles.statusBanner, { backgroundColor: `${statusInfo.color}20` }]}>
        <View style={[styles.statusIcon, { backgroundColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon} size={24} color="#fff" />
        </View>
        <View style={styles.statusTextContainer}>
          <Text style={[styles.statusTitle, { color: statusInfo.color }]}>
            {statusInfo.text}
          </Text>
          <Text style={styles.statusDescription}>{statusInfo.description}</Text>
        </View>
      </View>

      <View style={styles.content}>        
        {event.design?.customImageUrl && (
          <Image 
            source={{ uri: event.design.customImageUrl }}
            style={styles.designImage}
            resizeMode="cover"
          />
        )}
        {/* Event Type */}
        {event.eventType && (
          <View style={styles.infoRow}>
            <Ionicons name="pricetag" size={20} color="#666" />
            <Text style={styles.infoText}>
              {event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}
            </Text>
          </View>
        )}

        {/* Event Date */}
        {event.eventDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color="#666" />
            <Text style={styles.infoText}>
              {new Date(event.eventDate).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>
        )}

        {/* Description */}
        {event.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>About</Text>
            <Text style={styles.descriptionText}>{event.description}</Text>
          </View>
        )}

        {/* Add location section */}
        <LocationMap location={event.location} />
         {/*{event.location?.address && (
          <View style={styles.locationSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={24} color="#FF6B6B" />
              <Text style={styles.sectionTitle}>Location</Text>
            </View>
            
            <View style={styles.locationCard}>
              {event.location.venueName && (
                <Text style={styles.venueName}>{event.location.venueName}</Text>
              )}
              
              <Text style={styles.address}>
                {event.location.address}
                {event.location.city && `, ${event.location.city}`}
                {event.location.state && `, ${event.location.state}`}
              </Text>
              
              <TouchableOpacity 
                style={styles.directionsButton}
                onPress={() => {
                  const destination = encodeURIComponent(
                    `${event.location.address}${event.location.city ? `, ${event.location.city}` : ''}`
                  );
                  
                  if (Platform.OS === 'web') {
                    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destination}`);
                  } else if (Platform.OS === 'ios') {
                    Linking.openURL(`maps://app?daddr=${destination}`);
                  } else {
                    Linking.openURL(`google.navigation:q=${destination}`);
                  }
                }}
              >
                <Ionicons name="navigate" size={18} color="#4ECDC4" />
                <Text style={styles.directionsText}>Get Directions</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}*/}
        
        {/* Add RSVP stats section */}
        {event.guestList && event.guestList.length > 0 && (
          <View style={styles.rsvpSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={24} color="#4ECDC4" />
              <Text style={styles.sectionTitle}>Guest List</Text>
            </View>
            
            {/* RSVP Summary */}
            <View style={styles.rsvpSummary}>
              <View style={styles.rsvpStat}>
                <Text style={styles.rsvpNumber}>
                  {event.guestList.filter(g => g.rsvpStatus === 'going').length}
                </Text>
                <Text style={styles.rsvpLabel}>Going</Text>
              </View>
              
              <View style={styles.rsvpStat}>
                <Text style={styles.rsvpNumber}>
                  {event.guestList.filter(g => g.rsvpStatus === 'maybe').length}
                </Text>
                <Text style={styles.rsvpLabel}>Maybe</Text>
              </View>
              
              <View style={styles.rsvpStat}>
                <Text style={styles.rsvpNumber}>
                  {event.guestList.filter(g => g.rsvpStatus === 'pending').length}
                </Text>
                <Text style={styles.rsvpLabel}>Pending</Text>
              </View>
              
              <View style={styles.rsvpStat}>
                <Text style={styles.rsvpNumber}>{event.guestList.length}</Text>
                <Text style={styles.rsvpLabel}>Total</Text>
              </View>
            </View>
            
            {/* Manage Invites Button (if host) */}
            {isCreator && (
              <TouchableOpacity
                style={styles.manageInvitesButton}
                onPress={() => navigation.navigate('ManageInvites', { eventId: event._id })}
              >
                <LinearGradient
                  colors={['#4ECDC4', '#44A08D']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.manageInvitesGradient}
                >
                  <Ionicons name="settings" size={20} color="#fff" />
                  <Text style={styles.manageInvitesText}>Manage Guests</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Progress Section */}
        {(event.registryType === 'stock' || event.registryType === 'cash_fund') && (
          <View style={styles.progressSection}>
            <Text style={styles.sectionTitle}>
              {event.hasGoal ? 'Funding Progress' : 'Total Contributions'}
            </Text>
            
            {event.hasGoal && event.targetAmount > 0 ? (
              // WITH GOAL: Show progress bar
              <>
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
              </>
            ) : (
              // WITHOUT GOAL: Show total raised
              <View style={styles.goallessProgress}>
                <View style={styles.totalRaisedContainer}>
                  <Text style={styles.totalRaisedAmount}>
                    ${(event.currentAmount || 0).toFixed(2)}
                  </Text>
                  <Text style={styles.totalRaisedLabel}>Total Raised</Text>
                </View>
                
                <View style={styles.contributorCount}>
                  <Ionicons name="people" size={20} color="#4ECDC4" />
                  <Text style={styles.contributorText}>
                    {contributions.length} contribution{contributions.length !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}
            
            {/* Contributors List (same for both) */}
            {contributions.length > 0 && (
              <View style={styles.contributorsSection}>
                <Text style={styles.contributorsTitle}>Recent Contributors</Text>
                {contributions.slice(0, 5).map((contribution, index) => (
                  <View key={index} style={styles.contributorItem}>
                    <View style={styles.contributorAvatar}>
                      <Text style={styles.contributorInitial}>
                        {contribution.contributorName?.charAt(0).toUpperCase() || '?'}
                      </Text>
                    </View>
                    <View style={styles.contributorInfo}>
                      <Text style={styles.contributorName}>
                        {contribution.contributorName || 'Anonymous'}
                      </Text>
                      <Text style={styles.contributorAmount}>
                        ${contribution.amount?.toFixed(2) || '0.00'}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Selected Investments */}
        {event.selectedInvestments && event.selectedInvestments.length > 0 && (
          <View style={styles.investmentsSection}>
            <Text style={styles.sectionTitle}>📈 Investment Plan</Text>
            {event.selectedInvestments.map((stock, index) => (
              <View key={index} style={styles.stockCard}>
                <View style={styles.stockIcon}>
                  <Text style={styles.stockEmoji}>
                    {stock.symbol === 'AAPL' ? '🍎' : stock.symbol === 'GOOGL' ? '🔍' : '💻'}
                  </Text>
                </View>
                <View style={styles.stockInfo}>
                  <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                  <Text style={styles.stockName}>{stock.name}</Text>
                </View>
                {stock.allocation && (
                  <View style={styles.allocationBadge}>
                    <Text style={styles.allocationText}>{stock.allocation}%</Text>
                  </View>
                )}
                {stock.price && (
                  <Text style={styles.stockPrice}>${stock.price.toFixed(2)}</Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Contributors */}
        {contributions.length > 0 && (
          <View style={styles.contributorsSection}>
            <Text style={styles.sectionTitle}>
              👥 Amazing Contributors ({contributions.length})
            </Text>
            {contributions.map((contribution, index) => {
              // Get contributor name from populated user data
              const contributorName = contribution.isAnonymous 
                ? 'Anonymous'
                : contribution.user 
                  ? `${contribution.user.fname || ''} ${contribution.user.lname || ''}`.trim()
                  : `${contribution.guestName || ''}`.trim() != '' ? `${contribution.guestName || ''}`.trim() : 'Anonymous';
              
              const contributorInitial = contribution.isAnonymous || !contribution.user
                ? '?'
                : (contribution.user.fname?.[0] || contribution.user.lname?.[0] || '?').toUpperCase();

              return (
                <View key={index} style={styles.contributorCard}>
                  <View style={styles.contributorAvatar}>
                    <Text style={styles.contributorEmoji}>
                      {['🌟', '✨', '💫', '⭐', '🌙'][index % 5]}
                    </Text>
                  </View>
                  <View style={styles.contributorInfo}>
                    <Text style={styles.contributorName}>{contributorName}</Text>
                    <Text style={styles.contributionDate}>
                      {new Date(contribution.contributedAt || contribution.createdAt).toLocaleDateString()}
                    </Text>
                    {contribution.message && (
                      <Text style={styles.contributionMessage}>
                        "{contribution.message}"
                      </Text>
                    )}
                  </View>
                  <Text style={styles.contributionAmount}>
                    ${contribution.amount?.toFixed(2) || '0.00'}
                  </Text>
                </View>
              );
            })}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {/* ✅ NEW: Manage Funds Button (For Creator, When Funded) */}
          {isCreator && (event.status === 'funded' || event.status === 'purchasing') && (
            <TouchableOpacity
              style={styles.manageFundsButton}
              onPress={() => navigation.navigate('ManageEventFunds', { eventId: event._id || event.id })}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="wallet" size={24} color="#fff" />
                <Text style={styles.manageFundsButtonText}>Manage Funds & Purchase</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Contribute Button */}
          {event.status === 'active' && !isFullyFunded && (
            <TouchableOpacity style={styles.contributeButton} onPress={handleContribute}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="gift" size={24} color="#fff" />
                <Text style={styles.contributeButtonText}>Contribute Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Secondary Actions */}
          <View style={styles.secondaryActions}>
            <TouchableOpacity
              style={styles.secondaryButton} 
              onPress={handleShare}
            >
              {/*<View style={styles.shareButtonContent}>*/}
                <Ionicons name="share-social" size={20} color="#4ECDC4" />
                <Text style={[styles.secondaryButtonText, styles.shareText]}>Share Event</Text>
              {/*</View>*/}
            </TouchableOpacity>
            
            {isCreator && event.status === 'active' && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCancelEvent}>
                <Ionicons name="close-circle" size={20} color="#FF6B6B" />
                <Text style={[styles.secondaryButtonText, styles.cancelText]}>Cancel</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </ScrollView>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FFF9F0',
  },
  errorEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 25,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  header: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
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
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 16,
  },
  statusIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusTextContainer: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  statusDescription: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: '#666',
    marginLeft: 12,
  },
  descriptionContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  progressBar: {
    height: 16,
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
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
    color: '#FF6B6B',
    marginBottom: 4,
  },
  statValueComplete: {
    color: '#4ECDC4',
  },
  progressStatLabel: {
    fontSize: 14,
    color: '#666',
  },
  remainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF0F0',
    padding: 12,
    borderRadius: 12,
    marginTop: 16,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 8,
  },
  daysLeftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF0F0',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  daysLeftText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FF6B6B',
    marginLeft: 8,
  },
  investmentsSection: {
    marginBottom: 24,
  },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FCFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  stockIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stockEmoji: {
    fontSize: 28,
  },
  stockInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 2,
  },
  stockName: {
    fontSize: 14,
    color: '#666',
  },
  allocationBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  allocationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  contributorsSection: {
    marginBottom: 24,
  },
  contributorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  contributorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contributorEmoji: {
    fontSize: 24,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  contributionDate: {
    fontSize: 14,
    color: '#666',
  },
  contributionMessage: {
    fontSize: 13,
    color: '#666',
    fontStyle: 'italic',
    marginTop: 4,
  },
  contributionAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  manageFundsButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  contributeButton: {
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  manageFundsButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
  },
  contributeButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    marginLeft: 8,
  },
  cancelText: {
    color: '#FF6B6B',
  },
  shareText: {
    color: '#4ECDC4',
  },
  designImage: {
    width: '100%',
    height: 200,
    marginBottom: 16,
  },
  
  locationSection: {
    marginBottom: 24,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  
  locationCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  
  venueName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  
  address: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 12,
  },
  
  map: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 12,
  },
  
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    marginTop: 8,
    backgroundColor: '#F0FFFE',
    borderRadius: 8,
  },
  
  directionsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ECDC4',
  },
  
  rsvpSection: {
    marginBottom: 24,
  },
  
  rsvpSummary: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginBottom: 12,
  },
  
  rsvpStat: {
    flex: 1,
    alignItems: 'center',
  },
  
  rsvpNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  
  rsvpLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  
  manageInvitesButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  manageInvitesGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  
  manageInvitesText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  noGoalSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  amountRaised: {
    fontSize: 32,
    fontWeight: '800',
    color: '#4ECDC4',
  },
  goallessProgress: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  
  totalRaisedContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  
  totalRaisedAmount: {
    fontSize: 48,
    fontWeight: '800',
    color: '#4ECDC4',
    marginBottom: 4,
  },
  
  totalRaisedLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  
  contributorCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F0FFFE',
    borderRadius: 20,
  },
  
  contributorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  shareButton: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    paddingVertical: 14,
    marginTop: 16,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  
  shareButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  
  shareButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
  },
});

export default EventDetails;