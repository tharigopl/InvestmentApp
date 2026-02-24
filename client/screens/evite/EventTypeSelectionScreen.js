import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const EVENT_TYPES = [
  {
    id: 'birthday',
    label: 'Birthday Party',
    icon: 'balloon',
    emoji: '🎂',
    description: 'Celebrate another trip around the sun',
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#FF8E53'],
  },
  {
    id: 'wedding',
    label: 'Wedding',
    icon: 'heart',
    emoji: '💍',
    description: 'Begin your forever together',
    color: '#C4A661',
    gradient: ['#C4A661', '#D4A574'],
  },
  {
    id: 'baby_shower',
    label: 'Baby Shower',
    icon: 'baby',
    emoji: '👶',
    description: 'Welcome the newest addition',
    color: '#FFB6C1',
    gradient: ['#FFB6C1', '#B0E0E6'],
  },
  {
    id: 'graduation',
    label: 'Graduation',
    icon: 'school',
    emoji: '🎓',
    description: 'Celebrate academic achievement',
    color: '#4ECDC4',
    gradient: ['#4ECDC4', '#44A08D'],
  },
  {
    id: 'anniversary',
    label: 'Anniversary',
    icon: 'heart-circle',
    emoji: '💝',
    description: 'Celebrate years of love',
    color: '#FF6B6B',
    gradient: ['#FF6B6B', '#FFB6C1'],
  },
  {
    id: 'housewarming',
    label: 'Housewarming',
    icon: 'home',
    emoji: '🏠',
    description: 'Celebrate a new home',
    color: '#8B7355',
    gradient: ['#8B7355', '#D4A574'],
  },
  {
    id: 'retirement',
    label: 'Retirement',
    icon: 'sunny',
    emoji: '🌴',
    description: 'Begin a new chapter',
    color: '#FFD93D',
    gradient: ['#FFD93D', '#FFB84D'],
  },
  {
    id: 'other',
    label: 'Other Celebration',
    icon: 'sparkles',
    emoji: '🎉',
    description: 'Any special occasion',
    color: '#A8E6CF',
    gradient: ['#A8E6CF', '#4ECDC4'],
  },
];

export default function EventTypeSelectionScreen({ navigation }) {
  const [selectedType, setSelectedType] = useState(null);

  const handleSelectType = (type) => {
    setSelectedType(type.id);
    
    // Small delay for visual feedback, then navigate
    setTimeout(() => {
      navigation.navigate('DesignSelection', { 
        eventType: type.id,
        eventTypeLabel: type.label,
      });
    }, 200);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Event</Text>
          <Text style={styles.headerSubtitle}>What are we celebrating?</Text>
        </View>
      </LinearGradient>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.sectionTitle}>Choose Event Type</Text>
        <Text style={styles.sectionSubtitle}>
          Select the type of celebration you're planning
        </Text>

        {/* Event Type Cards */}
        <View style={styles.cardsContainer}>
          {EVENT_TYPES.map((type) => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.card,
                selectedType === type.id && styles.cardSelected,
              ]}
              onPress={() => handleSelectType(type)}
              activeOpacity={0.7}
            >
              <LinearGradient
                colors={
                  selectedType === type.id 
                    ? type.gradient 
                    : ['#FFFFFF', '#FFFFFF']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.cardGradient,
                  selectedType === type.id && styles.cardGradientSelected,
                ]}
              >
                {/* Emoji Icon */}
                <View style={[
                  styles.emojiContainer,
                  selectedType === type.id && styles.emojiContainerSelected,
                ]}>
                  <Text style={styles.emoji}>{type.emoji}</Text>
                </View>

                {/* Content */}
                <View style={styles.cardContent}>
                  <Text style={[
                    styles.cardLabel,
                    selectedType === type.id && styles.cardLabelSelected,
                  ]}>
                    {type.label}
                  </Text>
                  <Text style={[
                    styles.cardDescription,
                    selectedType === type.id && styles.cardDescriptionSelected,
                  ]}>
                    {type.description}
                  </Text>
                </View>

                {/* Selection Indicator */}
                {selectedType === type.id && (
                  <View style={styles.selectionIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color="#fff" />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Don't worry! You can customize everything in the next steps.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },

  // Header
  header: {
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
    marginLeft: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 4,
  },

  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 22,
  },

  // Cards
  cardsContainer: {
    gap: 16,
  },
  card: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  cardSelected: {
    shadowColor: '#FF6B6B',
    shadowOpacity: 0.3,
    elevation: 8,
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderRadius: 16,
  },
  cardGradientSelected: {
    borderColor: 'transparent',
  },
  emojiContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emojiContainerSelected: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  emoji: {
    fontSize: 32,
  },
  cardContent: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  cardLabelSelected: {
    color: '#fff',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  cardDescriptionSelected: {
    color: 'rgba(255,255,255,0.9)',
  },
  selectionIndicator: {
    marginLeft: 12,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});