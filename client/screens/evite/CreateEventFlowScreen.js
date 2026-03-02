// client/screens/evite/CreateEventFlowScreen.js
import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
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
import { showAlert } from '../../util/platform-alert';
import LocationMap from '../../components/LocationMap';
import { getAllFriends} from '../../util/friend';

export default function CreateEventFlowScreen({ route, navigation }) {
  const { eventType, eventTypeLabel, design } = route.params;
  const userCtx = useContext(UserContext);

  // Current step (1-5)
  const [currentStep, setCurrentStep] = useState(1);

  const [inviteMode, setInviteMode] = useState('friends');
  const [friends, setFriends] = useState([]);
  const [loadingFriends, setLoadingFriends] = useState(false);

  const [manualGuest, setManualGuest] = useState({
    name: '',
    email: '',
    phone: '',
  });
    // Load friends when component mounts
    useEffect(() => {
        console.log("UseEffect CustomEventFlowScreen");
        loadFriends();
    }, []);
  
    const loadFriends = async () => {
  try {
    console.log('🔵 START: loadingFriends =', loadingFriends);
    setLoadingFriends(true);
    
    const response = await getAllFriends();
    
    const friendsData = response?.friends || response || [];
    
    setFriends(friendsData);
  } catch (error) {
    console.error('❌ Error:', error);
    setFriends([]);
  } finally {
    console.log('🔴 END: Setting loadingFriends = false');
    setLoadingFriends(false);
  }
};

  // Event data
  const [eventData, setEventData] = useState({
    eventType,
    eventTitle: '',
    eventDate: new Date(),
    eventTime: '',
    description: '',
    selectedFriends:[],
    
    //Privacy Controls
    isPublic: true,
    publicSettings: {
        allowGuestRSVP: true,
        allowGuestContributions: true,
        showGuestList: false,
        showContributors: true,
    },

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
        showAlert(
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
      showAlert('Error', error.response?.data?.message || 'Failed to create event');
    } finally {
      setIsCreating(false);
    }
  };

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

  const renderStep2 = () => {
    return (
      <View style={styles.stepContainer}>{[
        <Text key="title" style={styles.stepTitle}>Location & Details</Text>,
  
  
        // Location Section
        <View key="locationSection" style={styles.inputGroup}>
          <Text style={styles.label}>Event Location (Optional)</Text>
          
          {/* Venue Name */}
          <TextInput
            style={styles.input}
            placeholder="Venue name (e.g., Central Park)"
            value={eventData.location.venueName}
            onChangeText={(text) => setEventData({ 
              ...eventData, 
              location: { ...eventData.location, venueName: text }
            })}
          />
          
          {/* Address */}
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder="Street address"
            value={eventData.location.address}
            onChangeText={(text) => setEventData({ 
              ...eventData, 
              location: { ...eventData.location, address: text }
            })}
          />
          
          {/* City */}
          <TextInput
            style={[styles.input, { marginTop: 12 }]}
            placeholder="City"
            value={eventData.location.city}
            onChangeText={(text) => setEventData({ 
              ...eventData, 
              location: { ...eventData.location, city: text }
            })}
          />
          
          {/* State & Zip */}
          <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="State"
              value={eventData.location.state}
              onChangeText={(text) => setEventData({ 
                ...eventData, 
                location: { ...eventData.location, state: text }
              })}
            />
            <TextInput
              style={[styles.input, { flex: 1 }]}
              placeholder="ZIP"
              value={eventData.location.zip}
              onChangeText={(text) => setEventData({ 
                ...eventData, 
                location: { ...eventData.location, zip: text }
              })}
              keyboardType="numeric"
            />
          </View>
        </View>,
  
        // ✅ ADD LOCATION MAP PREVIEW HERE
        // Only show if address is entered
        eventData.location.address ? (
          <View key="locationPreview" style={styles.locationPreview}>
            <LocationMap location={eventData.location} />
          </View>
        ) : null,
  
        // Event Time
        <View key="time" style={styles.inputGroup}>
          <Text style={styles.label}>Event Time (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 6:00 PM"
            value={eventData.eventTime}
            onChangeText={(text) => setEventData({ ...eventData, eventTime: text })}
          />
        </View>,
  
        // RSVP Options
        <View key="rsvp" style={styles.inputGroup}>
          <Text style={styles.label}>RSVP Settings</Text>
          
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => setEventData({ 
              ...eventData, 
              allowPlusOnes: !eventData.allowPlusOnes 
            })}
          >
            <View style={[
              styles.checkbox,
              eventData.allowPlusOnes && styles.checkboxChecked
            ]}>
              {eventData.allowPlusOnes && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.toggleLabel}>Allow plus ones</Text>
          </TouchableOpacity>
  
          {eventData.allowPlusOnes && (
            <View style={styles.subInputGroup}>
              <Text style={styles.subLabel}>Max plus ones per guest</Text>
              <TextInput
                style={styles.input}
                placeholder="2"
                value={eventData.maxPlusOnes.toString()}
                onChangeText={(text) => setEventData({ 
                  ...eventData, 
                  maxPlusOnes: parseInt(text) || 0 
                })}
                keyboardType="numeric"
              />
            </View>
          )}
        </View>,
  
      ].filter(Boolean)}</View>
    );
  };

//   const renderStep2 = () => (
//     <KeyboardAvoidingView 
//       behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
//       style={styles.stepContainer}
//     >
//       <ScrollView showsVerticalScrollIndicator={false}>
//         <Text style={styles.stepTitle}>Location & Details</Text>
//         <Text style={styles.stepSubtitle}>Where will this event take place?</Text>

//         {/* Venue Name */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>Venue Name</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="e.g., Grand Ballroom"
//             value={eventData.location.venueName}
//             onChangeText={(text) => setEventData({
//               ...eventData,
//               location: { ...eventData.location, venueName: text }
//             })}
//           />
//         </View>

//         {/* Address */}
//         <View style={styles.inputGroup}>
//           <Text style={styles.label}>Address</Text>
//           <TextInput
//             style={styles.input}
//             placeholder="123 Main St"
//             value={eventData.location.address}
//             onChangeText={(text) => setEventData({
//               ...eventData,
//               location: { ...eventData.location, address: text }
//             })}
//           />
//         </View>

//         {/* City, State */}
//         <View style={styles.row}>
//           <View style={[styles.inputGroup, { flex: 2 }]}>
//             <Text style={styles.label}>City</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="San Francisco"
//               value={eventData.location.city}
//               onChangeText={(text) => setEventData({
//                 ...eventData,
//                 location: { ...eventData.location, city: text }
//               })}
//             />
//           </View>

//           <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
//             <Text style={styles.label}>State</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="CA"
//               value={eventData.location.state}
//               onChangeText={(text) => setEventData({
//                 ...eventData,
//                 location: { ...eventData.location, state: text }
//               })}
//             />
//           </View>

//           <View style={[styles.inputGroup, { flex: 1, marginLeft: 12 }]}>
//             <Text style={styles.label}>Zip</Text>
//             <TextInput
//               style={styles.input}
//               placeholder="123456"
//               value={eventData.location.zipCode}
//               onChangeText={(text) => setEventData({
//                 ...eventData,
//                 location: { ...eventData.location, state: text }
//               })}
//             />
//           </View>
//         </View>

//         <View style={styles.infoBox}>
//           <Ionicons name="information-circle" size={20} color="#4ECDC4" />
//           <Text style={styles.infoText}>
//             Location is optional but helps guests find your event!
//           </Text>
//         </View>
//       </ScrollView>
//     </KeyboardAvoidingView>
//   );

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


// const renderStep4 = () => (
//     <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
//       <Text style={styles.stepTitle}>Invite Guests</Text>
//       <Text style={styles.stepSubtitle}>Who would you like to invite?</Text>

//       <FriendSelector
//         selectedFriends={eventData.invitedUsers}
//         onFriendsChange={(friends) => setEventData({ ...eventData, invitedUsers: friends })}
//         maxSelections={50}
//       />

//       <View style={styles.infoBox}>
//         <Ionicons name="gift-outline" size={20} color="#4ECDC4" />
//         <Text style={styles.infoText}>
//           You can also send invitations later or share the event link!
//         </Text>
//       </View>
//     </ScrollView>
//   );

// const renderStep4 = () => {
//     return (
//       <View style={styles.stepContainer}>
//         <Text style={styles.stepTitle}>Invite Guests</Text>
  
//         {/* Tab Selector */}
//         <View style={styles.tabContainer}>
//           <TouchableOpacity
//             style={[styles.tab, inviteMode === 'friends' && styles.tabActive]}
//             onPress={() => setInviteMode('friends')}
//           >
//             <Text style={[styles.tabText, inviteMode === 'friends' && styles.tabTextActive]}>
//               From Friends
//             </Text>
//           </TouchableOpacity>
          
//           <TouchableOpacity
//             style={[styles.tab, inviteMode === 'manual' && styles.tabActive]}
//             onPress={() => setInviteMode('manual')}
//           >
//             <Text style={[styles.tabText, inviteMode === 'manual' && styles.tabTextActive]}>
//               Add Manually
//             </Text>
//           </TouchableOpacity>
//         </View>
  
//         {/* Content */}
//         {console.log(" Loading Friends", loadingFriends)}
//         {console.log(" friends", friends)}
//         {inviteMode === 'friends' ? (
//           // Friends mode
//           loadingFriends ? (
//             <View style={styles.loadingContainer}>
//               <ActivityIndicator size="large" color="#FF6B6B" />
//               <Text style={styles.loadingText}>Loading friends...</Text>
//             </View>
//           ) : friends && friends.length > 0 ? (
//                   <FriendSelector
//                     selectedFriends={eventData.guestList}
//                     onFriendsChange={(friends) => setEventData({ ...eventData, guestList: friends })}
//                     maxSelections={50}
//                   />      
//           ) : (
//             <View style={styles.emptyContainer}>
//               <Ionicons name="people-outline" size={64} color="#E5E5E5" />
//               <Text style={styles.emptyTitle}>No Friends Yet</Text>
//               <Text style={styles.emptyText}>
//                 Add friends first or use manual entry below
//               </Text>
//               <TouchableOpacity
//                 style={styles.switchModeButton}
//                 onPress={() => setInviteMode('manual')}
//               >
//                 <Text style={styles.switchModeText}>Switch to Manual Entry</Text>
//               </TouchableOpacity>
//             </View>
//           )          
//         ) : (
//           // Manual mode - your existing manual entry form
//           renderManualGuestEntry()
//         )}
//       </View>
//     );
//   };

const renderStep4 = () => {

    // Combine selected friends + manual guests for display
    const allSelectedGuests = [
      ...(eventData.selectedFriends || []).map(friend => ({
        _id: friend._id,
        name: `${friend.fname} ${friend.lname}`,
        email: friend.email,
        source: 'friend',
        originalData: friend,
      })),
      ...(eventData.guestList || []).map((guest, index) => ({
        _id: `manual-${index}`,
        name: guest.name,
        email: guest.email,
        phone: guest.phone,
        source: 'manual',
        index,
      })),
    ];
  
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Invite Guests</Text>
  
        {/* Tab Selector */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, inviteMode === 'friends' && styles.tabActive]}
            onPress={() => setInviteMode('friends')}
          >
            <Text style={[styles.tabText, inviteMode === 'friends' && styles.tabTextActive]}>
              From Friends
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, inviteMode === 'manual' && styles.tabActive]}
            onPress={() => setInviteMode('manual')}
          >
            <Text style={[styles.tabText, inviteMode === 'manual' && styles.tabTextActive]}>
              Add Manually
            </Text>
          </TouchableOpacity>
        </View>
  
        {/* Content */}
        {inviteMode === 'friends' ? (
          // Friends mode
          loadingFriends ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FF6B6B" />
              <Text style={styles.loadingText}>Loading friends...</Text>
            </View>
          ) : friends && friends.length > 0 ? (
            <View style={styles.friendsContentContainer}>
              {/* FriendSelector - Takes available space */}
              <View style={styles.friendSelectorWrapper}>
                <FriendSelector
                  friends={friends}
                  selectedFriends={eventData.selectedFriends || []}
                  onSelectionChange={(selected) => {
                    setEventData({ ...eventData, selectedFriends: selected });
                  }}
                />
              </View>
              
              {/* ✅ Guest Preview - Fixed height, scrollable */}
              {allSelectedGuests.length > 0 && (
                <View style={styles.guestPreviewContainer}>
                  <View style={styles.guestPreviewHeader}>
                    <Text style={styles.allGuestsTitle}>
                      All Invited Guests ({allSelectedGuests.length})
                    </Text>
                    <Text style={styles.allGuestsSubtitle}>
                      {eventData.selectedFriends?.length || 0} from friends • {' '}
                      {eventData.guestList?.length || 0} added manually
                    </Text>
                  </View>
                  
                  <ScrollView 
                    style={styles.guestPreviewScroll}
                    showsVerticalScrollIndicator={true}
                    nestedScrollEnabled={true}
                  >
                    {allSelectedGuests.map((guest) => (
                      <View key={guest._id} style={styles.guestPreviewCard}>
                        <View style={styles.guestPreviewInfo}>
                          <Text style={styles.guestPreviewName}>{guest.name}</Text>
                          <Text style={styles.guestPreviewContact}>
                            {guest.email || guest.phone}
                          </Text>
                          <Text style={styles.guestPreviewSource}>
                            {guest.source === 'friend' ? '👥 From Friends' : '✏️ Added Manually'}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => {
                            if (guest.source === 'friend') {
                              setEventData({
                                ...eventData,
                                selectedFriends: eventData.selectedFriends.filter(f => f._id !== guest._id)
                              });
                            } else {
                              setEventData({
                                ...eventData,
                                guestList: eventData.guestList.filter((_, i) => i !== guest.index)
                              });
                            }
                          }}
                        >
                          <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#E5E5E5" />
              <Text style={styles.emptyTitle}>No Friends Yet</Text>
              <Text style={styles.emptyText}>
                Add friends first or use manual entry
              </Text>
              <TouchableOpacity
                style={styles.switchModeButton}
                onPress={() => setInviteMode('manual')}
              >
                <Text style={styles.switchModeText}>Switch to Manual Entry</Text>
              </TouchableOpacity>
            </View>
          )
        ) : (
          // Manual mode
          renderManualGuestEntry()
        )}
      </View>
    );
  };

  const renderManualGuestEntry = () => {
    
    const handleAddManualGuest = () => {
      if (!manualGuest.name.trim()) {
        showAlert('Required', 'Please enter guest name');
        return;
      }
  
      if (!manualGuest.email.trim() && !manualGuest.phone.trim()) {
        showAlert('Required', 'Please enter email or phone');
        return;
      }
  
      // Add to guest list
      setEventData({
        ...eventData,
        guestList: [
          ...(eventData.guestList || []),
          {
            ...manualGuest,
            rsvpStatus: 'pending',
          }
        ]
      });
  
      // Clear form
      setManualGuest({ name: '', email: '', phone: '' });
    };
  
    return (
      <View style={styles.manualContainer}>
        {/* Guest Entry Form */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Guest Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="John Doe"
            value={manualGuest.name}
            onChangeText={(text) => setManualGuest({ ...manualGuest, name: text })}
          />
        </View>
  
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="john@example.com"
            value={manualGuest.email}
            onChangeText={(text) => setManualGuest({ ...manualGuest, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
  
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 123-4567"
            value={manualGuest.phone}
            onChangeText={(text) => setManualGuest({ ...manualGuest, phone: text })}
            keyboardType="phone-pad"
          />
        </View>
  
        <TouchableOpacity style={styles.addGuestButton} onPress={handleAddManualGuest}>
          <LinearGradient
            colors={['#4ECDC4', '#44A08D']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addGuestGradient}
          >
            <Ionicons name="person-add" size={20} color="#fff" />
            <Text style={styles.addGuestText}>Add Guest</Text>
          </LinearGradient>
        </TouchableOpacity>
  
        {/* Guest List Preview */}
        {eventData.guestList && eventData.guestList.length > 0 && (
        <View style={styles.guestPreviewContainer}>
            <View style={styles.guestPreviewHeader}>
            <Text style={styles.guestListTitle}>
                Added Guests ({eventData.guestList.length})
            </Text>
            </View>
            
            <ScrollView 
            style={styles.guestPreviewScroll}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
            >
            {eventData.guestList.map((guest, index) => (
                <View key={index} style={styles.guestPreviewCard}>
                <View style={styles.guestPreviewInfo}>
                    <Text style={styles.guestPreviewName}>{guest.name}</Text>
                    <Text style={styles.guestPreviewContact}>
                    {guest.email || guest.phone}
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={() => {
                    setEventData({
                        ...eventData,
                        guestList: eventData.guestList.filter((_, i) => i !== index)
                    });
                    }}
                >
                    <Ionicons name="close-circle" size={24} color="#FF6B6B" />
                </TouchableOpacity>
                </View>
            ))}
            </ScrollView>
        </View>
        )}
      </View>
    );
  };

  const renderGuestListPreview = () => {
    if (!eventData.guestList || eventData.guestList.length === 0) {
      return null;
    }
  
    return (
      <View style={styles.guestListPreview}>
        <Text style={styles.guestListTitle}>
          Added Guests ({eventData.guestList.length})
        </Text>
  
        {eventData.guestList.map((guest, index) => (
          <View key={index} style={styles.guestPreviewCard}>
            <View style={styles.guestPreviewInfo}>
              <Text style={styles.guestPreviewName}>{guest.name}</Text>
              <Text style={styles.guestPreviewContact}>
                {guest.email || guest.phone}
              </Text>
            </View>
  
            <TouchableOpacity
              onPress={() => {
                setEventData({
                  ...eventData,
                  guestList: eventData.guestList.filter((_, i) => i !== index)
                });
              }}
            >
              <Ionicons name="close-circle" size={24} color="#FF6B6B" />
            </TouchableOpacity>
          </View>
        ))}
      </View>
    );
  };

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
  
    // ✅ Calculate total guests
    const friendsFromList = eventData.selectedFriends?.length || 0;
    const manualGuests = eventData.guestList?.length || 0;
    const totalGuests = friendsFromList + manualGuests;

    return (
      <ScrollView style={styles.stepContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Review & Create</Text>
        <Text style={styles.stepSubtitle}>Everything look good?</Text>
        {/* Privacy Settings */}
        <View style={styles.privacySection}>
            <Text style={styles.sectionTitle}>Privacy Settings</Text>
            
            <TouchableOpacity
                style={styles.privacyToggle}
                onPress={() => setEventData({ 
                ...eventData, 
                isPublic: !eventData.isPublic 
                })}
            >
                <View style={[styles.checkbox, eventData.isPublic && styles.checkboxChecked]}>
                {eventData.isPublic && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <View style={styles.toggleInfo}>
                <Text style={styles.toggleLabel}>Make event public</Text>
                <Text style={styles.toggleHint}>Anyone with link can view and RSVP</Text>
                </View>
            </TouchableOpacity>

            {eventData.isPublic && (
                <>
                <TouchableOpacity
                    style={styles.privacyToggle}
                    onPress={() => setEventData({ 
                    ...eventData, 
                    publicSettings: {
                        ...eventData.publicSettings,
                        allowGuestRSVP: !eventData.publicSettings?.allowGuestRSVP
                    }
                    })}
                >
                    <View style={[
                    styles.checkbox, 
                    eventData.publicSettings?.allowGuestRSVP && styles.checkboxChecked
                    ]}>
                    {eventData.publicSettings?.allowGuestRSVP && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                    </View>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.toggleLabel}>Allow guest RSVP</Text>
                    </View>
                </TouchableOpacity>

                <TouchableOpacity
                    style={styles.privacyToggle}
                    onPress={() => setEventData({ 
                    ...eventData, 
                    publicSettings: {
                        ...eventData.publicSettings,
                        allowGuestContributions: !eventData.publicSettings?.allowGuestContributions
                    }
                    })}
                >
                    <View style={[
                    styles.checkbox, 
                    eventData.publicSettings?.allowGuestContributions && styles.checkboxChecked
                    ]}>
                    {eventData.publicSettings?.allowGuestContributions && (
                        <Ionicons name="checkmark" size={16} color="#fff" />
                    )}
                    </View>
                    <View style={styles.toggleInfo}>
                        <Text style={styles.toggleLabel}>Allow guest contributions</Text>
                    </View>
                </TouchableOpacity>
                </>
            )}
        </View>
        
        <View style={styles.summaryCard}>
          <View key="event" style={styles.summaryRow}>
            <Ionicons name="calendar" size={20} color="#4ECDC4" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Event</Text>
              <Text style={styles.summaryValue}>{eventData.eventTitle || 'Untitled Event'}</Text>
            </View>
          </View>
          
          <View key="date" style={styles.summaryRow}>
            <Ionicons name="time" size={20} color="#FFD93D" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Date & Time</Text>
              <Text style={styles.summaryValue}>
                {eventData.eventDate 
                  ? `${eventData.eventDate.toLocaleDateString()}${eventData.eventTime ? ` at ${eventData.eventTime}` : ''}` 
                  : 'Date not set'}
              </Text>
            </View>
          </View>
          
          {hasLocation && locationText && (
            <View key="location" style={styles.summaryRow}>
              <Ionicons name="location" size={20} color="#FF6B6B" />
              <View style={styles.summaryContent}>
                <Text style={styles.summaryLabel}>Location</Text>
                <Text style={styles.summaryValue}>{locationText}</Text>
              </View>
            </View>
          )}
          
          <View key="registry" style={styles.summaryRow}>
            <Ionicons name="gift" size={20} color="#A8E6CF" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Registry</Text>
              <Text style={styles.summaryValue}>{registryText}</Text>
            </View>
          </View>
          
          <View key="guests" style={styles.summaryRow}>
            <Ionicons name="people" size={20} color="#8B7355" />
            <View style={styles.summaryContent}>
              <Text style={styles.summaryLabel}>Guests</Text>
              <Text style={styles.summaryValue}>
                {totalGuests === 0 
                  ? 'No guests invited yet'
                  : `${totalGuests} ${totalGuests === 1 ? 'guest' : 'guests'} invited`}
              </Text>
              {totalGuests > 0 && (
                <Text style={styles.summarySubtext}>
                  {friendsFromList > 0 && `${friendsFromList} from friends`}
                  {friendsFromList > 0 && manualGuests > 0 && ' • '}
                  {manualGuests > 0 && `${manualGuests} added manually`}
                </Text>
              )}
            </View>
          </View>
        </View>
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
    locationPreview: {
      marginTop: -12,  // Reduce gap with location inputs
      marginBottom: 12,
    },
    privacySection: {
      backgroundColor: '#fff',
      padding: 20,
      borderRadius: 16,
      marginBottom: 20,
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: '#333',
      marginBottom: 16,
    },
    privacyToggle: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 16,
    },
    toggleInfo: {
      flex: 1,
      marginLeft: 12,
    },
    toggleLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: '#333',
      marginBottom: 4,
    },
    toggleHint: {
      fontSize: 13,
      color: '#999',
      lineHeight: 18,
    },
    guestSettings: {
      marginLeft: 36,
      marginTop: 8,
      paddingTop: 16,
      borderTopWidth: 1,
      borderTopColor: '#F5F5F5',
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
    tabContainer: {
      flexDirection: 'row',
      backgroundColor: '#F5F5F5',
      borderRadius: 12,
      padding: 4,
      marginBottom: 20,
    },
    tab: {
      flex: 1,
      paddingVertical: 12,
      alignItems: 'center',
      borderRadius: 8,
    },
    tabActive: {
      backgroundColor: '#fff',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
    tabText: {
      fontSize: 15,
      fontWeight: '600',
      color: '#999',
    },
    tabTextActive: {
      color: '#333',
      fontWeight: '700',
    },
  
    // Loading state
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
    },
    loadingText: {
      marginTop: 16,
      fontSize: 16,
      color: '#666',
    },
  
    // Empty state
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 64,
      paddingHorizontal: 32,
    },
    emptyTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: '#333',
      marginTop: 20,
      marginBottom: 8,
    },
    emptyText: {
      fontSize: 14,
      color: '#999',
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 20,
    },
    switchModeButton: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      backgroundColor: '#fff',
      borderRadius: 20,
      borderWidth: 2,
      borderColor: '#4ECDC4',
    },
    switchModeText: {
      fontSize: 15,
      fontWeight: '700',
      color: '#4ECDC4',
    },
  
    // Manual entry
    manualContainer: {
      flex: 1,
    },
    addGuestButton: {
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 8,
    },
    addGuestGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
      gap: 8,
    },
    addGuestText: {
      fontSize: 16,
      fontWeight: '700',
      color: '#fff',
    },
    guestListPreview: {
      marginTop: 24,
    },
    friendsSelectorContainer: {
      flex: 1,
    },
    allGuestsPreview: {
      marginTop: 24,
      paddingTop: 20,
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
    },
    // Friends Tab Layout
    friendsContentContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    friendSelectorWrapper: {
      flex: 1,  // Takes available space
      minHeight: 200,  // Ensures friend selector is visible
    },
    
    // Guest Preview Container
    guestPreviewContainer: {
      maxHeight: 300,  // ✅ Fixed max height
      backgroundColor: '#fff',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: '#E5E5E5',
      marginTop: 16,
      overflow: 'hidden',
    },
    guestPreviewHeader: {
      padding: 16,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
      backgroundColor: '#F5F5F5',
    },
    guestPreviewScroll: {
      maxHeight: 240,  // ✅ Scrollable area
    },  
    allGuestsTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#333',
      marginBottom: 4,
    },
    allGuestsSubtitle: {
      fontSize: 12,
      fontWeight: '600',
      color: '#666',
    },
    
    guestPreviewCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: '#fff',
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#F5F5F5',
    },
    guestPreviewInfo: {
      flex: 1,
    },
    guestPreviewName: {
      fontSize: 15,
      fontWeight: '600',
      color: '#333',
      marginBottom: 2,
    },
    guestPreviewContact: {
      fontSize: 13,
      color: '#666',
      marginBottom: 2,
    },
    guestPreviewSource: {
      fontSize: 11,
      fontWeight: '600',
      color: '#999',
    },
    
    guestListTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#333',
    },
    summarySubtext: {
      fontSize: 12,
      color: '#999',
      marginTop: 4,
      fontWeight: '500',
    },
  });