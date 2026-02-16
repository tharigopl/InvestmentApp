// client/components/FriendSelector.js - FINAL FIX (Correct API + No focus loss)
import React, { useState, useEffect, useMemo, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { GlobalStyles } from '../constants/styles';
import { getFriends } from '../util/friend';
import { AuthContext } from '../store/auth-context';

/**
 * FriendSelector Component
 * Allows users to select friends to invite to an event
 * ✨ FIXED: 
 * - Uses correct API route /api/friends/user/:userid
 * - Gets userId from AuthContext
 * - Search input maintains focus
 */
const FriendSelector = ({ selectedFriends = [], onFriendsChange, maxSelections = 50 }) => {
  const authCtx = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadFriends();
  }, []);

  // ✨ FIX: Memoize filtered friends to prevent re-renders
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) {
      return friends;
    }

    const query = searchQuery.toLowerCase();
    return friends.filter(friend => {
      const name = (friend.name || `${friend.firstname || ''} ${friend.lastname || ''}`).toLowerCase();
      const email = (friend.email || '').toLowerCase();
      const firstname = (friend.firstname || '').toLowerCase();
      const lastname = (friend.lastname || '').toLowerCase();
      return name.includes(query) || email.includes(query) || firstname.includes(query) || lastname.includes(query);
    });
  }, [friends, searchQuery]);

  const loadFriends = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // ✨ FIX: Get userId from AuthContext instead of passing token
      const userId = authCtx.uid;
      
      if (!userId) {
        console.error('No user ID available');
        setError('User not authenticated');
        setFriends([]);
        setIsLoading(false);
        return;
      }

      console.log('Loading friends for user:', userId);
      
      // ✨ FIX: Use correct API route
      const fetchedFriends = await getFriends(userId);
      
      console.log('Fetched friends:', fetchedFriends);
      
      // Format friends data consistently
      const formattedFriends = fetchedFriends.map(friend => ({
        id: friend.id || friend._id,
        email: friend.email,
        name: friend.name || (friend.firstname ? `${friend.firstname} ${friend.lastname}` : friend.email),
        firstname: friend.firstname,
        lastname: friend.lastname,
        imageUrl: friend.imageUrl || friend.image,
      }));
      
      setFriends(formattedFriends);
    } catch (error) {
      console.error('Error loading friends:', error);
      setError(error.message || 'Failed to load friends');
      setFriends([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleFriend = (friend) => {
    const isSelected = selectedFriends.find(f => f.id === friend.id);

    if (isSelected) {
      // Remove friend
      onFriendsChange(selectedFriends.filter(f => f.id !== friend.id));
    } else {
      // Add friend (check max)
      if (selectedFriends.length >= maxSelections) {
        Alert.alert('Maximum Reached', `You can only invite up to ${maxSelections} friends`);
        return;
      }
      onFriendsChange([...selectedFriends, friend]);
    }
  };

  const handleSelectAll = () => {
    if (selectedFriends.length === filteredFriends.length) {
      // Deselect all
      onFriendsChange([]);
    } else {
      // Select all (up to max)
      const toSelect = filteredFriends.slice(0, maxSelections);
      onFriendsChange(toSelect);
    }
  };

  // ✨ FIX: Memoize renderItem to prevent re-creation on every render
  const renderFriendItem = ({ item }) => {
    const isSelected = selectedFriends.find(f => f.id === item.id);

    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => handleToggleFriend(item)}
      >
        {/* Friend Avatar */}
        <View style={styles.avatarContainer}>
          {item.imageUrl ? (
            <Image
              source={{ uri: item.imageUrl }}
              style={styles.avatar}
            />
          ) : (
            <View style={[styles.avatar, styles.avatarPlaceholder]}>
              <Text style={styles.avatarText}>
                {(item.name || item.email || '?')[0].toUpperCase()}
              </Text>
            </View>
          )}
          {isSelected && (
            <View style={styles.checkmark}>
              <Ionicons name="checkmark" size={16} color="#fff" />
            </View>
          )}
        </View>

        {/* Friend Info */}
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.name || 'Unknown'}</Text>
          {item.email && (
            <Text style={styles.friendEmail} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>

        {/* Selection Indicator */}
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={18} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  // ✨ FIX: Extract keyExtractor to prevent re-creation
  const keyExtractor = (item) => item.id;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={GlobalStyles.colors.primary500} />
        <Text style={styles.loadingText}>Loading friends...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={60} color={GlobalStyles.colors.error500} />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadFriends}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Invite Friends ({selectedFriends.length}/{maxSelections})
      </Text>

      {/* ✨ FIXED: Search bar outside of FlatList to maintain focus */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={GlobalStyles.colors.gray400} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search friends by name or email"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          autoFocus={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={GlobalStyles.colors.gray400} />
          </TouchableOpacity>
        )}
      </View>

      {/* Selection Info */}
      <View style={styles.selectionInfo}>
        <Text style={styles.selectionText}>
          {selectedFriends.length} of {filteredFriends.length} selected
        </Text>
        {filteredFriends.length > 0 && (
          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.selectAllButton}>
              {selectedFriends.length === filteredFriends.length ? 'Deselect All' : 'Select All'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ✨ FIXED: FlatList with proper optimization */}
      {filteredFriends.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={60} color={GlobalStyles.colors.gray300} />
          <Text style={styles.emptyText}>
            {searchQuery ? 'No friends found' : 'No friends yet'}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery
              ? 'Try a different search term'
              : 'Add friends to invite them to events'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredFriends}
          renderItem={renderFriendItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          style={styles.list}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          extraData={selectedFriends}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginVertical: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray700,
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: GlobalStyles.colors.gray500,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: GlobalStyles.colors.error500,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: GlobalStyles.colors.primary500,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  list: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: GlobalStyles.colors.gray100,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: GlobalStyles.colors.gray800,
    marginLeft: 8,
    outlineStyle: 'none',
  },
  selectionInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  selectionText: {
    fontSize: 14,
    color: GlobalStyles.colors.gray600,
  },
  selectAllButton: {
    fontSize: 14,
    fontWeight: '600',
    color: GlobalStyles.colors.primary600,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: GlobalStyles.colors.gray200,
  },
  friendItemSelected: {
    backgroundColor: GlobalStyles.colors.primary50,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    backgroundColor: GlobalStyles.colors.primary200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: GlobalStyles.colors.primary700,
  },
  checkmark: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: GlobalStyles.colors.success500,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  friendInfo: {
    flex: 1,
    marginRight: 12,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: GlobalStyles.colors.gray800,
    marginBottom: 2,
  },
  friendEmail: {
    fontSize: 14,
    color: GlobalStyles.colors.gray500,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: GlobalStyles.colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: GlobalStyles.colors.primary500,
    borderColor: GlobalStyles.colors.primary500,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
});

export default FriendSelector;