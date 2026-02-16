// client/screens/ContributionScreen.js
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
import { GlobalStyles } from '../constants/styles';
import { getEventById } from '../util/events';
import {
  createContribution,
  calculateFees,
  validateContributionAmount,
} from '../util/contributions';

const ContributionScreen = ({ route, navigation }) => {
  const { eventId } = route.params;

  const [event, setEvent] = useState(null);
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);

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
    // Only allow numbers and decimal point
    const cleaned = text.replace(/[^0-9.]/g, '');
    
    // Prevent multiple decimal points
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      return;
    }
    
    // Limit to 2 decimal places
    if (parts[1] && parts[1].length > 2) {
      return;
    }
    
    setAmount(cleaned);
  };

  const handleQuickAmount = (quickAmount) => {
    setAmount(quickAmount.toString());
  };

  const handleSubmit = async () => {
    // Validate amount
    const validation = validateContributionAmount(parseFloat(amount));
    if (!validation.valid) {
      Alert.alert('Invalid Amount', validation.error);
      return;
    }

    const contributionAmount = parseFloat(amount);
    const remaining = event.targetAmount - event.currentAmount;

    // Check if contribution exceeds remaining amount
    if (contributionAmount > remaining) {
      Alert.alert(
        'Amount Too High',
        `This event only needs $${remaining.toFixed(2)} more to reach its goal. Would you like to contribute that amount instead?`,
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
      // In a real app, you would integrate with Stripe here
      // For now, we'll simulate the payment process
      
      const contributionData = {
        eventId: event._id || event.id,
        amount: contributionAmount,
        message: message.trim(),
      };

      // Create payment intent
      const paymentResult = await createContribution(contributionData);

      // TODO: Integrate with Stripe SDK to handle payment
      // const { clientSecret } = paymentResult;
      // Handle Stripe payment confirmation here
      
      // For now, show success
      Alert.alert(
        'Success!',
        'Your contribution has been processed successfully.',
        [
          {
            text: 'View Event',
            onPress: () => {
              navigation.goBack();
              // Optionally refresh the event details
            },
          },
        ]
      );
    } catch (err) {
      console.error('Contribution error:', err);
      Alert.alert(
        'Payment Failed',
        err.message || 'Failed to process your contribution. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color={GlobalStyles.colors.error500} />
        <Text style={styles.errorText}>{error || 'Event not found'}</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>Go Back</Text>
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
        {/* Event Summary */}
        <View style={styles.eventSummary}>
          <Text style={styles.eventTitle}>{event.title || event.eventTitle}</Text>
          
          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]} />
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
              <Ionicons name="information-circle" size={20} color={GlobalStyles.colors.primary600} />
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
                <Text style={styles.feeLabel}>Your contribution:</Text>
                <Text style={styles.feeValue}>${fees.amount.toFixed(2)}</Text>
              </View>
              <View style={styles.feeRow}>
                <Text style={styles.feeLabel}>
                  Processing fee ({fees.stripeFeePercentage}% + ${fees.stripeFeeFixed}):
                </Text>
                <Text style={styles.feeValue}>-${fees.stripeFee.toFixed(2)}</Text>
              </View>
              <View style={[styles.feeRow, styles.feeRowTotal]}>
                <Text style={styles.feeLabelTotal}>Net to event:</Text>
                <Text style={styles.feeValueTotal}>${fees.netAmount.toFixed(2)}</Text>
              </View>
              <Text style={styles.feeNote}>
                Processing fees help cover payment processing costs
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
            placeholder="Leave a message for the recipient..."
            multiline
            numberOfLines={4}
            maxLength={500}
          />
          <Text style={styles.characterCount}>{message.length}/500</Text>
        </View>

        {/* Payment Info */}
        <View style={styles.infoBox}>
          <Ionicons name="lock-closed" size={24} color={GlobalStyles.colors.primary600} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>Secure Payment</Text>
            <Text style={styles.infoText}>
              Your payment is processed securely through Stripe. We never store your card details.
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!amount || parseFloat(amount) <= 0 || isProcessing) && styles.submitButtonDisabled,
          ]}
          onPress={handleSubmit}
          disabled={!amount || parseFloat(amount) <= 0 || isProcessing}
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
  backButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  eventSummary: {
    padding: 20,
    backgroundColor: GlobalStyles.colors.gray50,
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  eventTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 16,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: GlobalStyles.colors.gray200,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: GlobalStyles.colors.primary500,
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
  },
  remainingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.primary50,
    padding: 12,
    borderRadius: 8,
  },
  remainingText: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.primary700,
    marginLeft: 8,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 16,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: GlobalStyles.colors.primary200,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray700,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
  },
  quickAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 12,
    marginHorizontal: 4,
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  quickAmountButtonActive: {
    backgroundColor: GlobalStyles.colors.primary50,
    borderColor: GlobalStyles.colors.primary500,
  },
  quickAmountText: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
  },
  quickAmountTextActive: {
    color: GlobalStyles.colors.primary700,
  },
  feeBreakdown: {
    backgroundColor: GlobalStyles.colors.gray50,
    padding: 16,
    borderRadius: 8,
  },
  feeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  feeRowTotal: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: GlobalStyles.colors.gray300,
  },
  feeLabel: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
  },
  feeValue: {
    fontSize: 14,
    color: GlobalStyles.colors.gray700,
  },
  feeLabelTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
  },
  feeValueTotal: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary600,
  },
  feeNote: {
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
    marginTop: 8,
    fontStyle: 'italic',
  },
  messageInput: {
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  characterCount: {
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
    textAlign: 'right',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: GlobalStyles.colors.primary50,
    padding: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
    lineHeight: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 16,
    marginHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
  },
  submitButtonDisabled: {
    backgroundColor: GlobalStyles.colors.gray400,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
  },
  termsText: {
    fontSize: 12,
    color: GlobalStyles.colors.gray500,
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 32,
    lineHeight: 18,
  },
});

export default ContributionScreen;