// client/screens/ContributionScreen.js - UPDATED WITH NEW THEME
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { getEventById } from '../util/events';
import PaymentForm from '../components/PaymentForm';
import {
  createContribution,
  confirmContribution,
  calculateFees,
  validateContributionAmount,
} from '../util/contributions';

const ContributionScreen = ({ route, navigation }) => {
  const { eventId } = route.params;

  const [event, setEvent] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [cardComplete, setCardComplete] = useState(false);
  const [cardError, setCardError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

  const stripe = Platform.OS === 'web' ? useStripe() : null;
  const elements = Platform.OS === 'web' ? useElements() : null;

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    try {
      const eventData = await getEventById(eventId);
      setEvent(eventData);
    } catch (err) {
      console.error('Error loading event:', err);
      setError('Failed to load event details');
      Alert.alert('Error', 'Failed to load event details', [
        { text: 'Go Back', onPress: () => navigation.goBack() },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAmountChange = (text) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    setAmount(cleaned);
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const handleSubmit = async () => {
    const validation = validateContributionAmount(parseFloat(amount));
    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.error);
      return;
    }

    if (!cardComplete) {
      Alert.alert('Card Required', 'Please enter your card details');
      return;
    }

    if (cardError) {
      Alert.alert('Card Error', cardError.message || 'Invalid card details');
      return;
    }

    const contributionAmount = parseFloat(amount);
    const remaining = event.targetAmount - event.currentAmount;

    if (contributionAmount > remaining) {
      Alert.alert(
        'Amount Too High',
        `This event only needs $${remaining.toFixed(2)} more to reach its goal.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Contribute $' + remaining.toFixed(2),
            onPress: () => {
              setAmount(remaining.toString());
              setTimeout(() => handleSubmit(), 100);
            },
          },
        ]
      );
      return;
    }

    setIsProcessing(true);

    try {
      console.log('💳 Starting payment...');
      
      const contributionData = {
        eventId: event._id || event.id,
        amount: contributionAmount,
        message: message.trim(),
      };

      console.log('📡 Creating payment intent...');
      const paymentResult = await createContribution(contributionData);
      console.log('✅ Payment intent created');

      const { clientSecret, paymentIntentId } = paymentResult;

      console.log('💳 Confirming payment...');
      let paymentIntent;
      
      if (Platform.OS === 'web') {
        if (!stripe || !elements) {
          throw new Error('Stripe not loaded');
        }
        
        const cardElement = elements.getElement(CardElement);
        const { error, paymentIntent: pi } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardElement },
        });

        if (error) {
          throw new Error(error.message);
        }
        paymentIntent = pi;
      } else {
        throw new Error('Mobile payment not implemented in this version');
      }

      console.log('✅ Payment confirmed');

      console.log('📡 Notifying backend...');
      await confirmContribution(paymentIntentId);
      console.log('✅ Backend updated');

      const updatedEvent = {
        ...event,
        currentAmount: event.currentAmount + contributionAmount,
      };
      setEvent(updatedEvent);

      Alert.alert(
        '🎉 Success!',
        `Your $${contributionAmount.toFixed(2)} contribution has been processed!\n\nEvent: $${updatedEvent.currentAmount.toFixed(2)} / $${updatedEvent.targetAmount.toFixed(2)}`,
        [{ text: 'View Event', onPress: () => navigation.goBack() }]
      );
    } catch (err) {
      console.error('❌ Payment error:', err);
      Alert.alert('Payment Failed', err.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading event details...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorEmoji}>😕</Text>
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.backButtonGradient}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = (event.currentAmount / event.targetAmount) * 100;
  const remaining = event.targetAmount - event.currentAmount;
  const fees = amount ? calculateFees(parseFloat(amount)) : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Event Summary Card */}
        <View style={styles.eventSummary}>
          <Text style={styles.eventTitle}>{event.title || event.eventTitle}</Text>
          
          {/* Progress Bar with Gradient */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
              />
            </View>
            <View style={styles.progressStats}>
              <Text style={styles.progressText}>
                ${event.currentAmount.toFixed(2)} raised
              </Text>
              <Text style={styles.progressText}>
                ${event.targetAmount.toFixed(2)} goal
              </Text>
            </View>
          </View>

          {remaining > 0 && (
            <View style={styles.remainingBanner}>
              <Ionicons name="trending-up" size={20} color="#4ECDC4" />
              <Text style={styles.remainingText}>
                ${remaining.toFixed(2)} needed to reach the goal
              </Text>
            </View>
          )}
        </View>

        {/* Amount Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contribution Amount</Text>
          
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="#CCC"
              keyboardType="decimal-pad"
              maxLength={10}
            />
          </View>

          {/* Quick Amount Buttons */}
          <View style={styles.quickAmounts}>
            {[10, 25, 50, 100].map((quickAmount) => (
              <TouchableOpacity
                key={quickAmount}
                style={[
                  styles.quickAmountButton,
                  amount === quickAmount.toString() && styles.quickAmountButtonActive,
                ]}
                onPress={() => handleQuickAmount(quickAmount)}
              >
                <Text
                  style={[
                    styles.quickAmountText,
                    amount === quickAmount.toString() && styles.quickAmountTextActive,
                  ]}
                >
                  ${quickAmount}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Fee Breakdown */}
          {fees && (
            <View style={styles.feeBreakdown}>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Your contribution</Text>
                <Text style={styles.feeValue}>${parseFloat(amount).toFixed(2)}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>Processing fee</Text>
                <Text style={styles.feeValue}>${fees.totalFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.feeRow, styles.feeRowTotal]}>
                <Text style={styles.feeLabelTotal}>Total</Text>
                <Text style={styles.feeValueTotal}>${fees.total.toFixed(2)}</Text>
              </View>
              <Text style={styles.feeNote}>
                Covers payment processing to ensure 100% of your contribution goes to the gift
              </Text>
            </View>
          )}
        </View>

        {/* Message */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a Message (Optional)</Text>
          <TextInput
            style={styles.messageInput}
            value={message}
            onChangeText={setMessage}
            placeholder="Write a personal message..."
            placeholderTextColor="#999"
            multiline
            maxLength={200}
          />
          <Text style={styles.characterCount}>{message.length}/200</Text>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Payment Method</Text>
          <PaymentForm
            onCardChange={(complete, error) => {
              setCardComplete(complete);
              setCardError(error);
            }}
          />
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="shield-checkmark" size={24} color="#4ECDC4" />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure Payment</Text>
            <Text style={styles.infoText}>
              Your payment information is encrypted and secure. We never store your card details.
            </Text>
          </View>
        </View>

        {/* Submit Button with Gradient */}
        <TouchableOpacity
          style={[
            styles.submitButtonContainer,
            (!amount || parseFloat(amount) <= 0 || !cardComplete || isProcessing) && styles.buttonDisabled
          ]}
          onPress={handleSubmit}
          disabled={isProcessing || !amount || parseFloat(amount) <= 0 || !cardComplete}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitButtonGradient}
          >
            {isProcessing ? (
              <>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.submitButtonText}>Processing...</Text>
              </>
            ) : (
              <>
                <Ionicons name="gift" size={24} color="#fff" />
                <Text style={styles.submitButtonText}>
                  Contribute {amount ? `$${parseFloat(amount).toFixed(2)}` : ''}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Terms */}
        <Text style={styles.termsText}>
          By contributing, you agree to our Terms of Service and understand that contributions are
          non-refundable once the event is invested.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontWeight: '500',
  },
  backButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  backButtonGradient: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  eventSummary: {
    padding: 24,
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#FFE5B4',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  eventTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  },
  remainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FFF8',
    padding: 14,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#C4F5E8',
    gap: 8,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0D7C66',
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FF6B6B',
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    outlineStyle: 'none',
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  quickAmountButtonActive: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  quickAmountTextActive: {
    color: '#FF6B6B',
    fontWeight: '800',
  },
  feeBreakdown: {
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeRowTotal: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#E0E0E0',
  },
  feeLabel: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  feeValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  feeLabelTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
  },
  feeValueTotal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#4ECDC4',
  },
  feeNote: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  messageInput: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 100,
    textAlignVertical: 'top',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    fontWeight: '500',
    outlineStyle: 'none',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8FFF8',
    padding: 18,
    marginHorizontal: 20,
    borderRadius: 16,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#C4F5E8',
    gap: 12,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: '#0D7C66',
    lineHeight: 20,
    fontWeight: '500',
  },
  submitButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginHorizontal: 20,
    marginBottom: 16,
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  termsText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
    lineHeight: 18,
  },
});

export default ContributionScreen;