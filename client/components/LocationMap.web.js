// client/components/LocationMap.web.js
// Web-only version - no react-native-maps dependency
import React from 'react';
import { View, Text, StyleSheet, Linking, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LocationMap({ location }) {
  if (!location || !location.address) {
    return null;
  }

  const { venueName, address, city, state, latitude, longitude } = location;

  const fullAddress = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}`;

  const handleGetDirections = () => {
    const destination = encodeURIComponent(fullAddress);
    // Web: Always use Google Maps
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destination}`);
  };

  const handleOpenFullMap = () => {
    if (latitude && longitude) {
      Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`);
    }
  };

  return (
    <View style={styles.locationSection}>
      <View style={styles.sectionHeader}>
        <Ionicons name="location" size={24} color="#FF6B6B" />
        <Text style={styles.sectionTitle}>Location</Text>
      </View>
      
      <View style={styles.locationCard}>
        {venueName && (
          <Text style={styles.venueName}>{venueName}</Text>
        )}
        <Text style={styles.address}>{fullAddress}</Text>
        
        {/* Web: Show OpenStreetMap embed or placeholder */}
        {latitude && longitude ? (
          <View style={styles.mapContainer}>
            <iframe
              width="100%"
              height="200"
              frameBorder="0"
              scrolling="no"
              marginHeight="0"
              marginWidth="0"
              src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`}
              style={{ border: 0, borderRadius: 8 }}
              title="Event location map"
            />
            <TouchableOpacity 
              style={styles.mapOverlay}
              onPress={handleOpenFullMap}
            >
              <Ionicons name="expand" size={16} color="#fff" />
              <Text style={styles.overlayText}>View Full Map</Text>
            </TouchableOpacity>
          </View>
        ) : (
          // No coordinates: Show placeholder with address
          <View style={styles.mapPlaceholder}>
            <Ionicons name="location" size={48} color="#4ECDC4" />
            <Text style={styles.mapPlaceholderText}>
              {fullAddress}
            </Text>
            <Text style={styles.mapPlaceholderSubtext}>
              Tap "Get Directions" to view on map
            </Text>
          </View>
        )}
        
        <TouchableOpacity 
          style={styles.directionsButton}
          onPress={handleGetDirections}
        >
          <Ionicons name="navigate" size={18} color="#4ECDC4" />
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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

  mapContainer: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginVertical: 12,
    position: 'relative',
    overflow: 'hidden',
  },

  mapOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 4,
  },

  overlayText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  mapPlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 12,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
  },

  mapPlaceholderText: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  mapPlaceholderSubtext: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },

  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },

  directionsText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#4ECDC4',
  },
});