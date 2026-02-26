// client/screens/ContributionSuccessScreen.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';


const ContributionSuccessScreen = ({ route, navigation }) => {
  const { amount, eventTitle, guestName } = route.params;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#4ECDC4', '#44A08D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        {/* Success Animation */}
        <View style={styles.animationContainer}>
          <Ionicons name="checkmark-circle" size={120} color="#fff" />
        </View>

        {/* Success Message */}
        <Text style={styles.title}>Thank You!</Text>
        <Text style={styles.subtitle}>
          Your ${amount} contribution to {eventTitle} has been received
        </Text>

        {/* Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailRow}>
            <Ionicons name="person" size={20} color="#666" />
            <Text style={styles.detailText}>{guestName}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="card" size={20} color="#666" />
            <Text style={styles.detailText}>${amount}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="mail" size={20} color="#666" />
            <Text style={styles.detailText}>
              Receipt sent to your email
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.popToTop()}
        >
          <Text style={styles.primaryButtonText}>Back to Event</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('PublicEventView')}
        >
          <Text style={styles.secondaryButtonText}>View Event Details</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  animationContainer: {
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    marginBottom: 32,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  detailText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  primaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 25,
    width: '100%',
    marginBottom: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4ECDC4',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    width: '100%',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default ContributionSuccessScreen;