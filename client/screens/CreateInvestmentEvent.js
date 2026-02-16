// client/screens/CreateInvestmentEvent.js - FIXED (Web-compatible date picker)
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { GlobalStyles } from '../constants/styles';
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

      <TouchableOpacity
        style={[styles.nextButton, !selected && styles.nextButtonDisabled]}
        onPress={onNext}
        disabled={!selected}
      >
        <Text style={styles.nextButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

/**
 * Step 2: Event Details & Recipient
 * ✨ FIXED: Web-compatible date picker
 */
const RecipientStep = ({ data, onChange, onNext, onBack }) => {
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      onChange({ ...data, eventDate: selectedDate });
    }
  };

  // ✨ FIX: Web-compatible date input
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
            value={data.eventTitle}
            onChangeText={(text) => onChange({ ...data, eventTitle: text })}
          />
        </View>

        {/* Event Date - ✨ FIXED: Web-compatible */}
        <View style={styles.inputGroup}>
          <Text style={styles.inputLabel}>Event Date</Text>
          
          {Platform.OS === 'web' ? (
            // ✨ WEB: Use HTML5 date input
            <input
              type="date"
              value={data.eventDate.toISOString().split('T')[0]}
              onChange={handleWebDateChange}
              min={new Date().toISOString().split('T')[0]}
              style={{
                backgroundColor: GlobalStyles.colors.gray100,
                borderRadius: 12,
                padding: 14,
                fontSize: 16,
                color: GlobalStyles.colors.gray800,
                border: 'none',
                outline: 'none',
                width: '100%',
                fontFamily: 'inherit',
              }}
            />
          ) : (
            // ✨ MOBILE: Use native date picker
            <>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={GlobalStyles.colors.gray600} />
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
            value={data.description}
            onChangeText={(text) => onChange({ ...data, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={GlobalStyles.colors.gray700} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
            onPress={onNext}
            disabled={!isValid}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
          <Ionicons name="information-circle-outline" size={24} color={GlobalStyles.colors.primary600} />
          <Text style={styles.infoText}>
            The recipient will be able to choose how to allocate the target amount among these investments
          </Text>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Ionicons name="arrow-back" size={20} color={GlobalStyles.colors.gray700} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.nextButton, !isValid && styles.nextButtonDisabled]}
            onPress={onNext}
            disabled={!isValid}
          >
            <Text style={styles.nextButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="#fff" />
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
    setIsCreating(true);
    try {
      await onCreate();
    } catch (error) {
      setIsCreating(false);
      console.error('Create error handled in step:', error);
    }
  };

  return (
    <View style={styles.stepContainer}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Invite Contributors</Text>
        <Text style={styles.stepSubtitle}>
          Choose friends who can contribute to this investment gift
        </Text>

        <FriendSelector
          selectedFriends={data.invitedUsers}
          onFriendsChange={(friends) => onChange({ ...data, invitedUsers: friends })}
          maxSelections={50}
        />

        <View style={styles.infoBox}>
          <Ionicons name="gift-outline" size={24} color={GlobalStyles.colors.primary600} />
          <Text style={styles.infoText}>
            You can also share the event link later to invite more people
          </Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryBox}>
          <Text style={styles.summaryTitle}>Event Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Type:</Text>
            <Text style={styles.summaryValue}>
              {EVENT_TYPES.find(t => t.value === data.eventType)?.label}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Title:</Text>
            <Text style={styles.summaryValue}>{data.eventTitle}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Target:</Text>
            <Text style={styles.summaryValue}>${data.targetAmount}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Stocks:</Text>
            <Text style={styles.summaryValue}>
              {data.selectedInvestments.map(s => s.symbol).join(', ')}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Invites:</Text>
            <Text style={styles.summaryValue}>{data.invitedUsers.length} friends</Text>
          </View>
        </View>

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isCreating}>
            <Ionicons name="arrow-back" size={20} color={GlobalStyles.colors.gray700} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createButton, isCreating && styles.createButtonDisabled]}
            onPress={handleCreate}
            disabled={isCreating}
          >
            {isCreating ? (
              <>
                <Text style={styles.createButtonText}>Creating...</Text>
              </>
            ) : (
              <>
                <Text style={styles.createButtonText}>Create Event</Text>
                <Ionicons name="checkmark" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

/**
 * Main Component
 */
export default function CreateInvestmentEvent({ navigation }) {
  const [step, setStep] = useState(1);
  const [eventData, setEventData] = useState({
    eventType: '',
    eventTitle: '',
    eventDate: new Date(),
    targetAmount: '',
    description: '',
    selectedInvestments: [],
    invitedUsers: [],
  });

  const handleCreate = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      // Prepare data for API
      const apiData = {
        eventType: eventData.eventType,
        title: eventData.eventTitle,
        eventDate: eventData.eventDate.toISOString(),
        targetAmount: parseFloat(eventData.targetAmount),
        description: eventData.description,
        selectedInvestments: eventData.selectedInvestments.map(s => ({
          symbol: s.symbol,
          name: s.name,
          type: s.type,
        })),
        invitedUserIds: eventData.invitedUsers.map(u => u.id || u._id),
      };

      await createEvent(token, apiData);
      
      Alert.alert(
        'Success!',
        'Your investment event has been created successfully.',
        [{ text: 'OK', onPress: () => navigation.navigate('EventFeed') }]
      );
    } catch (error) {
      console.error('Create event error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to create event. Please try again.'
      );
      throw error; // Re-throw so step component knows
    }
  };

  return (
    <View style={styles.container}>
      {/* Progress Indicator */}
      <View style={styles.progressContainer}>
        {[1, 2, 3, 4].map((num) => (
          <View key={num} style={styles.progressItemContainer}>
            <View
              style={[
                styles.progressDot,
                step >= num && styles.progressDotActive,
                step > num && styles.progressDotCompleted,
              ]}
            >
              {step > num ? (
                <Ionicons name="checkmark" size={16} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.progressNumber,
                    step >= num && styles.progressNumberActive,
                  ]}
                >
                  {num}
                </Text>
              )}
            </View>
            {num < 4 && (
              <View
                style={[
                  styles.progressLine,
                  step > num && styles.progressLineActive,
                ]}
              />
            )}
          </View>
        ))}
      </View>

      {/* Step Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <EventTypeStep
            selected={eventData.eventType}
            onSelect={(type) => setEventData({ ...eventData, eventType: type })}
            onNext={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <RecipientStep
            data={eventData}
            onChange={setEventData}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}

        {step === 3 && (
          <InvestmentSelectionStep
            data={eventData}
            onChange={setEventData}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}

        {step === 4 && (
          <InviteContributorsStep
            data={eventData}
            onChange={setEventData}
            onCreate={handleCreate}
            onBack={() => setStep(3)}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  progressItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: GlobalStyles.colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressDotActive: {
    backgroundColor: GlobalStyles.colors.primary500,
  },
  progressDotCompleted: {
    backgroundColor: GlobalStyles.colors.success500,
  },
  progressNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray500,
  },
  progressNumberActive: {
    color: '#fff',
  },
  progressLine: {
    width: 40,
    height: 2,
    backgroundColor: GlobalStyles.colors.gray200,
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: GlobalStyles.colors.success500,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: GlobalStyles.colors.gray600,
    marginBottom: 24,
  },
  eventTypesContainer: {
    marginBottom: 32,
  },
  eventTypeButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    backgroundColor: GlobalStyles.colors.gray100,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  eventTypeButtonSelected: {
    backgroundColor: GlobalStyles.colors.primary50,
    borderColor: GlobalStyles.colors.primary500,
  },
  eventTypeLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    textAlign: 'center',
  },
  eventTypeLabelSelected: {
    color: GlobalStyles.colors.primary700,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginBottom: 8,
  },
  input: {
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
    borderWidth: 1,
    borderColor: 'transparent',
    outlineStyle: 'none', // ✨ FIX: Remove web outline
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  dateButtonText: {
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
    marginLeft: 12,
  },
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray700,
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
    outlineStyle: 'none', // ✨ FIX: Remove web outline
  },
  inputHint: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    marginTop: 6,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: GlobalStyles.colors.primary50,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: GlobalStyles.colors.gray700,
    marginLeft: 12,
    lineHeight: 20,
  },
  summaryBox: {
    backgroundColor: GlobalStyles.colors.gray50,
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.gray800,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.gray800,
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
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: GlobalStyles.colors.gray100,
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginLeft: 8,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: GlobalStyles.colors.primary500,
    flex: 1,
  },
  nextButtonDisabled: {
    backgroundColor: GlobalStyles.colors.gray400,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: GlobalStyles.colors.success500,
    flex: 1,
  },
  createButtonDisabled: {
    backgroundColor: GlobalStyles.colors.gray400,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginRight: 8,
  },
});