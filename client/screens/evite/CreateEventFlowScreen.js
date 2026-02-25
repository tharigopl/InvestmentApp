// client/screens/evite/CreateEventFlowScreen.js
import React, { useState, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UserContext } from '../../store/user-context';
import FriendSelector from '../../components/FriendSelector';
import StockPicker from '../../components/StockPicker';
import apiClient from '../../util/api-client';

export default function CreateEventFlowScreen({ route, navigation }) {
  const { eventType, eventTypeLabel, design } = route.params;
  const userCtx = useContext(UserContext);

  // Current step (1-5)
  const [currentStep, setCurrentStep] = useState(1);

  // Event data
  const [eventData, setEventData] = useState({
    eventType,
    eventTitle: '',
    eventDate: new Date(),
    eventTime: '',
    description: '',
    
    // Location
    location: {
      venueName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
    
    // Design
    design: design || { type: 'none' },
    
    // Registry
    registryType: 'stock', // 'stock', 'amazon', 'target', 'cash_fund', 'none'
    selectedInvestments: [],
    targetAmount: '',
    externalRegistry: {
      platform: '',
      registryUrl: '',
    },
    cashFund: {
      fundName: '',
      fundDescription: '',
    },
    
    // Guests
    invitedUsers: [], // Array of user IDs (registered users)
    guestList: [], // Array of { email, name, phone } (external guests)
    
    // Settings
    allowPlusOnes: false,
    maxPlusOnes: 1,
    rsvpDeadline: null,
    hasGoal: true,
  });

  const [isCreating, setIsCreating] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Step validation
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return eventData.eventTitle.trim().length > 0;
      case 2:
        return true; // Optional fields
      case 3:
        // All registry types can be goalless now!
        if (eventData.registryType === 'stock') {
            // Stock needs investments selected
            // Goal is optional
            if (eventData.hasGoal) {
               return eventData.selectedInvestments.length > 0 && eventData.targetAmount > 0;
            }
               return eventData.selectedInvestments.length > 0;
            }
            if (eventData.registryType === 'cash_fund') {
              // Cash fund needs name
              // Goal is optional
              if (eventData.hasGoal) {
                return eventData.cashFund.fundName && eventData.targetAmount > 0;
              }
                return eventData.cashFund.fundName;
            }
        return true;  // No registry or Amazon
      case 4:
        return true; // Optional - can invite later
      case 5:
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateEvent();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigation.goBack();
    }
  };

  const handleWebDateChange = (event) => {
    const dateValue = event.target.value;
    if (dateValue) {
        setEventData({ ...eventData, eventDate: new Date(dateValue) });
    }
  };

  const handleCreateEvent = async () => {
    try {
      setIsCreating(true);

      // Prepare event payload
      const payload = {
        eventType: eventData.eventType,
        eventTitle: eventData.eventTitle,
        eventDate: eventData.eventDate.toISOString(),
        eventTime: eventData.eventTime,
        eventDescription: eventData.description,
        
        // Handle optional goal
        hasGoal: eventData.hasGoal,
        targetAmount: eventData.hasGoal ? parseFloat(eventData.targetAmount) || 0 : 0,
        contributionDeadline: eventData.rsvpDeadline || new Date(eventData.eventDate),
        
        // Design
        design: eventData.design,
        
        // Location
        location: eventData.location.address ? eventData.location : undefined,
        
        // Registry
        registryType: eventData.registryType,
        selectedInvestments: eventData.selectedInvestments,
        externalRegistry: eventData.externalRegistry.registryUrl ? eventData.externalRegistry : undefined,
        cashFund: eventData.cashFund.fundName ? eventData.cashFund : undefined,
        
        // Recipient (yourself for now)
        recipientUser: userCtx.userAccount._id,
        
        // Settings
        allowPlusOnes: eventData.allowPlusOnes,
        maxPlusOnes: eventData.maxPlusOnes,
        rsvpDeadline: eventData.rsvpDeadline,
        
        status: 'active',
      };

      // Create event
      const response = await apiClient.post('/events', payload);
      const createdEvent = response.data.event || response.data;

      // If guests were selected, send invites
      if (eventData.invitedUsers.length > 0 || eventData.guestList.length > 0) {
        const guests = [
          ...eventData.invitedUsers.map(userId => ({ userId })),
          ...eventData.guestList.map(guest => ({ email: guest.email, name: guest.name, phone: guest.phone })),
        ];

        await apiClient.post(`/events/${createdEvent._id}/invite`, { guests });
      }

      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
        
        navigation.reset({
	              index: 0,
	              routes: [{ name: 'EventFeed' }],
	            });
      } else {
        // Mobile - use Alert with Promise
        Alert.alert(
            '🎉 Event Created!',
            `${eventData.eventTitle} has been created successfully!`,
	      [
	        {
	          text: 'Done',
	          onPress: () => {
	            navigation.reset({
	              index: 0,
	              routes: [{ name: 'EventFeed' }],
	            });
	          },
	        },
	        {
	          text: 'View Event',
	          onPress: () => {
	            navigation.reset({
	              index: 0,
	              routes: [{ name: 'EventFeed' }],
	            });
	            setTimeout(() => {
	              navigation.navigate('EventDetails', { eventId: createdEvent._id });
	            }, 100);
	          },
	        },
	      ]
          );
      }

    } catch (error) {
      console.error('Error creating event:', error);
      Alert.alert('Error', error.response?.data?.message || 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

//   const handleCreateEvent = async () => {
//     try {
//       setIsCreating(true);

//       // Prepare event payload
//       const payload = {
//         eventType: eventData.eventType,
//         eventTitle: eventData.eventTitle,
//         eventDate: eventData.eventDate.toISOString(),
//         eventTime: eventData.eventTime,
//         eventDescription: eventData.description,
        
//         // Handle optional goal
//         hasGoal: eventData.hasGoal,
//         targetAmount: eventData.hasGoal ? parseFloat(eventData.targetAmount) || 0 : 0,
//         contributionDeadline: eventData.rsvpDeadline || new Date(eventData.eventDate),
        
//         // Design
//         design: eventData.design,
        
//         // Location
//         location: eventData.location.address ? eventData.location : undefined,
        
//         // Registry
//         registryType: eventData.registryType,
//         selectedInvestments: eventData.selectedInvestments,
//         externalRegistry: eventData.externalRegistry.registryUrl ? eventData.externalRegistry : undefined,
//         cashFund: eventData.cashFund.fundName ? eventData.cashFund : undefined,
        
//         // Recipient (yourself for now)
//         recipientUser: userCtx.userAccount._id,
        
//         // Settings
//         allowPlusOnes: eventData.allowPlusOnes,
//         maxPlusOnes: eventData.maxPlusOnes,
//         rsvpDeadline: eventData.rsvpDeadline,
        
//         status: 'active',
//       };

//       // Create event
//       const response = await apiClient.post('/events', payload);
//       const createdEvent = response.data.event || response.data;

//       // If guests were selected, send invites
//       if (eventData.invitedUsers.length > 0 || eventData.guestList.length > 0) {
//         const guests = [
//           ...eventData.invitedUsers.map(userId => ({ userId })),
//           ...eventData.guestList.map(guest => ({ email: guest.email, name: guest.name, phone: guest.phone })),
//         ];

//         await apiClient.post(`/events/${createdEvent._id}/invite`, { guests });
//       }

//       if (Platform.OS === 'web' && typeof window !== 'undefined' && window.confirm) {
//         navigation.navigate('EventFeed');
//       } else {
//         // Mobile - use Alert with Promise
//         Alert.alert(
//             '🎉 Event Created!',
//             `${eventData.eventTitle} has been created successfully!`,
//             [
//               {
//                 text: 'View Event',
//                 onPress: () => {
//                     navigation.navigate('EventFeed');                
//                 },
//               },
//             ]
//           );
//       }

//     } catch (error) {
//       console.error('Error creating event:', error);
//       Alert.alert('Error', error.response?.data?.message || 'Failed to create event');
//     } finally {
//       setIsCreating(false);
//     }
//   };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4, 5].map((step) => (
        <View key={step} style={styles.progressStepContainer}>
          <View style={[
            styles.progressStep,
            currentStep >= step && styles.progressStepActive,
            currentStep === step && styles.progressStepCurrent,
          ]}>
            {currentStep > step ? (
              <Ionicons name="checkmark" size={16} color="#fff" />
            ) : (
              <Text style={[
                styles.progressStepText,
                currentStep >= step && styles.progressStepTextActive,
              ]}>
                {step}
              </Text>
            )}
          </View>
          {step < 5 && (
            <View style={[
              styles.progressLine,
              currentStep > step && styles.progressLineActive,
            ]} />
          )}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.stepContainer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Event Basics</Text>
        <Text style={styles.stepSubtitle}>Tell us about your {eventTypeLabel.toLowerCase()}</Text>

        {/* Event Title */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Title *</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Sarah's 30th Birthday"
            value={eventData.eventTitle}
            onChangeText={(text) => setEventData({ ...eventData, eventTitle: text })}
          />
        </View>

        {/* Event Date */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Date *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={eventData.eventDate.toISOString().split('T')[0]}
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
                fontFamily: 'inherit',
                fontWeight: '500',
              }}
            />
          ) : (
            <>
                <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
                    <Ionicons name="calendar" size={20} color="#4ECDC4" />
                    <Text style={styles.dateButtonText}>
                    {eventData.eventDate.toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                    })}
                    </Text>
                </TouchableOpacity>

                {showDatePicker && (
                    <DateTimePicker
                    value={eventData.eventDate}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (selectedDate) {
                        setEventData({ ...eventData, eventDate: selectedDate });
                        }
                    }}
                    minimumDate={new Date()}
                    />
                )}
            </>
          )}
        </View>

        {/* Event Time */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Event Time (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 6:00 PM"
            value={eventData.eventTime}
            onChangeText={(text) => setEventData({ ...eventData, eventTime: text })}
          />
        </View>

        {/* Description */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Add details about your event..."
            value={eventData.description}
            onChangeText={(text) => setEventData({ ...eventData, description: text })}
            multiline
            numberOfLines={4}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.stepContainer}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Location & Details</Text>
        <Text style={styles.stepSubtitle}>Where will this event take place?</Text>

        {/* Venue Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Venue Name</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., Grand Ballroom"
            value={eventData.location.venueName}
            onChangeText={(text) => setEventData({
              ...eventData,
              location: { ...eventData.location, venueName: text }
            })}
          />
        </View>

        {/* Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            placeholder="123 Main St"
            value={eventData.location.address}
            onChangeText={(text) => setEventData({
              ...eventData,
              location: { ...eventData.location, address: text }
            })}
          />
        </View>

        {/* City, State */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 2 }]}>
            <Text style={styles.label}>City</Text>
            <TextInput
              style={styles.input}
              placeholder="San Francisco"
              value={eventData.location.city}
              onChangeText={(text) => setEventData({
                ...eventData,
                location: { ...eventData.location, city: text }
              })}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>State</Text>
            <TextInput
              style={styles.input}
              placeholder="CA"
              value={eventData.location.state}
              onChangeText={(text) => setEventData({
                ...eventData,
                location: { ...eventData.location, state: text }
              })}
            />
          </View>

          <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
            <Text style={styles.label}>Zip</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              value={eventData.location.zipCode}
              onChangeText={(text) => setEventData({
                ...eventData,
                location: { ...eventData.location, state: text }
              })}
            />
          </View>
        </View>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#4ECDC4" />
          <Text style={styles.infoText}>
            Location is optional but helps guests find your event!
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStep3 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Gift Registry</Text>
      <Text style={styles.stepSubtitle}>How should guests contribute?</Text>

      {/* Registry Type Selector */}
      <View style={styles.registryOptions}>
        <TouchableOpacity
          style={[
            styles.registryOption,
            eventData.registryType === 'stock' && styles.registryOptionSelected,
          ]}
          onPress={() => setEventData({ ...eventData, registryType: 'stock' })}
        >
          <View style={styles.registryIconContainer}>
            <Ionicons name="trending-up" size={24} color={eventData.registryType === 'stock' ? '#4ECDC4' : '#999'} />
          </View>
          <Text style={[
            styles.registryOptionLabel,
            eventData.registryType === 'stock' && styles.registryOptionLabelSelected,
          ]}>
            Stock Investment
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.registryOption,
            eventData.registryType === 'amazon' && styles.registryOptionSelected,
          ]}
          onPress={() => setEventData({ ...eventData, registryType: 'amazon' })}
        >
          <View style={styles.registryIconContainer}>
            <Ionicons name="gift" size={24} color={eventData.registryType === 'amazon' ? '#4ECDC4' : '#999'} />
          </View>
          <Text style={[
            styles.registryOptionLabel,
            eventData.registryType === 'amazon' && styles.registryOptionLabelSelected,
          ]}>
            Amazon Registry
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.registryOption,
            eventData.registryType === 'cash_fund' && styles.registryOptionSelected,
          ]}
          onPress={() => setEventData({ ...eventData, registryType: 'cash_fund' })}
        >
          <View style={styles.registryIconContainer}>
            <Ionicons name="cash" size={24} color={eventData.registryType === 'cash_fund' ? '#4ECDC4' : '#999'} />
          </View>
          <Text style={[
            styles.registryOptionLabel,
            eventData.registryType === 'cash_fund' && styles.registryOptionLabelSelected,
          ]}>
            Cash Fund
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.registryOption,
            eventData.registryType === 'none' && styles.registryOptionSelected,
          ]}
          onPress={() => setEventData({ ...eventData, registryType: 'none' })}
        >
          <View style={styles.registryIconContainer}>
            <Ionicons name="close-circle" size={24} color={eventData.registryType === 'none' ? '#4ECDC4' : '#999'} />
          </View>
          <Text style={[
            styles.registryOptionLabel,
            eventData.registryType === 'none' && styles.registryOptionLabelSelected,
          ]}>
            No Registry
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stock Registry Setup */}
      {eventData.registryType === 'stock' && (
        <View style={styles.registrySetup}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount (USD) *</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="500"
                value={eventData.targetAmount}
              onChangeText={(text) => setEventData({ ...eventData, targetAmount: text, hasGoal: true })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>

          <StockPicker
            selectedStocks={eventData.selectedInvestments}
            onStocksChange={(stocks) => setEventData({ ...eventData, selectedInvestments: stocks })}
            maxSelections={5}
          />
        </View>
      )}

      {/* Amazon Registry */}
      {eventData.registryType === 'amazon' && (
        <View style={styles.registrySetup}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Amazon Registry URL</Text>
            <TextInput
              style={styles.input}
              placeholder="https://www.amazon.com/wedding/registry/..."
              value={eventData.externalRegistry.registryUrl}
              onChangeText={(text) => setEventData({
                ...eventData,
                externalRegistry: { platform: 'amazon', registryUrl: text }
              })}
            />
          </View>
        </View>
      )}

      {/* Cash Fund */}
      {eventData.registryType === 'cash_fund' && (
        <View style={styles.registrySetup}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Fund Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Honeymoon Fund"
              value={eventData.cashFund.fundName}
              onChangeText={(text) => setEventData({
                ...eventData,
                cashFund: { ...eventData.cashFund, fundName: text }
              })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Tell guests how they can help..."
              value={eventData.cashFund.fundDescription}
              onChangeText={(text) => setEventData({
                ...eventData,
                cashFund: { ...eventData.cashFund, fundDescription: text }
              })}
              multiline
              numberOfLines={3}
            />
          </View>

        {/* NEW: Goal Toggle */}
        <View style={styles.goalToggleContainer}>
          <TouchableOpacity
            style={styles.goalToggle}
            onPress={() => setEventData({ 
              ...eventData, 
              hasGoal: !eventData.hasGoal,
              targetAmount: eventData.hasGoal ? '' : eventData.targetAmount
            })}
          >
            <View style={[styles.checkbox, eventData.hasGoal && styles.checkboxChecked]}>
              {eventData.hasGoal && <Ionicons name="checkmark" size={16} color="#fff" />}
            </View>
            <Text style={styles.goalToggleLabel}>Set a target goal</Text>
          </TouchableOpacity>
          <Text style={styles.goalToggleHint}>
            {eventData.hasGoal 
              ? 'Guests will see progress toward your goal' 
              : 'Accept any amount - no target required'}
          </Text>
        </View>

        {/* Conditional Target Amount */}
        {eventData.hasGoal && (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Target Amount (Optional)</Text>
            <View style={styles.amountInputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="1000"
                value={eventData.targetAmount}
                onChangeText={(text) => setEventData({ ...eventData, targetAmount: text })}
                keyboardType="decimal-pad"
              />
            </View>
          </View>
        )}
      </View>
    )}

    {/* No Registry Info */}
    {eventData.registryType === 'none' && (
      <View style={styles.infoBox}>
        <Ionicons name="information-circle" size={24} color="#4ECDC4" />
        <Text style={styles.infoText}>
          No gift registry will be attached to this event. Guests can still RSVP and celebrate with you!
        </Text>
      </View>
    )}
  </ScrollView>
);


  const renderStep4 = () => (
    <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Invite Guests</Text>
      <Text style={styles.stepSubtitle}>Who would you like to invite?</Text>

      <FriendSelector
        selectedFriends={eventData.invitedUsers}
        onFriendsChange={(friends) => setEventData({ ...eventData, invitedUsers: friends })}
        maxSelections={50}
      />

      <View style={styles.infoBox}>
        <Ionicons name="gift-outline" size={20} color="#4ECDC4" />
        <Text style={styles.infoText}>
          You can also send invitations later or share the event link!
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep5 = () => {
    const hasLocation = eventData.location && 
      (eventData.location.address?.trim() || eventData.location.venueName?.trim());
    
    const locationText = hasLocation 
      ? [eventData.location.venueName, eventData.location.address].filter(v => v && v.trim()).join(', ')
      : null;
  
    const registryText = (() => {
      switch(eventData.registryType) {
        case 'stock': return `Stock Investment - $${eventData.targetAmount || 0}`;
        case 'amazon': return 'Amazon Registry';
        case 'cash_fund': return eventData.cashFund?.fundName || 'Cash Fund';
        case 'none': return 'No Registry';
        default: return 'No Registry';
      }
    })();
  
    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Review & Create</Text>
        <Text style={styles.stepSubtitle}>Everything look good?</Text>
        <View style={styles.summaryCard}>{[
          <View key="event" style={styles.summaryRow}>
            <Ionicons name="calendar" size={20} color="#4ECDC4" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Event</Text>
              <Text style={styles.summaryValue}>{eventData.eventTitle || 'Untitled Event'}</Text>
            </View>
          </View>,
          <View key="date" style={styles.summaryRow}>
            <Ionicons name="time" size={20} color="#FFD93D" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>{eventData.eventDate ? `${eventData.eventDate.toLocaleDateString()}${eventData.eventTime ? ` at ${eventData.eventTime}` : ''}` : 'Date not set'}</Text>
            </View>
          </View>,
          hasLocation && locationText ? (
            <View key="location" style={styles.summaryRow}>
              <Ionicons name="location" size={20} color="#FF6B6B" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Location</Text>
                <Text style={styles.summaryValue}>{locationText}</Text>
              </View>
            </View>
          ) : null,
          <View key="registry" style={styles.summaryRow}>
            <Ionicons name="gift" size={20} color="#A8E6CF" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Registry</Text>
              <Text style={styles.summaryValue}>{registryText}</Text>
            </View>
          </View>,
          <View key="guests" style={styles.summaryRow}>
            <Ionicons name="people" size={20} color="#8B7355" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Guests</Text>
              <Text style={styles.summaryValue}>{`${eventData.invitedUsers?.length || 0} ${(eventData.invitedUsers?.length || 0) === 1 ? 'friend' : 'friends'} invited`}</Text>
            </View>
          </View>
        ]}</View>
      </ScrollView>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#FFD93D', '#FFB84D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleBack}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Create Event</Text>
          <Text style={styles.headerSubtitle}>Step {currentStep} of 5</Text>
        </View>
      </LinearGradient>

      {/* Progress Bar */}
      {renderProgressBar()}

      {/* Content */}
      <View style={styles.content}>
        {renderCurrentStep()}
      </View>

      {/* Bottom Bar */}
      <View style={styles.bottomBar}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={styles.backBottomButton}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color="#666" />
            <Text style={styles.backBottomText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.nextButton,
            currentStep === 1 && styles.nextButtonFull,
            !isStepValid() && styles.nextButtonDisabled,
          ]}
          onPress={handleNext}
          disabled={!isStepValid() || isCreating}
        >
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.nextGradient}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.nextText}>
                  {currentStep === 5 ? 'Create Event' : 'Next'}
                </Text>
                <Ionicons 
                  name={currentStep === 5 ? "checkmark-circle" : "arrow-forward"} 
                  size={20} 
                  color="#fff" 
                />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
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
    marginTop: 2,
  },

  // Progress Bar
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#fff',
  },
  progressStepContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressStepActive: {
    backgroundColor: '#4ECDC4',
  },
  progressStepCurrent: {
    backgroundColor: '#4ECDC4',
    transform: [{ scale: 1.2 }],
  },
  progressStepText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#999',
  },
  progressStepTextActive: {
    color: '#fff',
  },
  progressLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 4,
  },
  progressLineActive: {
    backgroundColor: '#4ECDC4',
  },

  // Content
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },

  // Input Groups
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },

  // Date Button
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },

  // Amount Input
  amountInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4ECDC4',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
  },

  // Registry Options
  registryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  registryOption: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    padding: 16,
    alignItems: 'center',
  },
  registryOptionSelected: {
    borderColor: '#4ECDC4',
    backgroundColor: '#F0FFFE',
  },
  registryIconContainer: {
    marginBottom: 8,
  },
  registryOptionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
  },
  registryOptionLabelSelected: {
    color: '#4ECDC4',
  },
  registrySetup: {
    marginTop: 16,
  },

  // Summary
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  summaryRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  summaryContent: {
    flex: 1,
    marginLeft: 12,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#999',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    marginTop: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },

  // Bottom Bar
  bottomBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 12,
  },
  backBottomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  backBottomText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#666',
  },
  nextButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButtonDisabled: {
    opacity: 0.5,
  },
  nextGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  nextText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
  },
  goalToggleContainer: {
    marginBottom: 20,
  },
  goalToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4ECDC4',
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#4ECDC4',
  },
  goalToggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  goalToggleHint: {
    fontSize: 14,
    color: '#666',
    marginLeft: 36,
    fontStyle: 'italic',
  },
});