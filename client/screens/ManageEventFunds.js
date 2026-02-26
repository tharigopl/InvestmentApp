// client/screens/ManageEventFunds.js - WITH REAL API DATA
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,  
  Platform,
} from 'react-native';
import { showAlert } from '../util/platform-alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../util/api-client';
import { AuthContext } from '../store/auth-context';

const ManageEventFunds = ({ route, navigation }) => {
  const { eventId } = route.params;
  const authCtx = useContext(AuthContext);
  
  const [event, setEvent] = useState(null);
  const [fundsData, setFundsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadEventData();
  }, [eventId]);

  const loadEventData = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Loading funds summary for event:', eventId);
      
      // ✅ Real API call
      const response = await apiClient.get(`/events/${eventId}/funds-summary`);
      console.log('✅ Funds data received:', response.data);
      
      setFundsData(response.data);
      
      // Map API response to component state
      setEvent({
        _id: eventId,
        eventTitle: response.data.eventTitle || 'Investment Event',
        recipientUser: response.data.recipientUser || { fname: 'Recipient', lname: '' },
        currentAmount: response.data.totalRaised || 0,
        targetAmount: response.data.targetAmount || 0,
        status: response.data.status || 'funded',
        selectedInvestments: response.data.selectedInvestments || [],
        contributors: response.data.contributors || [],
      });
    } catch (error) {
      console.error('❌ Error loading event:', error);
      showAlert(
        'Oops!', 
        'Failed to load event data. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const calculateFees = () => {
    if (!fundsData) return { stripeFee: 0, netAmount: 0 };
    
    return {
      stripeFee: fundsData.stripeFees || 0,
      netAmount: fundsData.netAmount || 0,
    };
  };

  const handleWithdrawFunds = async () => {
    const fees = calculateFees();
    
    showAlert(
      '💰 Withdraw Funds',
      `Ready to withdraw $${fees.netAmount.toFixed(2)}?\n\nThe money will go to your bank account so you can buy stocks for ${event.recipientUser.fname}! 🎉`,
      [
        { text: 'Not Yet', style: 'cancel' },
        {
          text: 'Yes, Withdraw!',
          onPress: async () => {
            setIsProcessing(true);
            try {
              console.log('💸 Initiating withdrawal...');
              
              // ✅ Real API call
              const response = await apiClient.post(`/events/${eventId}/initiate-withdrawal`);
              console.log('✅ Withdrawal initiated:', response.data);
              
              showAlert(
                '🎊 Withdrawal Started!',
                response.data.message || 'Money is on its way to your bank (2-3 days). Time to shop for stocks! 📈',
                [{ text: 'Sweet!', onPress: () => navigation.goBack() }]
              );
            } catch (error) {
              console.error('❌ Withdrawal error:', error);
              showAlert(
                'Oops!', 
                error.response?.data?.message || 'Failed to initiate withdrawal. Please try again.'
              );
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const handlePurchaseStocks = () => {
    navigation.navigate('PurchaseStocks', { 
      eventId, 
      event,
      fundsData // ✅ Pass real data to PurchaseStocks
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading your event...</Text>
      </View>
    );
  }

  if (!event || !fundsData) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>Event not found</Text>
        <TouchableOpacity style={styles.errorButton} onPress={() => navigation.goBack()}>
          <Text style={styles.errorButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const fees = calculateFees();
  const progress = (event.currentAmount / event.targetAmount) * 100;
  const isFullyFunded = progress >= 100;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Fun Header with Gradient */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>💰</Text>
        <Text style={styles.headerTitle}>Time to Invest!</Text>
        <Text style={styles.eventTitle}>{event.eventTitle}</Text>
        <Text style={styles.recipientText}>
          Gift for {event.recipientUser.fname} {event.recipientUser.lname} 🎁
        </Text>
      </LinearGradient>

      {/* Celebration Banner */}
      {isFullyFunded && (
        <View style={styles.celebrationBanner}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <View style={styles.celebrationTextContainer}>
            <Text style={styles.celebrationTitle}>Goal Reached!</Text>
            <Text style={styles.celebrationText}>Everyone pitched in. Let's make it happen!</Text>
          </View>
        </View>
      )}

      {/* Money Breakdown - Fun Card */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="wallet" size={24} color="#FF6B6B" />
          <Text style={styles.cardTitle}>The Money Breakdown</Text>
        </View>
        
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Total Collected</Text>
          <Text style={styles.amountBig}>${event.currentAmount.toFixed(2)}</Text>
        </View>

        <View style={styles.feeRow}>
          <View style={styles.feeIcon}>
            <Ionicons name="card" size={16} color="#FF8E53" />
          </View>
          <Text style={styles.feeLabel}>Payment Processing</Text>
          <Text style={styles.feeValue}>-${fees.stripeFee.toFixed(2)}</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.totalRow}>
          <View style={styles.totalIcon}>
            <Ionicons name="trending-up" size={20} color="#4ECDC4" />
          </View>
          <Text style={styles.totalLabel}>Ready to Invest</Text>
          <Text style={styles.totalValue}>${fees.netAmount.toFixed(2)}</Text>
        </View>
      </View>

      {/* Stock Picks - Fun Cards */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Ionicons name="trending-up" size={24} color="#4ECDC4" />
          <Text style={styles.cardTitle}>Stock Picks</Text>
        </View>

        {event.selectedInvestments && event.selectedInvestments.length > 0 ? (
          event.selectedInvestments.map((stock, index) => {
            const investmentAmount = fees.netAmount * ((stock.allocation || 0) / 100);
            const stockEmoji = stock.symbol === 'AAPL' ? '🍎' : 
                              stock.symbol === 'GOOGL' ? '🔍' : 
                              stock.symbol === 'MSFT' ? '💻' : '📈';
            
            return (
              <View key={index} style={styles.stockCard}>
                <View style={styles.stockHeader}>
                  <View style={styles.stockIconContainer}>
                    <Text style={styles.stockEmoji}>{stockEmoji}</Text>
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
                </View>
                <View style={styles.stockAmountRow}>
                  <Ionicons name="cash" size={16} color="#95E1D3" />
                  <Text style={styles.stockAmount}>~${investmentAmount.toFixed(2)}</Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={styles.emptyText}>No stocks selected</Text>
        )}
      </View>

      {/* Contributors - Fun List */}
      {event.contributors && event.contributors.length > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="people" size={24} color="#FFD93D" />
            <Text style={styles.cardTitle}>Amazing Contributors</Text>
          </View>

          {event.contributors.map((contributor, index) => {
            // const contributorName = contributor.user 
            //   ? `${contributor.user.fname} ${contributor.user.lname}`.trim()
            //   : 'Anonymous';

            const contributorName = contributor.isAnonymous 
            ? 'Anonymous'
            : contributor.user 
              ? `${contributor.user.fname || ''} ${contributor.user.lname || ''}`.trim()
              : `${contributor.guestName || ''}`.trim() != '' ? `${contributor.guestName || ''}`.trim() : 'Anonymous';
            
            return (
              <View key={index} style={styles.contributorRow}>
                <View style={styles.contributorAvatar}>
                  <Text style={styles.contributorEmoji}>
                    {['🌟', '✨', '💫', '⭐', '🌙'][index % 5]}
                  </Text>
                </View>
                <Text style={styles.contributorName}>{contributorName}</Text>
                <Text style={styles.contributorAmount}>
                  ${contributor.amount?.toFixed(0) || '0'}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Action Buttons - Fun Style */}
      <View style={styles.actionsSection}>
        {isFullyFunded && event.status === 'funded' && (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handlePurchaseStocks}
              disabled={isProcessing}
            >
              <LinearGradient
                colors={['#4ECDC4', '#44A08D']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="rocket" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Let's Buy Stocks!</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleWithdrawFunds}
              disabled={isProcessing}
            >
              <Ionicons name="arrow-down-circle" size={24} color="#FF6B6B" />
              <Text style={styles.secondaryButtonText}>Withdraw to My Bank</Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkButtonText}>← Back to Event</Text>
        </TouchableOpacity>
      </View>

      {/* Info Box - Friendly */}
      <View style={styles.infoBox}>
        <Text style={styles.infoEmoji}>💡</Text>
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>Quick Tips</Text>
          <Text style={styles.infoText}>
            • Withdraw money to buy stocks yourself{'\n'}
            • Or use our auto-buy feature (coming soon!){'\n'}
            • Don't worry, we'll guide you through it! 😊
          </Text>
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
    fontSize: 18,
    color: '#666',
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#FF6B6B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  errorButtonText: {
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
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 8,
  },
  recipientText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  celebrationBanner: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    margin: 16,
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  celebrationEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  celebrationTextContainer: {
    flex: 1,
  },
  celebrationTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  celebrationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 8,
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    marginLeft: 12,
  },
  amountBox: {
    backgroundColor: '#FFF9F0',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FFE5B4',
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  amountBig: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FF6B6B',
  },
  feeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  feeIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFF0E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  feeLabel: {
    flex: 1,
    fontSize: 15,
    color: '#666',
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF8E53',
  },
  divider: {
    height: 2,
    backgroundColor: '#F5F5F5',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFF8',
    padding: 16,
    borderRadius: 12,
  },
  totalIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#C4F5E8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  totalLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '900',
    color: '#4ECDC4',
  },
  stockCard: {
    backgroundColor: '#F8FCFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4ECDC4',
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockIconContainer: {
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
  },
  stockName: {
    fontSize: 13,
    color: '#666',
    marginTop: 2,
  },
  allocationBadge: {
    backgroundColor: '#4ECDC4',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  allocationText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  stockAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
    marginLeft: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    paddingVertical: 20,
  },
  contributorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
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
  contributorName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  contributorAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  actionsSection: {
    padding: 20,
    paddingBottom: 32,
  },
  primaryButton: {
    borderRadius: 25,
    marginBottom: 12,
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
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
  primaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    marginLeft: 12,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FF6B6B',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
    marginLeft: 12,
  },
  linkButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  linkButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFE5B4',
  },
  infoEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default ManageEventFunds;