// client/screens/ProfileScreen.js - USING APICLIENT & USER UTILS
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../store/auth-context';
import { UserContext } from '../store/user-context';
import { StripeContext } from '../store/stripe-context';
import { getUserProfileData, updateProfilePicture } from '../util/user';
import { API_URL } from '../config/api';

export default function ProfileScreen({ navigation }) {
  const authCtx = useContext(AuthContext);
  const userCtx = useContext(UserContext);
  const stripeCtx = useContext(StripeContext);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
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

  useEffect(() => {
    if (userCtx?.useraccount?.profileImage) {
      console.log('📸 Setting profile image from context:', userCtx.useraccount.profileImage);
      setProfileImageUrl(userCtx.useraccount.profileImage);
    }
  }, [userCtx?.useraccount?.profileImage]);

  /**
   * Load user profile data using utility functions
   */
  const loadUserData = async () => {
    try {
      const userId = await AsyncStorage.getItem('uid');
      
      if (!userId) {
        console.log('No user ID found');
        setIsLoading(false);
        return;
      }

      // Fetch user profile with stats (uses apiClient internally)
      const profileData = await getUserProfileData(userId);
      
      setStats({
        eventsCreated: profileData.eventsCreated || 0,
        eventsContributed: profileData.eventsContributed || 0,
        totalContributed: profileData.totalContributed || 0,
        totalRaised: profileData.totalRaised || 0,
        friendsCount: profileData.friendsCount || 0,
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
        const asset = result.assets[0];
        console.log('📷 Image picker result:', asset);
        
        // For web, we need to get the actual blob from the URI
        if (Platform.OS === 'web' && asset.uri) {
          await uploadImage(asset.uri);
        } else {
          await uploadImage(asset.uri);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };
  
  const uploadImage = async (imageData) => {
    setIsUploadingImage(true);
    
    try {
      const userId = await AsyncStorage.getItem('uid');
      
      if (!userId) {
        throw new Error('Not authenticated');
      }
  
      console.log('📤 Starting upload...');
      
      // Upload
      const data = await updateProfilePicture(userId, imageData);
      console.log('✅ Upload response:', data);
      
      // Build full URL
      let imageUrl = data.profileImageUrl;
      if (imageUrl && !imageUrl.startsWith('http')) {
        imageUrl = `${API_URL}${imageUrl}`;
      }
      
      // Add cache buster to force reload
      imageUrl = `${imageUrl}?t=${Date.now()}`;
      
      console.log('🖼️ New image URL:', imageUrl);

      setProfileImageUrl(imageUrl);

      
      // Update UserContext
      if (userCtx?.useraccount) {
        userCtx.setuseraccount({
          ...userCtx.useraccount,
          profileImage: imageUrl,
        });
      }
  
      Alert.alert('Success! 🎉', 'Profile picture updated successfully');
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      Alert.alert('Upload Failed', error.message || 'Failed to upload.');
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

  const userInitial = userCtx?.useraccount?.fname?.[0]?.toUpperCase() || '?';
  const userName = userCtx?.useraccount?.fname 
    ? `${userCtx.useraccount.fname} ${userCtx.useraccount.lname || ''}`.trim()
    : 'User';
  const userEmail = userCtx?.userAccount?.email || 'email@example.com';
  const profileImage = profileImageUrl || userCtx?.useraccount?.profileImage;
  console.log('🎨 Current profile image:', profileImage);

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

      {/* Stats Grid - Real Data */}
      <View style={styles.statsContainer}>
        <View style={styles.statsRow}>
          <TouchableOpacity 
            style={styles.statCard}
            onPress={handleViewEvents}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="gift" size={24} color="#FF6B6B" />
            </View>
            <Text style={styles.statValue}>{stats.eventsCreated}</Text>
            <Text style={styles.statLabel}>Events Created</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.statCard}
            onPress={handleViewEvents}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <Ionicons name="heart" size={24} color="#4ECDC4" />
            </View>
            <Text style={styles.statValue}>{stats.eventsContributed}</Text>
            <Text style={styles.statLabel}>Contributed To</Text>
          </TouchableOpacity>
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
              {stats.eventsCreated} events created
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

      {/* App Version */}
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