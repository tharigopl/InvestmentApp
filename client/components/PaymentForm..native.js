// client/components/PaymentForm.native.js
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { CardField } from '@stripe/stripe-react-native';
import { GlobalStyles } from '../constants/styles';

const PaymentForm = ({ onCardChange }) => {
  return (
    <View style={styles.container}>
      <View style={styles.cardFieldContainer}>
        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={{
            backgroundColor: '#FFFFFF',
            textColor: '#000000',
          }}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            onCardChange({
              complete: cardDetails.complete,
              error: null,
            });
          }}
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
  cardFieldContainer: {
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    padding: 4,
    marginBottom: 8,
  },
  cardField: {
    width: '100%',
    height: 50,
  },
  testCardHint: {
    fontSize: 12,
    color: GlobalStyles.colors.primary600,
    fontStyle: 'italic',
  },
});

export default PaymentForm;