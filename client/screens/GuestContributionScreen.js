// client/screens/GuestContributionScreen.js
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { showAlert } from '../util/platform-alert';
import apiClient from '../util/api-client';

const GuestContributionScreen = ({ route, navigation }) => {
  const { shareId, event } = route.params;
  
  const stripe = useStripe();
  const elements = useElements();
  
  const [guestInfo, setGuestInfo] = useState({
    name: '',
    email: '',
    amount: '',
    message: '',
    isAnonymous: false,
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);

  const validateForm = () => {
    if (!guestInfo.name.trim()) {
      showAlert('Required Field', 'Please enter your name');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!guestInfo.email.trim() || !emailRegex.test(guestInfo.email)) {
      showAlert('Invalid Email', 'Please enter a valid email address');
      return false;
    }

    const amount = parseFloat(guestInfo.amount);
    if (!amount || amount < 1) {
      showAlert('Invalid Amount', 'Please enter an amount of at least $1');
      return false;
    }

    if (!cardComplete) {
      showAlert('Payment Info Required', 'Please enter your card details');
      return false;
    }

    return true;
  };

  const handleContribute = async () => {
    if (!validateForm()) return;

    try {
      setIsProcessing(true);

      const API_URL = Platform.OS === 'web' 
        ? 'http://localhost:5000/api'
        : 'http://10.0.2.2:5000/api';

      // Step 1: Create payment intent
    //   const { data } = await axios.post(`${API_URL}/payments/create-payment-intent`, {
    //     amount: parseFloat(guestInfo.amount),
    //     eventId: event._id,
    //     isGuest: true,
    //     guestEmail: guestInfo.email,
    //     guestName: guestInfo.name,
    //   });

      const { data } = await apiClient.post(`/public/payments/create-payment-intent`, {
        amount: parseFloat(guestInfo.amount),
        eventId: event._id,
        isGuest: true,
        guestEmail: guestInfo.email,
        guestName: guestInfo.name,
      });

      // Step 2: Confirm payment with Stripe
      const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(
        data.clientSecret,
        {
          payment_method: {
            card: elements.getElement(CardElement),
            billing_details: {
              name: guestInfo.name,
              email: guestInfo.email,
            },
          },
        }
      );

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      // Step 3: Record contribution
    //   await axios.post(`${API_URL}/public/events/${shareId}/contribute`, {
    //     guestName: guestInfo.name,
    //     guestEmail: guestInfo.email,
    //     amount: parseFloat(guestInfo.amount),
    //     message: guestInfo.message,
    //     isAnonymous: guestInfo.isAnonymous,
    //     stripePaymentId: paymentIntent.id,
    //   });

      await apiClient.post(`/public/events/${shareId}/contribute`, {
        guestName: guestInfo.name,
        guestEmail: guestInfo.email,
        amount: parseFloat(guestInfo.amount),
        message: guestInfo.message,
        isAnonymous: guestInfo.isAnonymous,
        stripePaymentId: paymentIntent.id,
      });

      // Success!
      navigation.replace('ContributionSuccess', {
        amount: guestInfo.amount,
        eventTitle: event.eventTitle,
        guestName: guestInfo.name,
      });

    } catch (error) {
      console.error('Contribution error:', error);
      showAlert('Payment Failed', error.message || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const progress = event.hasGoal && event.targetAmount > 0
    ? (event.currentAmount / event.targetAmount) * 100
    : 0;

  return (
    <ScrollView style={styles.container}>
      {/* Event Header */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
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

      {/* Current Progress */}
      {event.hasGoal && event.targetAmount > 0 && (
        <View style={styles.progressCard}>
          <View style={styles.progressBar}>
            <LinearGradient
              colors={['#4ECDC4', '#44A08D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[styles.progressFill, { width: `${Math.min(progress, 100)}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            ${event.currentAmount} of ${event.targetAmount} raised
          </Text>
        </View>
      )}

      {/* Contribution Form */}
      <View style={styles.formContainer}>
        <Text style={styles.formTitle}>Your Contribution</Text>

        {/* Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Your Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={guestInfo.name}
            onChangeText={(text) => setGuestInfo({ ...guestInfo, name: text })}
          />
        </View>

        {/* Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Email Address *</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            value={guestInfo.email}
            onChangeText={(text) => setGuestInfo({ ...guestInfo, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={styles.inputHint}>
            We'll send your receipt here
          </Text>
        </View>

        {/* Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Contribution Amount *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="50"
              value={guestInfo.amount}
              onChangeText={(text) => setGuestInfo({ ...guestInfo, amount: text })}
              keyboardType="decimal-pad"
            />
          </View>
          
          {/* Suggested Amounts */}
          <View style={styles.suggestedAmounts}>
            {[10, 25, 50, 100].map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.suggestedButton}
                onPress={() => setGuestInfo({ ...guestInfo, amount: amount.toString() })}
              >
                <Text style={styles.suggestedText}>${amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Message */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Message (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a personal message..."
            value={guestInfo.message}
            onChangeText={(text) => setGuestInfo({ ...guestInfo, message: text })}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Anonymous Option */}
        <TouchableOpacity
          style={styles.anonymousToggle}
          onPress={() => setGuestInfo({ 
            ...guestInfo, 
            isAnonymous: !guestInfo.isAnonymous 
          })}
        >
          <View style={[
            styles.checkbox,
            guestInfo.isAnonymous && styles.checkboxChecked
          ]}>
            {guestInfo.isAnonymous && (
              <Ionicons name="checkmark" size={16} color="#fff" />
            )}
          </View>
          <Text style={styles.anonymousLabel}>
            Contribute anonymously
          </Text>
        </TouchableOpacity>

        {/* Payment Information */}
        <View style={styles.paymentSection}>
          <Text style={styles.sectionTitle}>Payment Information</Text>
          
          {Platform.OS === 'web' ? (
            <View style={styles.cardElementContainer}>
              <CardElement
                options={{
                  style: {
                    base: {
                      fontSize: '16px',
                      color: '#333',
                      fontFamily: 'System',
                      '::placeholder': {
                        color: '#999',
                      },
                    },
                  },
                }}
                onChange={(e) => setCardComplete(e.complete)}
              />
            </View>
          ) : (
            <View style={styles.mobilePaymentNote}>
              <Ionicons name="card" size={24} color="#FF6B6B" />
              <Text style={styles.mobilePaymentText}>
                Payment processing is currently only available on web
              </Text>
            </View>
          )}

          <View style={styles.secureNote}>
            <Ionicons name="lock-closed" size={16} color="#4ECDC4" />
            <Text style={styles.secureText}>
              Secure payment powered by Stripe
            </Text>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={styles.submitButton}
          onPress={handleContribute}
          disabled={isProcessing || Platform.OS !== 'web'}
        >
          <LinearGradient
            colors={['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            {isProcessing ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="gift" size={24} color="#fff" />
                <Text style={styles.submitText}>
                  Contribute ${guestInfo.amount || '0'}
                </Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
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
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 8,
  },
  recipientText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.9)',
  },
  progressCard: {
    backgroundColor: '#fff',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E5E5',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  formContainer: {
    padding: 20,
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20,
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
    backgroundColor: '#fff',
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
    marginTop: 6,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    paddingLeft: 14,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '700',
    color: '#666',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    padding: 14,
    fontSize: 16,
    color: '#333',
  },
  suggestedAmounts: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  suggestedButton: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    alignItems: 'center',
  },
  suggestedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  anonymousToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#E5E5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ECDC4',
    borderColor: '#4ECDC4',
  },
  anonymousLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  paymentSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 16,
  },
  cardElementContainer: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    marginBottom: 12,
  },
  mobilePaymentNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFF9F0',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  mobilePaymentText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  secureNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  secureText: {
    fontSize: 12,
    color: '#666',
  },
  submitButton: {
    borderRadius: 25,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 12,
  },
  submitText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
});

export default GuestContributionScreen;