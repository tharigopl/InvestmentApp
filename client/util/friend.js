// client/util/friend.js - UPDATED with correct API routes and api-client
import apiClient from './api-client';

/**
 * Get all users (for finding/adding friends)
 * @returns {Promise<Array>} Array of users
 */
export async function getAllUsers() {
  try {
    const response = await apiClient.get('/users');
    return response.data.users || [];
  } catch (error) {
    console.error('Get all users error:', error.message);
    throw error;
  }
}

/**
 * Get all friends for a specific user
 * ✨ FIXED: Uses correct backend route /api/friends/user/:userid
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of friends
 */
export async function getFriends(userId) {
  try {
    const response = await apiClient.get(`/friends/user/${userId}`);
    return response.data.friends || [];
  } catch (error) {
    console.error('Get friends error:', error.message);
    // Return empty array instead of throwing to handle "no friends yet" gracefully
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all friends for current authenticated user
 * ✨ NEW: Automatically gets userId from context/storage
 * @returns {Promise<Array>} Array of friends
 */
export async function getMyFriends() {
  try {
    // First get current user info
    const userResponse = await apiClient.get('/users/me');
    const userId = userResponse.data.user.id || userResponse.data.user._id;
    
    // Then get friends for that user
    return await getFriends(userId);
  } catch (error) {
    console.error('Get my friends error:', error.message);
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Get single friend by ID
 * @param {string} friendId - Friend ID
 * @returns {Promise<Object>} Friend details
 */
export async function getFriendById(friendId) {
  try {
    const response = await apiClient.get(`/friends/${friendId}`);
    return response.data.friend;
  } catch (error) {
    console.error('Get friend by ID error:', error.message);
    throw error;
  }
}

/**
 * Create a new friend
 * @param {Object} friendData - Friend details (email, firstname, lastname, uid)
 * @returns {Promise<Object>} Created friend
 */
export async function createFriend(friendData) {
  try {
    const response = await apiClient.post('/friends', friendData);
    return response.data.friend;
  } catch (error) {
    console.error('Create friend error:', error.message);
    throw error;
  }
}

/**
 * Update friend
 * @param {string} friendId - Friend ID
 * @param {Object} updates - Fields to update (firstname, lastname)
 * @returns {Promise<Object>} Updated friend
 */
export async function updateFriend(friendId, updates) {
  try {
    const response = await apiClient.patch(`/friends/${friendId}`, updates);
    return response.data.friend;
  } catch (error) {
    console.error('Update friend error:', error.message);
    throw error;
  }
}

/**
 * Delete friend
 * @param {string} friendId - Friend ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteFriend(friendId) {
  try {
    await apiClient.delete(`/friends/${friendId}`);
    return true;
  } catch (error) {
    console.error('Delete friend error:', error.message);
    throw error;
  }
}

/**
 * Search users by email or name (for adding friends)
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching users
 */
export async function searchUsers(query) {
  try {
    const response = await apiClient.get('/users', {
      params: { search: query }
    });
    return response.data.users || [];
  } catch (error) {
    console.error('Search users error:', error.message);
    throw error;
  }
}

// ========================================
// BACKWARD COMPATIBILITY (DEPRECATED)
// Legacy functions for existing code
// ========================================

/**
 * @deprecated Use getAllUsers() instead
 */
export async function getAllUsersWithToken(token) {
  try {
    const response = await apiClient.get('/users', {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    console.error('Get all users error:', error.message);
    throw error;
  }
}

/**
 * @deprecated Use getFriends(userId) instead
 */
export async function getAllFriendsForUser(token, uid) {
  try {
    const response = await apiClient.get(`/friends/user/${uid}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    const data = response.data;
    const friends = [];

    if (data.friends && Array.isArray(data.friends)) {
      for (const friend of data.friends) {
        friends.push({
          id: friend.id || friend._id,
          email: friend.email,
          name: friend.firstname ? `${friend.firstname} ${friend.lastname}` : friend.email,
          firstname: friend.firstname,
          lastname: friend.lastname,
        });
      }
    }

    return friends;
  } catch (error) {
    console.error('Get friends error:', error.message);
    if (error.response?.status === 404) {
      return [];
    }
    throw error;
  }
}