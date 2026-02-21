// client/screens/ProfileScreen.js - FIXED API URL ISSUE
import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../store/auth-context';
import { UserContext } from '../store/user-context';
import { StripeContext } from '../store/stripe-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from '../config/api';

export default function ProfileScreen({ navigation }) {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [stats, setStats] = useState({
    eventsCreated: 0,
    eventsContributed: 0,
    totalContributed: 0,
    totalRaised: 0,
    friendsCount: 0,
  });

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('uid');
      
      if (!token || !userId) {
        setIsLoading(false);
        return;
      }

      // TODO: Fetch user stats from API
      // Example:
      // const response = await fetch(`${API_URL}/api/users/${userId}/stats`, {
      //   headers: { Authorization: `Bearer ${token}` }
      // });
      // const data = await response.json();
      // setStats(data);
      
      // For now, using mock data
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setStats({
        eventsCreated: 5,
        eventsContributed: 12,
        totalContributed: 450.00,
        totalRaised: 2340.00,
        friendsCount: 23,
      });
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUserData();
  };

  const handleImagePicker = async () => {
    try {
      // Request permissions
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please grant camera roll permissions to upload a profile picture.'
          );
          return;
        }
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        await uploadProfilePicture(imageUri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadProfilePicture = async (imageUri) => {
    setIsUploadingImage(true);
    
    try {
      const token = await AsyncStorage.getItem('token');
      const userId = await AsyncStorage.getItem('uid');
      
      if (!token || !userId) {
        throw new Error('Not authenticated');
      }

      // Create form data
      const formData = new FormData();
      
      // Handle file upload based on platform
      if (Platform.OS === 'web') {
        // Web: Convert to blob
        const response = await fetch(imageUri);
        const blob = await response.blob();
        formData.append('profileImage', blob, 'profile.jpg');
      } else {
        // Mobile: Use file URI
        const filename = imageUri.split('/').pop();
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('profileImage', {
          uri: imageUri,
          name: filename,
          type: type,
        });
      }

      // Upload to API
      const uploadUrl = `${API_URL}/api/users/${userId}/profile-picture`;
      
      console.log('📤 Uploading to:', uploadUrl);
      
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type header - let the browser/fetch set it with boundary
        },
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorData = await uploadResponse.json().catch(() => ({}));
        throw new Error(errorData.message || 'Upload failed');
      }

      const data = await uploadResponse.json();
      
      // Update user context with new image URL
      // Build full URL if needed
      const imageUrl = data.profileImageUrl.startsWith('http') 
        ? data.profileImageUrl 
        : `${API_URL}${data.profileImageUrl}`;
      
      if (userCtx?.userAccount) {
        userCtx.setuseraccount({
          ...userCtx.userAccount,
          profileImage: imageUrl,
        });
      }

      Alert.alert('Success! 🎉', 'Profile picture updated successfully');
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload profile picture. Please try again.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            authCtx.logout();
            userCtx.removeuseraccount();
            stripeCtx.removestripeaccount();
          },
        },
      ]
    );
  };

  const handleEditProfile = () => {
    navigation.navigate('ManageUser');
  };

  const handleViewFriends = () => {
    navigation.navigate('AllFriends');
  };

  const handleViewEvents = () => {
    // Navigate to the EventFeed screen
    navigation.navigate('Drawer', {
      screen: 'InvestmentEvents',
      params: {
        screen: 'EventFeedTab',
      },
    });
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF6B6B" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  const userInitial = userCtx?.userAccount?.fname?.[0]?.toUpperCase() || '?';
  const userName = userCtx?.userAccount?.fname 
    ? `${userCtx.userAccount.fname} ${userCtx.userAccount.lname || ''}`.trim()
    : 'User';
  const userEmail = userCtx?.userAccount?.email || 'email@example.com';
  const profileImage = userCtx?.userAccount?.profileImage;

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          tintColor="#FF6B6B"
          colors={['#FF6B6B']}
        />
      }
    >
      {/* Profile Header with Gradient */}
      <LinearGradient
        colors={['#FF6B6B', '#FF8E53']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <View style={styles.profileImageContainer}>
          {profileImage ? (
            <Image 
              source={{ uri: profileImage }} 
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileInitial}>{userInitial}</Text>
            </View>
          )}
          
          {/* Camera Button for Upload */}
          <TouchableOpacity 
            style={styles.cameraButton}
            onPress={handleImagePicker}
            disabled={isUploadingImage}
          >
            {isUploadingImage ? (
              <ActivityIndicator size="small" color="#FF6B6B" />
            ) : (
              <Ionicons name="camera" size={18} color="#FF6B6B" />
            )}
          </TouchableOpacity>
        </View>
        
        <Text style={styles.userName}>{userName}</Text>
        <Text style={styles.userEmail}>{userEmail}</Text>
        
        <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
          <View style={styles.editButtonContent}>
            <Ionicons name="create-outline" size={18} color="#FF6B6B" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </View>
        </TouchableOpacity>
      </LinearGradient>

      {/* Stats Grid */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="gift" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.statValue}>{stats.eventsCreated}</Text>
            <Text style={styles.statLabel}>Events Created</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="heart" size={24} color="#4ECDC4" />
            </View>
            <Text style={styles.statValue}>{stats.eventsContributed}</Text>
            <Text style={styles.statLabel}>Contributed To</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="wallet" size={24} color="#FFD93D" />
            </View>
            <Text style={styles.statValue}>${stats.totalContributed.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Contributed</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="trending-up" size={24} color="#A8E6CF" />
            </View>
            <Text style={styles.statValue}>${stats.totalRaised.toFixed(0)}</Text>
            <Text style={styles.statLabel}>Total Raised</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleViewEvents}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="gift-outline" size={28} color="#FF6B6B" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>My Investment Events</Text>
            <Text style={styles.actionSubtitle}>
              View and manage your events
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleViewFriends}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="people-outline" size={28} color="#4ECDC4" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Friends & Contacts</Text>
            <Text style={styles.actionSubtitle}>
              {stats.friendsCount} connections
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('AllParties')}
        >
          <View style={styles.actionIconContainer}>
            <Ionicons name="stats-chart-outline" size={28} color="#FFD93D" />
          </View>
          <View style={styles.actionContent}>
            <Text style={styles.actionTitle}>Portfolio Summary</Text>
            <Text style={styles.actionSubtitle}>
              View your investment portfolio
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#CCC" />
        </TouchableOpacity>
      </View>

      {/* Settings Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity 
          style={styles.settingCard}
          onPress={handleEditProfile}
        >
          <Ionicons name="person-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Account Settings</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => navigation.navigate('LinkStripeScreen')}
        >
          <Ionicons name="card-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Payment Methods</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => Alert.alert('Notifications', 'Notification settings coming soon!')}
        >
          <Ionicons name="notifications-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Notifications</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => Alert.alert('Privacy', 'Privacy settings coming soon!')}
        >
          <Ionicons name="shield-checkmark-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.settingCard}
          onPress={() => Alert.alert('Help', 'Help center coming soon!')}
        >
          <Ionicons name="help-circle-outline" size={24} color="#666" />
          <Text style={styles.settingText}>Help & Support</Text>
          <Ionicons name="chevron-forward" size={20} color="#CCC" />
        </TouchableOpacity>
      </View>

      {/* Logout Button */}
      <TouchableOpacity 
        style={styles.logoutButtonContainer}
        onPress={handleLogout}
      >
        <LinearGradient
          colors={['#FF6B6B', '#FF8E53']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.logoutButtonGradient}
        >
          <Ionicons name="log-out" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* App Version & API Info */}
      <Text style={styles.versionText}>Version 1.0.0</Text>
      {__DEV__ && (
        <Text style={styles.apiText}>API: {API_URL}</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF9F0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF9F0',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  header: {
    paddingTop: 40,
    paddingBottom: 30,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  profileImageContainer: {
    marginBottom: 16,
    position: 'relative',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitial: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B6B',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  userName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 6,
  },
  userEmail: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 20,
  },
  editButton: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  editButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  statsContainer: {
    padding: 16,
    paddingTop: 20,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontWeight: '600',
  },
  section: {
    padding: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#333',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFF9F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  settingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  settingText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
  },
  logoutButtonContainer: {
    margin: 16,
    marginTop: 24,
    marginBottom: 8,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logoutButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
  },
  versionText: {
    textAlign: 'center',
    fontSize: 12,
    color: '#999',
    marginBottom: 8,
  },
  apiText: {
    textAlign: 'center',
    fontSize: 10,
    color: '#CCC',
    marginBottom: 32,
  },
});