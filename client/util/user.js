//const API_DOMAIN = process.env.EXPO_PUBLIC_API_DOMAIN;
//const API_DOMAIN = 'http://192.168.0.165:5000';
//const API_DOMAIN = '192.168.0.82';
//const API_DOMAIN = 'https://happykid-396701.uc.r.appspot.com';

// client/util/user.js - Refactored to use apiClient
import apiClient from './api-client';

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