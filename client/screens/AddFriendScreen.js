// client/screens/AddFriendScreen.js - UPDATED WITH NEW THEME
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
import { LinearGradient } from 'expo-linear-gradient';
import { searchUsers, addUserFriend, addContact } from '../util/friend';
import useDebounce from '../hooks/useDebounce';

export default function AddFriendScreen({ navigation }) {
  const [mode, setMode] = useState('search');
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState(null);
  
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
        'Success! 🎉',
        'Friend added successfully! You can now invite them to events.',
        [{ text: 'OK' }]
      );
      
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
    console.log("Handle Add Contact");
    if (!email || !firstName || !lastName) {
      Alert.alert('Missing Information', 'Please fill in email, first name, and last name.');
      return;
    }
    
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
        Alert.alert(
          'User Found! 🎉',
          `This email belongs to ${result.friend.name}. They have been added as your friend!`,
          [
            {
              text: 'Great!',
              onPress: () => {
                setEmail('');
                setFirstName('');
                setLastName('');
                setPhoneNumber('');
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Contact Added! 📧',
          `${result.contact.displayName} has been added to your contacts. They can receive gift links via email without creating an account.`,
          [
            {
              text: 'Add Another',
              onPress: () => {
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

        <View style={styles.userInfo}>
          <Text style={styles.userName}>
            {item.fname} {item.lname}
          </Text>
          <Text style={styles.userEmail}>{item.email}</Text>
        </View>

        <TouchableOpacity
          style={styles.addButtonContainer}
          onPress={() => handleAddUser(userId)}
          disabled={isAdding}
        >
          <LinearGradient
            colors={isAdding ? ['#CCC', '#AAA'] : ['#FF6B6B', '#FF8E53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.addButtonGradient}
          >
            {isAdding ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Ionicons name="person-add" size={20} color="#fff" />
            )}
          </LinearGradient>
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
        {/* Mode Selector with Gradients */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={styles.modeButtonContainer}
            onPress={() => setMode('search')}
            activeOpacity={0.8}
          >
            {mode === 'search' ? (
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modeButtonGradient}
              >
                <Ionicons name="search" size={20} color="#fff" />
                <Text style={styles.modeTextActive}>Search Users</Text>
              </LinearGradient>
            ) : (
              <View style={styles.modeButtonInactive}>
                <Ionicons name="search" size={20} color="#666" />
                <Text style={styles.modeText}>Search Users</Text>
              </View>
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.modeButtonContainer}
            onPress={() => setMode('manual')}
            activeOpacity={0.8}
          >
            {mode === 'manual' ? (
              <LinearGradient
                colors={['#FF6B6B', '#FF8E53']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.modeButtonGradient}
              >
                <Ionicons name="person-add" size={20} color="#fff" />
                <Text style={styles.modeTextActive}>Add Contact</Text>
              </LinearGradient>
            ) : (
              <View style={styles.modeButtonInactive}>
                <Ionicons name="person-add" size={20} color="#666" />
                <Text style={styles.modeText}>Add Contact</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {mode === 'search' ? (
          <View style={styles.searchMode}>
            <View style={styles.infoBox}>
              <Ionicons name="people" size={24} color="#4ECDC4" />
              <Text style={styles.infoText}>
                Search for people who already have accounts. They'll be added as friends instantly.
              </Text>
            </View>
            
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#999" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or email..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color="#999" />
                </TouchableOpacity>
              )}
            </View>

            {isSearching ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B6B" />
                <Text style={styles.loadingText}>Searching...</Text>
              </View>
            ) : searchResults.length > 0 ? (
              <FlatList
                data={searchResults}
                renderItem={renderUserItem}
                keyExtractor={(item) => (item.id || item._id).toString()}
                scrollEnabled={false}
              />
            ) : searchQuery.length >= 2 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyEmoji}>🔍</Text>
                <Text style={styles.emptyText}>No users found</Text>
                <Text style={styles.emptySubtext}>
                  Try searching with a different name or email
                </Text>
              </View>
            ) : (
              <Text style={styles.hintText}>
                Type at least 2 characters to search
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.manualMode}>
            <View style={styles.infoBox}>
              <Ionicons name="mail" size={24} color="#FFD93D" />
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
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
                  placeholderTextColor="#999"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
              </View>

              <TouchableOpacity
                style={styles.submitButtonContainer}
                onPress={handleAddContact}
                disabled={isAdding}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isAdding ? ['#CCC', '#AAA'] : ['#FF6B6B', '#FF8E53']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.submitButtonGradient}
                >
                  {isAdding ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Ionicons name="add-circle" size={24} color="#fff" />
                      <Text style={styles.submitButtonText}>Add Contact</Text>
                    </>
                  )}
                </LinearGradient>
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
    backgroundColor: '#FFF9F0',
  },
  modeSelector: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    backgroundColor: '#FFF9F0',
  },
  modeButtonContainer: {
    flex: 1,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modeButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  modeButtonInactive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    gap: 8,
  },
  modeText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#666',
  },
  modeTextActive: {
    fontSize: 15,
    fontWeight: '800',
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
    backgroundColor: '#E8FFF8',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    gap: 12,
    borderWidth: 2,
    borderColor: '#C4F5E8',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#0D7C66',
    lineHeight: 20,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    outlineStyle: 'none',
  },
  hintText: {
    textAlign: 'center',
    color: '#999',
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
    color: '#666',
    fontWeight: '500',
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
    backgroundColor: '#FFE5E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FF6B6B',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  addButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
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
    fontWeight: '700',
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#333',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    fontWeight: '500',
    outlineStyle: 'none',
  },
  submitButtonContainer: {
    borderRadius: 14,
    overflow: 'hidden',
    marginTop: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
});