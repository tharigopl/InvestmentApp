// client/screens/AddFriendScreen.js - COMPLETE Dual Tab System
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../constants/styles';
import { searchUsers, addUserFriend, addContact } from '../util/friend';
import useDebounce from '../hooks/useDebounce';

export default function AddFriendScreen({ navigation }) {
  const [mode, setMode] = useState('search'); // 'search' or 'manual'
  
  // Search mode state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  
  // Manual entry mode state
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  
  const debouncedSearch = useDebounce(searchQuery, 500);

  useEffect(() => {
    if (mode === 'search' && debouncedSearch.length >= 2) {
      handleSearch(debouncedSearch);
    } else {
      setSearchResults([]);
    }
  }, [debouncedSearch, mode]);

  const handleSearch = async (query) => {
    try {
      setIsSearching(true);
      const results = await searchUsers(query);
      setSearchResults(results);
    } catch (error) {
      Alert.alert('Error', 'Failed to search users. Please try again.');
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddUser = async (userId) => {
    try {
        console.log("Handle Add User");
      setAddingUserId(userId);
      await addUserFriend(userId);
      
      Alert.alert(
        'Success!',
        'Friend added successfully! You can now invite them to events.',
        [{ text: 'OK' }]
      );
      
      // Remove from search results
      setSearchResults(prev => prev.filter(u => (u.id || u._id) !== userId));
    } catch (error) {
      const errorMessage = error.message || 'Failed to add friend';
      
      if (errorMessage.includes('already friends')) {
        Alert.alert('Already Friends', 'You are already friends with this user.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setAddingUserId(null);
    }
  };

  const handleAddContact = async () => {
    // Validation
    console.log("Handle Add Contact");
    if (!email || !firstName || !lastName) {
      Alert.alert('Missing Information', 'Please fill in email, first name, and last name.');
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    
    try {
      setIsAdding(true);
      const result = await addContact({
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined
      });
      
      if (result.type === 'user') {
        // Email belongs to existing user
        Alert.alert(
          'User Found!',
          `This email belongs to ${result.friend.name}. They have been added as your friend!`,
          [
            {
              text: 'Great!',
              onPress: () => {
                // Clear form
                setEmail('');
                setFirstName('');
                setLastName('');
                setPhoneNumber('');
                
                // Optionally navigate back
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        // Contact created successfully
        Alert.alert(
          'Contact Added!',
          `${result.contact.displayName} has been added to your contacts. They can receive gift links via email without creating an account.`,
          [
            {
              text: 'Add Another',
              onPress: () => {
                // Clear form
                setEmail('');
                setFirstName('');
                setLastName('');
                setPhoneNumber('');
              }
            },
            {
              text: 'Done',
              onPress: () => navigation.goBack()
            }
          ]
        );
      }
    } catch (error) {
      const errorMessage = error.message || 'Failed to add contact';
      
      if (errorMessage.includes('already have a contact')) {
        Alert.alert('Contact Exists', 'You already have a contact with this email.');
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsAdding(false);
    }
  };

  const renderUserItem = ({ item }) => {
    const userId = item.id || item._id;
    const isAdding = addingUserId === userId;
    
    return (
      <View style={styles.userItem}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.profileImage ? (
            <Image 
              source={{ uri: item.profileImage }} 
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {item.fname?.[0]}{item.lname?.[0]}
              </Text>
            </View>
          )}
        </View>

        {/* User Info */}
        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.fname} {item.lname}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>

        {/* Add Button */}
        <TouchableOpacity
          style={[styles.addButton, isAdding && styles.addButtonDisabled]}
          onPress={() => handleAddUser(userId)}
          disabled={isAdding}
        >
          {isAdding ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Ionicons name="person-add" size={20} color="#fff" />
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'search' && styles.modeButtonActive]}
            onPress={() => setMode('search')}
          >
            <Ionicons 
              name="search" 
              size={20} 
              color={mode === 'search' ? '#fff' : GlobalStyles.colors.gray600} 
            />
            <Text style={[styles.modeText, mode === 'search' && styles.modeTextActive]}>
              Search Users
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.modeButton, mode === 'manual' && styles.modeButtonActive]}
            onPress={() => setMode('manual')}
          >
            <Ionicons 
              name="person-add" 
              size={20} 
              color={mode === 'manual' ? '#fff' : GlobalStyles.colors.gray600} 
            />
            <Text style={[styles.modeText, mode === 'manual' && styles.modeTextActive]}>
              Add Contact
            </Text>
          </TouchableOpacity>
        </View>

        {mode === 'search' ? (
          // ============================================
          // SEARCH MODE - Find Registered Users
          // ============================================
          <View style={styles.searchMode}>
            <View style={styles.infoBox}>
              <Ionicons name="people" size={24} color={GlobalStyles.colors.primary600} />
              <Text style={styles.infoText}>
                Search for people who already have accounts. They'll be added as friends instantly.
              </Text>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color={GlobalStyles.colors.gray400} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={GlobalStyles.colors.gray400} />
                </TouchableOpacity>
              )}
            </View>

            {/* Results */}
            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id || item._id}
                renderItem={renderUserItem}
                scrollEnabled={false}
              />
            ) : searchQuery.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={60} color={GlobalStyles.colors.gray300} />
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>
                  Try adding them as a contact instead
                </Text>
              </View>
            ) : searchQuery.length > 0 ? (
              <Text style={styles.hintText}>Type at least 2 characters to search</Text>
            ) : null}
          </View>
        ) : (
          // ============================================
          // MANUAL ENTRY MODE - Add External Contact
          // ============================================
          <View style={styles.manualMode}>
            <View style={styles.infoBox}>
              <Ionicons name="mail" size={24} color={GlobalStyles.colors.primary600} />
              <Text style={styles.infoText}>
                Add someone who doesn't have an account. They'll receive gift links via email and can contribute without signing up.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email Address *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="john@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>First Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="John"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Last Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Doe"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number (Optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="+1 (555) 123-4567"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={[styles.submitButton, isAdding && styles.submitButtonDisabled]}
                onPress={handleAddContact}
                disabled={isAdding}
              >
                {isAdding ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Ionicons name="add-circle" size={24} color="#fff" />
                    <Text style={styles.submitButtonText}>Add Contact</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  modeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: GlobalStyles.colors.gray100,
    gap: 8,
  },
  modeButtonActive: {
    backgroundColor: GlobalStyles.colors.primary500,
  },
  modeText: {
    fontSize: 15,
    fontWeight: '600',
    color: GlobalStyles.colors.gray600,
  },
  modeTextActive: {
    color: '#fff',
  },
  searchMode: {
    padding: 16,
  },
  manualMode: {
    padding: 16,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: GlobalStyles.colors.primary50,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: GlobalStyles.colors.gray700,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    marginLeft: 8,
    color: GlobalStyles.colors.gray800,
    outlineStyle: 'none',
  },
  hintText: {
    textAlign: 'center',
    color: GlobalStyles.colors.gray400,
    fontSize: 14,
    marginTop: 20,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: GlobalStyles.colors.gray200,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    backgroundColor: GlobalStyles.colors.primary200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary700,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray800,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
  },
  addButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: GlobalStyles.colors.gray400,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
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
    outlineStyle: 'none',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: GlobalStyles.colors.primary500,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 10,
  },
  submitButtonDisabled: {
    backgroundColor: GlobalStyles.colors.gray400,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
});