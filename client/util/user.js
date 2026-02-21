//const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN;
//const API_DOMAIN = 'http://192.168.0.165:5000';
//const API_DOMAIN = '192.168.0.82';
//const API_DOMAIN = 'https://happykid-396701.uc.r.appspot.com';

// client/util/user.js - Refactored to use apiClient
import apiClient from './api-client';
import { Platform } from 'react-native';

/**
 * Add friends by email to user
 * @param {Array<string>} friendsemail - Array of friend emails
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Updated user data
 */
async function addFriendsAPI(friendsemail, uid) {
  try {
    console.log("Adding friends:", friendsemail, "to user:", uid);
    
    const response = await apiClient.patch(`/users/${uid}/friendsemail`, {
      emailids: friendsemail,
    });
    
    const data = response.data;
    console.log("Add friends API response:", data);
    return data;
  } catch (error) {
    console.error('Add friends error:', error.message);
    throw error;
  }
}

/**
 * Get user details
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User details
 */
async function getUserDetailsAPI(uid) {
  try {
    console.log("Getting user details for:", uid);
    
    const response = await apiClient.get(`/users/${uid}`);
    
    const data = response.data;
    console.log("User details retrieved");
    return data;
  } catch (error) {
    console.error('Get user details error:', error.message);
    throw error;
  }
}

/**
 * Update user information
 * @param {string} uid - User ID
 * @param {Object} userdata - User data to update
 * @returns {Promise<Object>} Updated user data
 */
async function updateUserAPI(uid, userdata) {
  try {
    console.log("Updating user:", uid, "with data:", userdata);
    
    const response = await apiClient.patch(`/users/${uid}/`, userdata);
    
    const data = response.data;
    console.log("Update user API response:", data);
    return data;
  } catch (error) {
    console.error('Update user error:', error.message);
    throw error;
  }
}

// ============================================
// EXPORTED FUNCTIONS
// ============================================

/**
 * Get user details (no token needed - handled by interceptor)
 * @param {string} uid - User ID
 * @returns {Promise<Object>} User details
 */
export function getUserDetails(uid) {
  return getUserDetailsAPI(uid);
}

/**
 * Add friends to user (no token needed - handled by interceptor)
 * @param {Array<string>} friends - Array of friend emails
 * @param {string} uid - User ID
 * @returns {Promise<Object>} Updated user
 */
export function addFriends(friends, uid) {
  return addFriendsAPI(friends, uid);
}

/**
 * Update user (no token needed - handled by interceptor)
 * @param {string} uid - User ID
 * @param {Object} userdata - User data to update
 * @returns {Promise<Object>} Updated user
 */
export function updateUser(uid, userdata) {
  return updateUserAPI(uid, userdata);
}

/**
 * Fetch user statistics (events created, contributed, totals)
 * @param {string} userId - User ID
 * @returns {Promise<object>} User statistics
 */
export async function getUserStats(userId) {
  try {
    // Fetch all events for the user
    const response = await apiClient.get(`/events/user/${userId}`);
    
    // axios wraps response in .data
    const events = response.data?.events || response.events || response.data || [];
    
    // Initialize stats
    let eventsCreated = 0;
    let eventsContributed = 0;
    let totalContributed = 0;
    let totalRaised = 0;
    
    // Calculate stats from events
    events.forEach(event => {
      // Events created by this user (using createdBy field)
      const isCreator = event.createdBy === userId || event.createdBy?._id === userId;
      
      if (isCreator) {
        eventsCreated++;
        totalRaised += event.currentAmount || 0;
      }
      
      // Events this user contributed to (using contributors.user field)
      if (event.contributors && Array.isArray(event.contributors)) {
        const userContributions = event.contributors.filter(contribution => {
          const contributorId = contribution.user?._id || contribution.user;
          return contributorId === userId;
        });
        
        if (userContributions.length > 0) {
          eventsContributed++;
          
          userContributions.forEach(contribution => {
            totalContributed += contribution.amount || 0;
          });
        }
      }
    });
    
    return {
      eventsCreated,
      eventsContributed,
      totalContributed,
      totalRaised,
    };
  } catch (error) {
    console.error('Error fetching user stats:', error);
    // Return default stats on error
    return {
      eventsCreated: 0,
      eventsContributed: 0,
      totalContributed: 0,
      totalRaised: 0,
    };
  }
}

/**
 * Fetch user's friends count
 * @returns {Promise<number>} Number of friends
 */
export async function getFriendsCount() {
  try {
    const response = await apiClient.get('/friends');
    // axios wraps response in .data
    const friends = response.data?.friends || response.friends || response.data || [];
    return friends.length;
  } catch (error) {
    console.error('Error fetching friends count:', error);
    return 0;
  }
}

/**
 * Fetch complete user profile data (stats + friends)
 * @param {string} userId - User ID
 * @returns {Promise<object>} Complete profile data
 */
export async function getUserProfileData(userId) {
  try {
    // Fetch stats and friends count in parallel
    const [stats, friendsCount] = await Promise.all([
      getUserStats(userId),
      getFriendsCount(),
    ]);
    
    return {
      ...stats,
      friendsCount,
    };
  } catch (error) {
    console.error('Error fetching user profile data:', error);
    return {
      eventsCreated: 0,
      eventsContributed: 0,
      totalContributed: 0,
      totalRaised: 0,
      friendsCount: 0,
    };
  }
}

/**
 * Upload user profile picture
 * @param {string} userId - User ID
 * @param {string} imageData - Local image URI
 * @returns {Promise<object>} Response with profileImageUrl
 */
export async function updateProfilePicture(userId, imageData) {
  try {
    console.log('📤 uploadProfilePicture called');
    console.log('userId:', userId);
    console.log('imageData type:', typeof imageData);
    console.log('imageData:', imageData);
    
    const formData = new FormData();
    
    if (Platform.OS === 'web') {
      // Web: imageData should be a Blob
      if (imageData instanceof Blob) {
        console.log('✅ Using Blob directly');
        console.log('Blob type:', imageData.type);
        console.log('Blob size:', imageData.size);
        
        // Verify it's an image
        if (!imageData.type.startsWith('image/')) {
          throw new Error(`Invalid file type: ${imageData.type}. Must be an image.`);
        }
        
        // Create File from Blob with proper name and type
        const file = new File([imageData], 'profile.jpg', { type: imageData.type });
        formData.append('profileImage', file);
      } else if (typeof imageData === 'string') {
        // Fallback: if it's a string URI, fetch it
        console.log('⚠️ Got string URI, fetching blob...');
        const response = await fetch(imageData);
        const blob = await response.blob();
        
        if (!blob.type.startsWith('image/')) {
          throw new Error(`Invalid file type: ${blob.type}. Must be an image.`);
        }
        
        const file = new File([blob], 'profile.jpg', { type: blob.type });
        formData.append('profileImage', file);
      } else {
        throw new Error('Invalid imageData format for web');
      }
    } else {
      // Mobile: imageData should be a URI string
      const uri = typeof imageData === 'string' ? imageData : imageData.uri;
      const filename = uri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      console.log('📱 Mobile upload');
      console.log('URI:', uri);
      console.log('Type:', type);
      
      formData.append('profileImage', {
        uri: uri,
        name: filename || 'profile.jpg',
        type: type,
      });
    }
    
    console.log('📡 Sending to API...');
    
    // Upload using api-client
    const response = await apiClient.post(
      `/users/${userId}/profile-picture`,
      formData
    );
    
    console.log('✅ Upload successful');
    return response.data;
  } catch (error) {
    console.error('❌ uploadProfilePicture error:', error);
    console.error('Error response:', error.response?.data);
    throw error;
  }
}

/**
 * Delete user profile picture
 * @param {string} userId - User ID
 * @returns {Promise<object>} Response
 */
export async function deleteProfilePicture(userId) {
  try {
    const response = await apiClient.delete(`/users/${userId}/profile-picture`);
    return response.data;
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    throw error;
  }
}

/**
 * Update user profile information
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 * @returns {Promise<object>} Updated user data
 */
export async function updateUserProfile(userId, updates) {
  try {
    const response = await apiClient.patch(`/users/${userId}`, updates);
    return response.data;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
}

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @returns {Promise<object>} User data
 */
export async function getUserById(userId) {
  try {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}

/**
 * Get user's events (created + contributed)
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of events
 */
export async function getUserEvents(userId) {
  try {
    const response = await apiClient.get(`/events/user/${userId}`);
    return response.data?.events || response.events || response.data || [];
  } catch (error) {
    console.error('Error fetching user events:', error);
    return [];
  }
}

/**
 * Get user's contribution history
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of contributions
 */
export async function getUserContributions(userId) {
  try {
    const response = await apiClient.get(`/contributions/user/${userId}`);
    return response.data?.contributions || response.contributions || response.data || [];
  } catch (error) {
    console.error('Error fetching user contributions:', error);
    return [];
  }
}