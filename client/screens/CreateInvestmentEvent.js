// client/screens/CreateInvestmentEvent.js - UPDATED WITH NEW THEME
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import StockPicker from '../components/StockPicker';
import FriendSelector from '../components/FriendSelector';
import { createEvent } from '../util/events';

const EVENT_TYPES = [
  { label: '🎂 Birthday', value: 'birthday' },
  { label: '💍 Wedding', value: 'wedding' },
  { label: '🎓 Graduation', value: 'graduation' },
  { label: '👶 Baby Shower', value: 'baby' },
  { label: '💝 Anniversary', value: 'anniversary' },
  { label: '🎉 Other', value: 'other' },
];

/**
 * Step 1: Event Type Selection
 */
const EventTypeStep = ({ selected, onSelect, onNext }) => {
  return (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Choose Event Type</Text>
      <Text style={styles.stepSubtitle}>What's the occasion for this investment gift?</Text>

      <View style={styles.eventTypesContainer}>
        {EVENT_TYPES.map((type) => (
          <TouchableOpacity
            key={type.value}
            style={[
              styles.eventTypeButton,
              selected === type.value && styles.eventTypeButtonSelected,
            ]}
            onPress={() => onSelect(type.value)}
          >
            <Text
              style={[
                styles.eventTypeLabel,
                selected === type.value && styles.eventTypeLabelSelected,
              ]}
            >
              {type.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Next Button with Gradient */}
      <TouchableOpacity
        style={[styles.nextButtonContainer, !selected && styles.buttonDisabled]}
        onPress={onNext}
        disabled={!selected}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={!selected ? ['#CCC', '#AAA'] : ['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.buttonGradient}
        >
          <Text style={styles.buttonText}>Next</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
};

/**
 * Step 2: Event Details & Recipient
 */
const RecipientStep = ({ data, onChange, onNext, onBack }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange({ ...data, eventDate: selectedDate });
    }
  };

  const handleWebDateChange = (event) => {
    const dateValue = event.target.value;
    if (dateValue) {
      onChange({ ...data, eventDate: new Date(dateValue) });
    }
  };

  const isValid = data.eventTitle && data.targetAmount && parseFloat(data.targetAmount) > 0;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.stepContainer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Event Details</Text>
        <Text style={styles.stepSubtitle}>Tell us about this special occasion</Text>

        {/* Event Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sarah's 30th Birthday"
            placeholderTextColor="#999"
            value={data.eventTitle}
            onChangeText={(text) => onChange({ ...data, eventTitle: text })}
          />
        </View>

        {/* Event Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Event Date</Text>
          
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={data.eventDate.toISOString().split('T')[0]}
              onChange={handleWebDateChange}
              min={new Date().toISOString().split('T')[0]}
              style={{
                backgroundColor: '#fff',
                borderRadius: 14,
                padding: 16,
                fontSize: 16,
                color: '#333',
                border: '2px solid #E0E0E0',
                outline: 'none',
                width: '100%',
                fontFamily: 'inherit',
                fontWeight: '500',
              }}
            />
          ) : (
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color="#666" />
                <Text style={styles.dateButtonText}>
                  {data.eventDate.toLocaleDateString('en-US', {
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={data.eventDate}
                  mode="date"
                  display="default"
                  onChange={handleDateChange}
                  minimumDate={new Date()}
                />
              )}
            </>
          )}
        </View>

        {/* Target Amount */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Target Amount (USD) *</Text>
          <View style={styles.amountInputContainer}>
            <Text style={styles.currencySymbol}>$</Text>
            <TextInput
              style={styles.amountInput}
              placeholder="100"
              placeholderTextColor="#999"
              value={data.targetAmount}
              onChangeText={(text) => onChange({ ...data, targetAmount: text })}
              keyboardType="decimal-pad"
            />
          </View>
          <Text style={styles.inputHint}>
            This is the total amount to be pooled for investment
          </Text>
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add a personal message..."
            placeholderTextColor="#999"
            value={data.description}
            onChangeText={(text) => onChange({ ...data, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButtonContainer, !isValid && styles.buttonDisabled]}
            onPress={onNext}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={!isValid ? ['#CCC', '#AAA'] : ['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/**
 * Step 3: Investment Selection
 */
const InvestmentSelectionStep = ({ data, onChange, onNext, onBack }) => {
  const isValid = data.selectedInvestments.length > 0;

  return (
    <View style={styles.stepContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Select Investments</Text>
        <Text style={styles.stepSubtitle}>
          Choose stocks or ETFs for the recipient to invest in
        </Text>

        <StockPicker
          selectedStocks={data.selectedInvestments}
          onStocksChange={(stocks) => onChange({ ...data, selectedInvestments: stocks })}
          maxSelections={5}
        />

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={24} color="#4ECDC4" />
          <Text style={styles.infoText}>
            The recipient will be able to choose how to allocate the target amount among these investments
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButtonContainer, !isValid && styles.buttonDisabled]}
            onPress={onNext}
            disabled={!isValid}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={!isValid ? ['#CCC', '#AAA'] : ['#FF6B6B', '#FF8E53']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Text style={styles.buttonText}>Next</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Step 4: Invite Contributors
 */
const InviteContributorsStep = ({ data, onChange, onCreate, onBack }) => {
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    console.log("🟢 Create Event button clicked!");
    console.log("Event data:", data);
    setIsCreating(true);
    try {
      await onCreate();
      setIsCreating(false);
    } catch (error) {
      setIsCreating(false);
      console.error('Create error handled in step:', error);
    }
  };

  console.log("📍 Step 4 (InviteContributorsStep) rendered");

  return (
    <View style={styles.stepContainer}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
      >
        <Text style={styles.stepTitle}>Invite Contributors</Text>
        <Text style={styles.stepSubtitle}>
          Choose friends to help fund this gift (optional)
        </Text>

        <FriendSelector
          selectedFriends={data.invitedUsers}
          onFriendsChange={(friends) => onChange({ ...data, invitedUsers: friends })}
        />

        <View style={styles.infoBox}>
          <Ionicons name="people" size={24} color="#FFD93D" />
          <Text style={styles.infoText}>
            You can skip this step and share the event link later
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>📋 Event Summary</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Event Type:</Text>
            <Text style={styles.summaryValue}>
              {EVENT_TYPES.find(t => t.value === data.eventType)?.label}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Title:</Text>
            <Text style={styles.summaryValue}>{data.eventTitle}</Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Date:</Text>
            <Text style={styles.summaryValue}>
              {data.eventDate.toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Target Amount:</Text>
            <Text style={[styles.summaryValue, { color: '#4ECDC4', fontWeight: '800' }]}>
              ${parseFloat(data.targetAmount || 0).toFixed(2)}
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Investments:</Text>
            <Text style={styles.summaryValue}>
              {data.selectedInvestments.length} selected
            </Text>
          </View>

          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Contributors:</Text>
            <Text style={styles.summaryValue}>
              {data.invitedUsers.length} invited
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Sticky Bottom Buttons */}
      <View style={styles.stickyBottomBar}>
        <TouchableOpacity 
          style={[styles.backButton, { flex: 1 }]} 
          onPress={onBack} 
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#666" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.createButtonContainer, { flex: 1 }]}
          onPress={handleCreate}
          disabled={isCreating}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.buttonGradient}
          >
            {isCreating ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Ionicons name="checkmark-circle" size={24} color="#fff" />
                <Text style={styles.buttonText}>Create Event</Text>
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
};

/**
 * Main Component
 */
export default function CreateInvestmentEvent({ navigation }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [eventData, setEventData] = useState({
    eventType: '',
    eventTitle: '',
    eventDate: new Date(),
    targetAmount: '',
    description: '',
    selectedInvestments: [],
    invitedUsers: [],
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // CORRECTED handleCreate function for CreateInvestmentEvent-UPDATED.js
// This matches the OLD WORKING version's field names

const handleCreate = async () => {
  try {
    console.log('🟢 Creating event with data:', eventData);
    
    // ✅ Use 'uid' key (not 'userId')
    const userId = await AsyncStorage.getItem('uid');
    console.log('📋 User ID from AsyncStorage:', userId);
    
    if (!userId) {
      Alert.alert('Error', 'User not logged in. Please log in again.');
      throw new Error('User ID not found in AsyncStorage');
    }
    
    // Calculate contribution deadline (7 days before event by default)
    const contributionDeadline = new Date(eventData.eventDate);
    contributionDeadline.setDate(contributionDeadline.getDate() - 7);
    
    // ✅ CRITICAL: Match backend field names EXACTLY as in old version
    const apiData = {
      eventType: eventData.eventType,
      eventTitle: eventData.eventTitle,
      recipientUserId: userId, // ✅ Backend expects "recipientUserId" not "recipientUser"
      eventDate: eventData.eventDate.toISOString(),
      eventDescription: eventData.description || '', // ✅ Backend expects "eventDescription" not "description"
      targetAmount: parseFloat(eventData.targetAmount),
      contributionDeadline: contributionDeadline.toISOString(),
      selectedInvestments: eventData.selectedInvestments.map(s => ({
        symbol: s.symbol,
        name: s.name,
        type: s.type || 'stock',
      })),
      invitedUsers: eventData.invitedUsers.map(u => u.id || u._id), // ✅ Backend expects "invitedUsers" not "selectedFriends"
    };

    console.log('📤 Sending to API:', apiData);
    console.log('📤 Field check:', {
      hasEventType: !!apiData.eventType,
      hasEventTitle: !!apiData.eventTitle,
      hasRecipientUserId: !!apiData.recipientUserId,
      hasEventDate: !!apiData.eventDate,
      hasTargetAmount: !!apiData.targetAmount,
      hasContributionDeadline: !!apiData.contributionDeadline,
    });
    
    // ✅ createEvent uses apiClient which handles auth automatically
    const result = await createEvent(apiData);
    
    console.log('✅ Event created successfully:', result);
    
    // Go back to previous screen
    navigation.goBack();
    
    // Show success message after navigation
    setTimeout(() => {
      Alert.alert(
        'Success! 🎉',
        'Your investment event has been created successfully.'
      );
    }, 500);
    
  } catch (error) {
    console.error('❌ Create event error:', error);
    console.error('Error message:', error.message);
    console.error('Error response:', error.response?.data);
    console.error('Error status:', error.response?.status);
    Alert.alert(
      'Error',
      error.response?.data?.message || 'Failed to create event. Please try again.'
    );
  }
};

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((step, index) => (
          <View key={step} style={styles.progressItemContainer}>
            <View
              style={[
                styles.progressDot,
                currentStep >= step && styles.progressDotActive,
                currentStep > step && styles.progressDotCompleted,
              ]}
            >
              {currentStep > step ? (
                <Ionicons name="checkmark" size={18} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.progressNumber,
                    currentStep >= step && styles.progressNumberActive,
                  ]}
                >
                  {step}
                </Text>
              )}
            </View>
            {index < 3 && (
              <View
                style={[
                  styles.progressLine,
                  currentStep > step && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Content */}
      <View style={styles.content}>
        {currentStep === 1 && (
          <EventTypeStep
            selected={eventData.eventType}
            onSelect={(type) => setEventData({ ...eventData, eventType: type })}
            onNext={handleNext}
          />
        )}

        {currentStep === 2 && (
          <RecipientStep
            data={eventData}
            onChange={setEventData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 3 && (
          <InvestmentSelectionStep
            data={eventData}
            onChange={setEventData}
            onNext={handleNext}
            onBack={handleBack}
          />
        )}

        {currentStep === 4 && (
          <InviteContributorsStep
            data={eventData}
            onChange={setEventData}
            onCreate={handleCreate}
            onBack={handleBack}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 2,
    borderBottomColor: '#FFE5B4',
  },
  progressItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: '#FF6B6B',
  },
  progressDotCompleted: {
    backgroundColor: '#4ECDC4',
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#999',
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLine: {
    width: 40,
    height: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#4ECDC4',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
    lineHeight: 24,
  },
  eventTypesContainer: {
    marginBottom: 32,
  },
  eventTypeButton: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    backgroundColor: '#fff',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventTypeButtonSelected: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF6B6B',
  },
  eventTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  eventTypeLabelSelected: {
    fontWeight: '800',
    color: '#FF6B6B',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    outlineStyle: 'none',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginLeft: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: '800',
    color: '#333',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    outlineStyle: 'none',
  },
  inputHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 6,
    lineHeight: 18,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#E8FFF8',
    borderRadius: 16,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#C4F5E8',
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0D7C66',
    lineHeight: 20,
    fontWeight: '500',
  },
  summaryBox: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#FFE5B4',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    flex: 1,
    textAlign: 'right',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
    gap: 12,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    flex: 1,
    gap: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  nextButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    flex: 1,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#4ECDC4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
    shadowOpacity: 0,
  },
  stickyBottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderTopWidth: 2,
    borderTopColor: '#FFE5B4',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});