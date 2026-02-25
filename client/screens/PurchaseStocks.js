// client/screens/PurchaseStocks.js - WITH REAL API DATA
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,  
  Linking,
} from 'react-native';
import { showAlert } from '../util/platform-alert';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import apiClient from '../util/api-client';

const PurchaseStocks = ({ route, navigation }) => {
  const { eventId, event, fundsData } = route.params;
  
  const [stockPrices, setStockPrices] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [purchaseMethod, setPurchaseMethod] = useState('manual');

  useEffect(() => {
    loadStockPrices();
  }, []);

  const loadStockPrices = async () => {
    try {
      setIsLoading(true);
      console.log('📡 Loading stock prices...');
      
      const prices = {};
      
      // ✅ Fetch real stock prices for each selected investment
      for (const stock of event.selectedInvestments || []) {
        try {
          const response = await apiClient.get(`/stocks/current-price/${stock.symbol}`);
          prices[stock.symbol] = response.data.price || 0;
          console.log(`✅ ${stock.symbol}: $${response.data.price}`);
        } catch (error) {
          console.warn(`⚠️ Failed to load price for ${stock.symbol}, using fallback`);
          // Fallback to mock prices if API fails
          const mockPrices = {
            'AAPL': 178.50,
            'GOOGL': 142.30,
            'MSFT': 415.20,
            'TSLA': 242.84,
            'AMZN': 178.25,
            'NVDA': 880.02,
          };
          prices[stock.symbol] = mockPrices[stock.symbol] || 100;
        }
      }
      
      setStockPrices(prices);
    } catch (error) {
      console.error('❌ Error loading stock prices:', error);
      showAlert('Note', 'Using estimated stock prices');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateShares = (symbol, allocation, netAmount) => {
    const investmentAmount = netAmount * (allocation / 100);
    const price = stockPrices[symbol] || 0;
    return price > 0 ? investmentAmount / price : 0;
  };

  const handleManualPurchase = () => {
    const stockList = event.selectedInvestments.map(s => `• ${s.symbol}`).join('\n');
    
    showAlert(
      '📱 Time to Shop!',
      `Open your favorite brokerage app and buy these stocks:\n\n${stockList}\n\nDone? Come back and hit "Mark as Purchased"! 🎯`,
      [{ text: 'Got It!', style: 'default' }]
    );
  };

  const handleOpenBrokerage = async () => {
    // You can add deep links to popular brokerage apps here
    const brokerageApps = {
      robinhood: 'robinhood://stocks/',
      webull: 'webull://',
      fidelity: 'fidelity://',
      // Add more as needed
    };
    
    showAlert(
      'Open Brokerage App',
      'Which app would you like to use?',
      [
        { text: 'Robinhood', onPress: () => tryOpenApp(brokerageApps.robinhood) },
        { text: 'Webull', onPress: () => tryOpenApp(brokerageApps.webull) },
        { text: 'Fidelity', onPress: () => tryOpenApp(brokerageApps.fidelity) },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const tryOpenApp = async (appUrl) => {
    try {
      const supported = await Linking.canOpenURL(appUrl);
      if (supported) {
        await Linking.openURL(appUrl);
      } else {
        showAlert('App Not Installed', 'Please install the app or use your browser');
      }
    } catch (error) {
      console.error('Error opening app:', error);
      showAlert('Error', 'Could not open app');
    }
  };

  const handleConfirmPurchase = () => {
    showAlert(
      '✅ All Done?',
      'Mark these stocks as purchased? This will update the event and notify the recipient! 🎉',
      [
        { text: 'Wait, Not Yet', style: 'cancel' },
        {
          text: 'Yes, All Set!',
          onPress: async () => {
            setIsPurchasing(true);
            try {
              console.log('📝 Marking stocks as purchased...');
              
              // ✅ Real API call
              const response = await apiClient.post(`/events/${eventId}/mark-purchased`, {
                purchaseDetails: {
                  method: purchaseMethod,
                  timestamp: new Date().toISOString(),
                  stocks: event.selectedInvestments,
                }
              });
              
              console.log('✅ Stocks marked as purchased:', response.data);
              
              showAlert(
                '🎊 Woohoo!',
                response.data.message || 'Stocks marked as purchased! The recipient will be so excited! 🎁',
                [{ text: 'Awesome!', onPress: () => navigation.navigate('EventFeed') }]
              );
            } catch (error) {
              console.error('❌ Mark purchased error:', error);
              showAlert(
                'Oops!', 
                error.response?.data?.message || 'Failed to update event'
              );
            } finally {
              setIsPurchasing(false);
            }
          }
        }
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4ECDC4" />
        <Text style={styles.loadingText}>Getting fresh stock prices...</Text>
      </View>
    );
  }

  const netAmount = fundsData?.netAmount || (event.currentAmount * 0.97);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Fun Header */}
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <Text style={styles.headerEmoji}>🚀</Text>
        <Text style={styles.headerTitle}>Let's Buy Some Stocks!</Text>
        <Text style={styles.eventTitle}>{event.eventTitle}</Text>
        
        <View style={styles.amountBubble}>
          <Text style={styles.amountLabel}>You Have</Text>
          <Text style={styles.amountValue}>${netAmount.toFixed(2)}</Text>
          <Text style={styles.amountSubtext}>to invest</Text>
        </View>
      </LinearGradient>

      {/* Choose Your Adventure */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>🎯</Text>
          <Text style={styles.cardTitle}>Choose Your Way</Text>
        </View>
        
        <TouchableOpacity
          style={[
            styles.methodCard,
            purchaseMethod === 'manual' && styles.methodCardActive
          ]}
          onPress={() => setPurchaseMethod('manual')}
        >
          <View style={styles.methodHeader}>
            <View style={[
              styles.radioButton,
              purchaseMethod === 'manual' && styles.radioButtonActive
            ]}>
              {purchaseMethod === 'manual' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>📱 I'll Buy Them Myself</Text>
              <Text style={styles.methodDescription}>
                Use your own brokerage app (fastest!)
              </Text>
            </View>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.methodCard,
            purchaseMethod === 'auto' && styles.methodCardActive
          ]}
          onPress={() => setPurchaseMethod('auto')}
        >
          <View style={styles.methodHeader}>
            <View style={[
              styles.radioButton,
              purchaseMethod === 'auto' && styles.radioButtonActive
            ]}>
              {purchaseMethod === 'auto' && <View style={styles.radioDot} />}
            </View>
            <View style={styles.methodContent}>
              <Text style={styles.methodTitle}>⚡ Auto-Buy For Me</Text>
              <View style={styles.comingSoonBadge}>
                <Text style={styles.comingSoonText}>Coming Soon!</Text>
              </View>
              <Text style={styles.methodDescription}>
                We'll buy them automatically (in development)
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>

      {/* Shopping List */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardEmoji}>🛒</Text>
          <Text style={styles.cardTitle}>Your Shopping List</Text>
        </View>
        
        {event.selectedInvestments && event.selectedInvestments.map((stock, index) => {
          const investmentAmount = netAmount * ((stock.allocation || 0) / 100);
          const shares = calculateShares(stock.symbol, stock.allocation, netAmount);
          const currentPrice = stockPrices[stock.symbol] || 0;
          const stockEmoji = stock.symbol === 'AAPL' ? '🍎' : 
                            stock.symbol === 'GOOGL' ? '🔍' : 
                            stock.symbol === 'MSFT' ? '💻' :
                            stock.symbol === 'TSLA' ? '⚡' :
                            stock.symbol === 'AMZN' ? '📦' :
                            stock.symbol === 'NVDA' ? '🎮' : '📈';
          
          return (
            <View key={index} style={styles.stockCard}>
              <View style={styles.stockHeader}>
                <View style={styles.stockIcon}>
                  <Text style={styles.stockEmoji}>{stockEmoji}</Text>
                </View>
                <View style={styles.stockMainInfo}>
                  <Text style={styles.stockSymbol}>{stock.symbol}</Text>
                  <Text style={styles.stockName}>{stock.name}</Text>
                </View>
                {stock.allocation && (
                  <View style={styles.allocationBadge}>
                    <Text style={styles.allocationText}>{stock.allocation}%</Text>
                  </View>
                )}
              </View>

              <View style={styles.priceBox}>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Current Price</Text>
                  <Text style={styles.priceValue}>${currentPrice.toFixed(2)}</Text>
                </View>
                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>You'll Spend</Text>
                  <Text style={styles.spendValue}>${investmentAmount.toFixed(2)}</Text>
                </View>
                <View style={styles.sharesBadge}>
                  <Ionicons name="trending-up" size={14} color="#4ECDC4" />
                  <Text style={styles.sharesText}>{shares.toFixed(4)} shares</Text>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Total Summary - Fun */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Investment</Text>
          <Text style={styles.summaryValue}>${netAmount.toFixed(2)}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Number of Stocks</Text>
          <Text style={styles.summaryValue}>{event.selectedInvestments?.length || 0}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsSection}>
        {purchaseMethod === 'manual' ? (
          <>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleOpenBrokerage}
            >
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Ionicons name="open-outline" size={24} color="#fff" />
                <Text style={styles.primaryButtonText}>Open My Brokerage</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleConfirmPurchase}
              disabled={isPurchasing}
            >
              {isPurchasing ? (
                <ActivityIndicator color="#4ECDC4" />
              ) : (
                <>
                  <Ionicons name="checkmark-circle" size={24} color="#4ECDC4" />
                  <Text style={styles.secondaryButtonText}>I Bought Them!</Text>
                </>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity
            style={styles.comingSoonButton}
            onPress={() => showAlert('Coming Soon!', 'Auto-buy feature is in development! 🚧')}
          >
            <Ionicons name="construct" size={24} color="#FFD93D" />
            <Text style={styles.comingSoonButtonText}>In Development 🚧</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.linkButtonText}>← Go Back</Text>
        </TouchableOpacity>
      </View>

      {/* Friendly Tip */}
      <View style={styles.tipBox}>
        <Text style={styles.tipEmoji}>💡</Text>
        <View style={styles.tipTextContainer}>
          <Text style={styles.tipTitle}>Pro Tip!</Text>
          <Text style={styles.tipText}>
            Stock prices change constantly. The actual shares you get might be slightly different - that's totally normal! 📊
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
  header: {
    padding: 24,
    paddingTop: 32,
    paddingBottom: 32,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  headerEmoji: {
    fontSize: 52,
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
  },
  eventTitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
  },
  amountBubble: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 32,
    paddingVertical: 20,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  amountLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  amountValue: {
    fontSize: 36,
    fontWeight: '900',
    color: '#fff',
    marginVertical: 4,
  },
  amountSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 16,
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
  cardEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  methodCard: {
    borderWidth: 3,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    backgroundColor: '#FAFAFA',
  },
  methodCardActive: {
    borderColor: '#4ECDC4',
    backgroundColor: '#E8FFF8',
  },
  methodHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCC',
    marginRight: 12,
    marginTop: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioButtonActive: {
    borderColor: '#4ECDC4',
  },
  radioDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4ECDC4',
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  comingSoonBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFD93D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginVertical: 6,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#333',
  },
  methodDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  stockCard: {
    backgroundColor: '#F8FCFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E8F8FF',
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  stockIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stockEmoji: {
    fontSize: 32,
  },
  stockMainInfo: {
    flex: 1,
  },
  stockSymbol: {
    fontSize: 20,
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
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  allocationText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#fff',
  },
  priceBox: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  priceLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
  },
  spendValue: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  sharesBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFF8',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  sharesText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#4ECDC4',
    marginLeft: 6,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 20,
    borderWidth: 3,
    borderColor: '#FFE5B4',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#666',
  },
  summaryValue: {
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
    borderColor: '#4ECDC4',
  },
  secondaryButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#4ECDC4',
    marginLeft: 12,
  },
  comingSoonButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF',
    paddingVertical: 18,
    borderRadius: 25,
    marginBottom: 12,
    borderWidth: 3,
    borderColor: '#FFD93D',
  },
  comingSoonButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#666',
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
  tipBox: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    padding: 20,
    margin: 20,
    marginTop: 0,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E8F8FF',
  },
  tipEmoji: {
    fontSize: 32,
    marginRight: 16,
  },
  tipTextContainer: {
    flex: 1,
  },
  tipTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
});

export default PurchaseStocks;