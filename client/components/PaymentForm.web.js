// client/components/PaymentForm.web.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardElement } from '@stripe/react-stripe-js';
import { GlobalStyles } from '../constants/styles';

const PaymentForm = ({ onCardChange }) => {
  const handleChange = (event) => {
    onCardChange({
      complete: event.complete,
      error: event.error,
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.cardElementWrapper}>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#000',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#ef4444',
              },
            },
            hidePostalCode: false,
          }}
          onChange={handleChange}
        />
      </View>
      <Text style={styles.testCardHint}>
        Test card: 4242 4242 4242 4242 | Any future date | Any CVC
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  cardElementWrapper: {
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    minHeight: 50,
  },
  testCardHint: {
    fontSize: 12,
    color: GlobalStyles.colors.primary600,
    fontStyle: 'italic',
  },
});

export default PaymentForm;