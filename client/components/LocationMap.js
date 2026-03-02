// client/components/LocationMap.js
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const LocationMap = ({ location }) => {
  if (!location || !location.address) {
    return null;
  }

  const handleGetDirections = () => {
    const destination = encodeURIComponent(
      `${location.address}${location.city ? `, ${location.city}` : ''}`
    );
    
    if (Platform.OS === 'web') {
      // Web: Open Google Maps in new tab
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${destination}`,
        '_blank'
      );
    } else if (Platform.OS === 'ios') {
      // iOS: Apple Maps
      Linking.openURL(`maps://app?daddr=${destination}`);
    } else {
      // Android: Google Maps
      Linking.openURL(`google.navigation:q=${destination}`);
    }
  };

  const handleOpenMap = () => {
    const destination = encodeURIComponent(
      `${location.address}${location.city ? `, ${location.city}` : ''}`
    );
    
    if (Platform.OS === 'web') {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${destination}`,
        '_blank'
      );
    } else {
      Linking.openURL(
        `https://www.google.com/maps/search/?api=1&query=${destination}`
      );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="location" size={24} color="#FF6B6B" />
        <Text style={styles.headerTitle}>Location</Text>
      </View>

      <View style={styles.locationCard}>
        {location.venueName && (
          <Text style={styles.venueName}>{location.venueName}</Text>
        )}
        
        <Text style={styles.address}>
          {location.address}
          {location.city && `, ${location.city}`}
          {location.state && `, ${location.state}`}
          {location.zip && ` ${location.zip}`}
        </Text>

        {/* Static Map Preview (Web) or Link (Mobile) */}
        {Platform.OS === 'web' ? (
          <TouchableOpacity onPress={handleOpenMap} style={styles.mapPreview}>
            <img
              src={`https://maps.googleapis.com/maps/api/staticmap?center=${encodeURIComponent(
                location.address
              )}&zoom=15&size=600x300&markers=color:red%7C${encodeURIComponent(
                location.address
              )}&key=YOUR_GOOGLE_MAPS_API_KEY`}
              alt="Map"
              style={{
                width: '100%',
                height: 200,
                borderRadius: 12,
                objectFit: 'cover',
              }}
              onError={(e) => {
                // Fallback if API key not set or error
                e.target.style.display = 'none';
              }}
            />
            <View style={styles.mapOverlay}>
              <Ionicons name="map" size={24} color="#fff" />
              <Text style={styles.mapOverlayText}>Click to open in Google Maps</Text>
            </View>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.viewMapButton}
            onPress={handleOpenMap}
          >
            <Ionicons name="map" size={20} color="#4ECDC4" />
            <Text style={styles.viewMapText}>View on Map</Text>
          </TouchableOpacity>
        )}

        {/* Get Directions Button */}
        <TouchableOpacity 
          style={styles.directionsButton}
          onPress={handleGetDirections}
        >
          <Ionicons name="navigate" size={20} color="#4ECDC4" />
          <Text style={styles.directionsText}>Get Directions</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
    marginBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
  },
  locationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  venueName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  address: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  mapPreview: {
    position: 'relative',
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  mapOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapOverlayText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  viewMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F0FFFE',
    borderRadius: 8,
    marginBottom: 8,
  },
  viewMapText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4ECDC4',
  },
  directionsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    borderRadius: 8,
  },
  directionsText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4ECDC4',
  },
});

export default LocationMap;

// import React from 'react';
// import { View, Text, StyleSheet, Platform, Linking, TouchableOpacity, Image } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// // Only import maps on mobile
// let MapView, Marker;
// if (Platform.OS !== 'web') {
//   const maps = require('react-native-maps');
//   MapView = maps.default;
//   Marker = maps.Marker;
// }

// export default function LocationMap({ location }) {
//   if (!location || !location.address) {
//     return null;
//   }

//   const { venueName, address, city, state, latitude, longitude } = location;

//   const fullAddress = `${address}${city ? `, ${city}` : ''}${state ? `, ${state}` : ''}`;

//   const handleGetDirections = () => {
//     const destination = encodeURIComponent(fullAddress);
    
//     if (Platform.OS === 'ios') {
//       Linking.openURL(`maps://app?daddr=${destination}`);
//     } else if (Platform.OS === 'android') {
//       Linking.openURL(`google.navigation:q=${destination}`);
//     } else {
//       // Web
//       Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destination}`);
//     }
//   };

//   return (
//     <View style={styles.locationSection}>
//       <View style={styles.sectionHeader}>
//         <Ionicons name="location" size={24} color="#FF6B6B" />
//         <Text style={styles.sectionTitle}>Location</Text>
//       </View>
      
//       <View style={styles.locationCard}>
//         {venueName && (
//           <Text style={styles.venueName}>{venueName}</Text>
//         )}
//         <Text style={styles.address}>{fullAddress}</Text>
        
//         {/* Platform-specific map display */}
//         {Platform.OS !== 'web' && latitude && longitude && MapView ? (
//           // Mobile: Show interactive map (only if react-native-maps is available)
//           <MapView
//             style={styles.map}
//             initialRegion={{
//               latitude,
//               longitude,
//               latitudeDelta: 0.01,
//               longitudeDelta: 0.01,
//             }}
//           >
//             <Marker
//               coordinate={{ latitude, longitude }}
//               title={venueName || 'Event Location'}
//               description={address}
//             />
//           </MapView>
//         ) : (
//           // Web or no coordinates: Show OpenStreetMap embed or placeholder
//           latitude && longitude && Platform.OS === 'web' ? (
//             <View style={styles.mapContainer}>
//               <iframe
//                 width="100%"
//                 height="200"
//                 frameBorder="0"
//                 scrolling="no"
//                 marginHeight="0"
//                 marginWidth="0"
//                 src={`https://www.openstreetmap.org/export/embed.html?bbox=${longitude-0.01},${latitude-0.01},${longitude+0.01},${latitude+0.01}&layer=mapnik&marker=${latitude},${longitude}`}
//                 style={{ border: 0, borderRadius: 8 }}
//               />
//               <TouchableOpacity 
//                 style={styles.mapOverlay}
//                 onPress={() => Linking.openURL(`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`)}
//               >
//                 <Ionicons name="expand" size={16} color="#fff" />
//                 <Text style={styles.overlayText}>View Full Map</Text>
//               </TouchableOpacity>
//             </View>
//           ) : (
//             // No coordinates: Show placeholder with address
//             <View style={styles.mapPlaceholder}>
//               <Ionicons name="location" size={48} color="#4ECDC4" />
//               <Text style={styles.mapPlaceholderText}>
//                 {fullAddress}
//               </Text>
//               <Text style={styles.mapPlaceholderSubtext}>
//                 Tap "Get Directions" to view on map
//               </Text>
//             </View>
//           )
//         )}
        
//         <TouchableOpacity 
//           style={styles.directionsButton}
//           onPress={handleGetDirections}
//         >
//           <Ionicons name="navigate" size={18} color="#4ECDC4" />
//           <Text style={styles.directionsText}>Get Directions</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   locationSection: {
//     marginBottom: 24,
//   },

//   sectionHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 12,
//     gap: 8,
//   },

//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: '700',
//     color: '#333',
//   },

//   locationCard: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 16,
//     borderWidth: 2,
//     borderColor: '#E0E0E0',
//   },

//   venueName: {
//     fontSize: 16,
//     fontWeight: '700',
//     color: '#333',
//     marginBottom: 4,
//   },

//   address: {
//     fontSize: 14,
//     color: '#666',
//     lineHeight: 20,
//     marginBottom: 12,
//   },

//   map: {
//     width: '100%',
//     height: 200,
//     borderRadius: 8,
//     marginVertical: 12,
//   },

//   mapContainer: {
//     width: '100%',
//     height: 200,
//     borderRadius: 8,
//     marginVertical: 12,
//     position: 'relative',
//     overflow: 'hidden',
//   },

//   mapOverlay: {
//     position: 'absolute',
//     bottom: 8,
//     right: 8,
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: 'rgba(0,0,0,0.7)',
//     paddingVertical: 6,
//     paddingHorizontal: 12,
//     borderRadius: 16,
//     gap: 4,
//   },

//   overlayText: {
//     color: '#fff',
//     fontSize: 12,
//     fontWeight: '600',
//   },

//   mapPlaceholder: {
//     width: '100%',
//     height: 200,
//     borderRadius: 8,
//     backgroundColor: '#F5F5F5',
//     justifyContent: 'center',
//     alignItems: 'center',
//     marginVertical: 12,
//     borderWidth: 2,
//     borderStyle: 'dashed',
//     borderColor: '#E0E0E0',
//   },

//   mapPlaceholderText: {
//     fontSize: 14,
//     color: '#666',
//     marginTop: 8,
//     textAlign: 'center',
//     paddingHorizontal: 16,
//   },

//   mapPlaceholderSubtext: {
//     fontSize: 12,
//     color: '#999',
//     marginTop: 4,
//   },

//   directionsButton: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'center',
//     paddingVertical: 12,
//     gap: 8,
//   },

//   directionsText: {
//     fontSize: 14,
//     fontWeight: '700',
//     color: '#4ECDC4',
//   },
// });