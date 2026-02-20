// client/screens/EventDetails.js
import React, { useState, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../constants/styles';
import { getEventById, cancelEvent } from '../util/events';

const EventDetails = ({ route, navigation }) => {
  const { eventId } = route.params;
  
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
      Alert.alert('Event Closed', 'This event is no longer accepting contributions.');
      return;
    }
    navigation.navigate('ContributionScreen', { eventId: event._id || event.id });
  };

  const handleCancelEvent = () => {
    Alert.alert(
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
              Alert.alert('Success', 'Event has been cancelled successfully.', [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel event. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleShare = () => {
    // TODO: Implement share functionality
    Alert.alert('Share Event', 'Share functionality coming soon!');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color={GlobalStyles.colors.error500} />
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
        <Ionicons name="help-circle" size={60} color={GlobalStyles.colors.gray400} />
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => navigation.goBack()}>
          <Text style={styles.retryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = (event.currentAmount / event.targetAmount) * 100;
  const daysLeft = event.deadline
    ? Math.ceil((new Date(event.deadline) - new Date()) / (1000 * 60 * 60 * 24))
    : null;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Event Image */}
      <Image
        source={
          event.imageUrl || event.recipientImage
            ? { uri: event.imageUrl || event.recipientImage }
            : { uri: 'https://via.placeholder.com/400x200?text=Event' }
        }
        style={styles.eventImage}
      />

      {/* Status Badge */}
      <View style={[styles.statusBadge, styles[`status${event.status}`]]}>
        <Text style={styles.statusText}>
          {event.status === 'active' && '🔥 Active'}
          {event.status === 'funded' && '✅ Funded'}
          {event.status === 'awaiting_investment' && '⏳ Awaiting Investment'}
          {event.status === 'invested' && '💰 Invested'}
          {event.status === 'completed' && '🎉 Complete'}
          {event.status === 'cancelled' && '❌ Cancelled'}
        </Text>
      </View>

      <View style={styles.content}>
        {/* Event Title */}
        <Text style={styles.eventTitle}>{event.title || event.eventTitle}</Text>

        {/* Event Type */}
        <View style={styles.infoRow}>
          <Ionicons name="pricetag" size={20} color={GlobalStyles.colors.gray500} />
          <Text style={styles.infoText}>
            {event.eventType?.charAt(0).toUpperCase() + event.eventType?.slice(1)}
          </Text>
        </View>

        {/* Recipient */}
        {event.recipientName && (
          <View style={styles.infoRow}>
            <Ionicons name="person" size={20} color={GlobalStyles.colors.gray500} />
            <Text style={styles.infoText}>
              For <Text style={styles.boldText}>{event.recipientName}</Text>
            </Text>
          </View>
        )}

        {/* Event Date */}
        {event.eventDate && (
          <View style={styles.infoRow}>
            <Ionicons name="calendar" size={20} color={GlobalStyles.colors.gray500} />
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

        {/* Progress Section */}
        <View style={styles.progressSection}>
          <Text style={styles.sectionTitle}>Funding Progress</Text>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
          </View>
          
          <View style={styles.progressStats}>
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                ${event.currentAmount?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.progressStatLabel}>Raised</Text>
            </View>
            
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>{progress.toFixed(0)}%</Text>
              <Text style={styles.progressStatLabel}>Funded</Text>
            </View>
            
            <View style={styles.progressStat}>
              <Text style={styles.progressStatValue}>
                ${event.targetAmount?.toFixed(2) || '0.00'}
              </Text>
              <Text style={styles.progressStatLabel}>Goal</Text>
            </View>
          </View>

          {daysLeft !== null && daysLeft > 0 && event.status === 'active' && (
            <View style={styles.daysLeftBanner}>
              <Ionicons name="time" size={20} color={GlobalStyles.colors.primary600} />
              <Text style={styles.daysLeftText}>
                {daysLeft} {daysLeft === 1 ? 'day' : 'days'} remaining
              </Text>
            </View>
          )}
        </View>

        {/* Selected Investments */}
        {event.selectedInvestments && event.selectedInvestments.length > 0 && (
          <View style={styles.investmentsSection}>
            <Text style={styles.sectionTitle}>Selected Investments</Text>
            {event.selectedInvestments.map((stock, index) => (
              <View key={index} style={styles.stockCard}>
                <Ionicons name="trending-up" size={24} color={GlobalStyles.colors.primary600} />
                <View style={styles.stockInfo}>
                  <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                  <Text style={styles.stockName}>{stock.name}</Text>
                </View>
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
              Contributors ({contributions.length})
            </Text>
            {contributions.map((contribution, index) => {
              // Get contributor name from populated user data
              const contributorName = contribution.isAnonymous 
                ? 'Anonymous'
                : contribution.user 
                  ? `${contribution.user.fname || ''} ${contribution.user.lname || ''}`.trim()
                  : 'Anonymous';
              
              const contributorInitial = contribution.isAnonymous || !contribution.user
                ? '?'
                : (contribution.user.fname?.[0] || contribution.user.lname?.[0] || '?').toUpperCase();

              return (
                <View key={index} style={styles.contributorCard}>
                  <View style={styles.contributorAvatar}>
                    <Text style={styles.contributorInitial}>
                      {contributorInitial}
                    </Text>
                  </View>
                  <View style={styles.contributorInfo}>
                    <Text style={styles.contributorName}>
                      {contributorName}
                    </Text>
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
        )}\n\n        {/* Action Buttons */}
        <View style={styles.actionsSection}>
          {event.status === 'active' && (
            <TouchableOpacity style={styles.contributeButton} onPress={handleContribute}>
              <Ionicons name="gift" size={24} color="#fff" />
              <Text style={styles.contributeButtonText}>Contribute Now</Text>
            </TouchableOpacity>
          )}

          <View style={styles.secondaryActions}>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
              <Ionicons name="share-social" size={20} color={GlobalStyles.colors.gray700} />
              <Text style={styles.secondaryButtonText}>Share</Text>
            </TouchableOpacity>

            {event.isHost && event.status === 'active' && (
              <TouchableOpacity style={styles.secondaryButton} onPress={handleCancelEvent}>
                <Ionicons name="close-circle" size={20} color={GlobalStyles.colors.error500} />
                <Text style={[styles.secondaryButtonText, styles.cancelText]}>
                  Cancel Event
                </Text>
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
    backgroundColor: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: GlobalStyles.colors.gray500,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },
  errorText: {
    fontSize: 16,
    color: GlobalStyles.colors.gray600,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventImage: {
    width: '100%',
    height: 250,
    backgroundColor: GlobalStyles.colors.gray200,
  },
  statusBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    zIndex: 10,
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
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    padding: 20,
  },
  eventTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    color: GlobalStyles.colors.gray600,
    marginLeft: 12,
  },
  boldText: {
    fontWeight: '600',
    color: GlobalStyles.colors.gray800,
  },
  descriptionContainer: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: GlobalStyles.colors.gray50,
    borderRadius: 12,
  },
  descriptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 15,
    color: GlobalStyles.colors.gray600,
    lineHeight: 22,
  },
  progressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: GlobalStyles.colors.gray200,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  progressStat: {
    alignItems: 'center',
  },
  progressStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 4,
  },
  progressStatLabel: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
  },
  daysLeftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary50,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  daysLeftText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.primary700,
    marginLeft: 8,
  },
  investmentsSection: {
    marginBottom: 24,
  },
  stockCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray50,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  stockInfo: {
    flex: 1,
    marginLeft: 12,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 2,
  },
  stockName: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
  },
  stockPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
  },
  contributorsSection: {
    marginBottom: 24,
  },
  contributorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  contributorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: GlobalStyles.colors.primary200,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  contributorInitial: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary700,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray800,
    marginBottom: 2,
  },
  contributionDate: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
  },
  contributionMessage: {
    fontSize: 13,
    color: GlobalStyles.colors.gray600,
    fontStyle: 'italic',
    marginTop: 4,
  },
  contributionAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary600,
  },
  actionsSection: {
    marginTop: 8,
    marginBottom: 32,
  },
  contributeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  contributeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    color: GlobalStyles.colors.gray700,
    marginLeft: 8,
  },
  cancelText: {
    color: GlobalStyles.colors.error500,
  },
});

export default EventDetails;