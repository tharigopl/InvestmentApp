// client/util/friend.js - COMPLETE with User + Contact support
import apiClient from './api-client';

// ============================================
// COMBINED FRIENDS (Users + Contacts)
// ============================================

/**
 * Get all friends (users + contacts combined)
 * @returns {Promise<Array>} Combined array of friends
 */
export async function getAllFriends() {
  try {
    const userResponse = await apiClient.get('/users/me');
    const userId = userResponse.data.user.id || userResponse.data.user._id;
    
    const response = await apiClient.get(`/users/${userId}/all-friends`);
    return response.data.friends || [];
  } catch (error) {
    console.error('Get all friends error:', error.message);
    if (error.status === 404) return [];
    throw error;
  }
}

// ============================================
// USER FRIENDS (Registered Users)
// ============================================

/**
 * Search users to add as friends
 * @param {string} query - Search query (name or email)
 * @returns {Promise<Array>} Array of users
 */
export async function searchUsers(query) {
  try {
    if (!query || query.trim().length < 2) {
      return [];
    }
    
    const response = await apiClient.get('/users/search', {
      params: { q: query }
    });
    return response.data.users || [];
  } catch (error) {
    console.error('Search users error:', error.message);
    throw error;
  }
}

/**
 * Add a user as friend
 * @param {string} friendId - User ID to add as friend
 * @returns {Promise<Object>} Added friend
 */
export async function addUserFriend(friendId) {
  try {
    const userResponse = await apiClient.get('/users/me');
    const userId = userResponse.data.user.id || userResponse.data.user._id;
    
    const response = await apiClient.post(`/users/${userId}/friends`, {
      friendId
    });
    
    return response.data.friend;
  } catch (error) {
    console.error('Add user friend error:', error.message);
    throw error;
  }
}

/**
 * Remove a friend
 * @param {string} friendId - User ID to remove
 * @returns {Promise<boolean>} Success status
 */
export async function removeFriend(friendId) {
  try {
    const userResponse = await apiClient.get('/users/me');
    const userId = userResponse.data.user.id || userResponse.data.user._id;
    
    await apiClient.delete(`/users/${userId}/friends/${friendId}`);
    return true;
  } catch (error) {
    console.error('Remove friend error:', error.message);
    throw error;
  }
}

/**
 * Get friend suggestions based on mutual friends
 * @param {number} limit - Max number of suggestions
 * @returns {Promise<Array>} Array of suggested users
 */
export async function getFriendSuggestions(limit = 10) {
  try {
    const userResponse = await apiClient.get('/users/me');
    const userId = userResponse.data.user.id || userResponse.data.user._id;
    
    const response = await apiClient.get(`/users/${userId}/friend-suggestions`, {
      params: { limit }
    });
    
    return response.data.suggestions || [];
  } catch (error) {
    console.error('Get friend suggestions error:', error.message);
    return [];
  }
}

// ============================================
// EXTERNAL CONTACTS (Non-Users)
// ============================================

/**
 * Get all external contacts
 * @returns {Promise<Array>} Array of contacts
 */
export async function getContacts() {
  try {
    const response = await apiClient.get('/contacts');
    return response.data.contacts || [];
  } catch (error) {
    console.error('Get contacts error:', error.message);
    if (error.status === 404) return [];
    throw error;
  }
}

/**
 * Get contact statistics
 * @returns {Promise<Object>} Contact stats
 */
export async function getContactStats() {
  try {
    const response = await apiClient.get('/contacts');
    return response.data.stats || {};
  } catch (error) {
    console.error('Get contact stats error:', error.message);
    return {};
  }
}

/**
 * Get single contact by ID
 * @param {string} contactId - Contact ID
 * @returns {Promise<Object>} Contact details
 */
export async function getContactById(contactId) {
  try {
    const response = await apiClient.get(`/contacts/${contactId}`);
    return response.data.contact;
  } catch (error) {
    console.error('Get contact error:', error.message);
    throw error;
  }
}

/**
 * Add external contact
 * @param {Object} contactData - Contact details {email, firstName, lastName, phoneNumber}
 * @returns {Promise<Object>} Result (could be contact or user friend)
 */
export async function addContact(contactData) {
  try {
    const response = await apiClient.post('/contacts', contactData);
    return response.data;
  } catch (error) {
    console.error('Add contact error:', error.message);
    throw error;
  }
}

/**
 * Update contact
 * @param {string} contactId - Contact ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated contact
 */
export async function updateContact(contactId, updates) {
  try {
    const response = await apiClient.patch(`/contacts/${contactId}`, updates);
    return response.data.contact;
  } catch (error) {
    console.error('Update contact error:', error.message);
    throw error;
  }
}

/**
 * Delete contact
 * @param {string} contactId - Contact ID
 * @returns {Promise<boolean>} Success status
 */
export async function deleteContact(contactId) {
  try {
    await apiClient.delete(`/contacts/${contactId}`);
    return true;
  } catch (error) {
    console.error('Delete contact error:', error.message);
    throw error;
  }
}

/**
 * Send invite to contact to join app
 * @param {string} contactId - Contact ID
 * @returns {Promise<Object>} Invite result with link
 */
export async function inviteContactToJoin(contactId) {
  try {
    const response = await apiClient.post(`/contacts/${contactId}/invite`);
    return response.data;
  } catch (error) {
    console.error('Invite contact error:', error.message);
    throw error;
  }
}

/**
 * Bulk import contacts
 * @param {Array<Object>} contacts - Array of contact objects
 * @returns {Promise<Object>} Import results
 */
export async function bulkImportContacts(contacts) {
  try {
    const response = await apiClient.post('/contacts/bulk', { contacts });
    return response.data;
  } catch (error) {
    console.error('Bulk import error:', error.message);
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Format friend/contact for display
 * @param {Object} friend - Friend or contact object
 * @returns {Object} Formatted friend
 */
export function formatFriend(friend) {
  return {
    id: friend.id || friend._id,
    name: friend.name || `${friend.firstName || friend.fname} ${friend.lastName || friend.lname}`,
    firstName: friend.firstName || friend.fname,
    lastName: friend.lastName || friend.lname,
    email: friend.email,
    phone: friend.phoneNumber || friend.phoneno,
    image: friend.profileImage || friend.imageUrl,
    type: friend.type || 'user',
    isRegistered: friend.isRegistered !== false,
    canContribute: friend.canContribute !== false,
    canReceiveGifts: friend.canReceiveGifts !== false,
    tags: friend.tags || [],
    invitedToJoin: friend.invitedToJoin || false
  };
}

/**
 * Get initials from name
 * @param {Object} friend - Friend or contact
 * @returns {string} Initials
 */
export function getInitials(friend) {
  const firstName = friend.firstName || friend.fname || '';
  const lastName = friend.lastName || friend.lname || '';
  return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase() || '?';
}

/**
 * Check if friend is a registered user
 * @param {Object} friend - Friend object
 * @returns {boolean} True if registered user
 */
export function isRegisteredUser(friend) {
  return friend.type === 'user' || friend.isRegistered === true;
}

/**
 * Check if friend is an external contact
 * @param {Object} friend - Friend object
 * @returns {boolean} True if external contact
 */
export function isExternalContact(friend) {
  return friend.type === 'contact' || friend.isRegistered === false;
}