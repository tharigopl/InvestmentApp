// client/util/friend.js - FIXED to use /api/friends/add-user endpoint
import apiClient from './api-client';

/**
 * ✨ FIXED: Add user as friend (User-to-User)
 * Now uses correct endpoint: POST /api/friends/add-user
 * @param {string} friendId - User ID to add as friend
 * @returns {Promise<Object>} Friend data
 */
export async function addUserFriend(friendId) {
  try {
    const response = await apiClient.post('/friends/add-user', {
      friendId: friendId  // ✅ This matches the new validation!
    });
    return response.data.friend || response.data;
  } catch (error) {
    console.error('Add user friend error:', error);
    
    // Handle specific error messages
    if (error.response?.data?.message) {
      const message = error.response.data.message;
      
      if (message.includes('already friends')) {
        throw new Error('You are already friends with this user');
      }
      if (message.includes('cannot add yourself')) {
        throw new Error('You cannot add yourself as a friend');
      }
      if (message.includes('not active')) {
        throw new Error('This user account is not active');
      }
    }
    
    throw new Error(error.message || 'Failed to add friend');
  }
}

/**
 * Get all friends for a specific user
 * @param {string} userId - User ID
 * @returns {Promise<Array>} Array of friends
 */
export async function getFriends(userId) {
  try {
    const response = await apiClient.get(`/friends/user/${userId}`);
    return response.data.friends || [];
  } catch (error) {
    console.error('Get friends error:', error.message);
    if (error.status === 404) {
      return [];
    }
    throw error;
  }
}

/**
 * Get all friends for current authenticated user
 * @returns {Promise<Array>} Array of friends
 */
export async function getMyFriends() {
  try {
    const userResponse = await apiClient.get('/users/me');
    const userId = userResponse.data.user.id || userResponse.data.user._id;
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
 * Search users by email or name
 * @param {string} query - Search query
 * @returns {Promise<Array>} Array of matching users
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
    return [];
  }
}

/**
 * Create external friend/contact
 * POST /api/friends (requires email, firstname, lastname)
 * @param {Object} friendData - Friend details
 * @returns {Promise<Object>} Created friend
 */
export async function createFriend(friendData) {
  try {
    const response = await apiClient.post('/friends', {
      email: friendData.email,
      firstname: friendData.firstname || friendData.firstName,
      lastname: friendData.lastname || friendData.lastName,
    });
    return response.data.friend;
  } catch (error) {
    console.error('Create friend error:', error.message);
    throw error;
  }
}

/**
 * Add external contact (if using Contact model)
 * @param {Object} contactData - Contact details
 * @returns {Promise<Object>} Created contact
 */
export async function addContact(contactData) {
  try {
    const response = await apiClient.post('/contacts', {
      email: contactData.email,
      firstName: contactData.firstName,
      lastName: contactData.lastName,
      phoneNumber: contactData.phoneNumber,
    });
    return response.data;
  } catch (error) {
    console.error('Add contact error:', error.message);
    if (error.response?.data?.message?.includes('already have a contact')) {
      throw new Error('You already have a contact with this email');
    }
    throw error;
  }
}

/**
 * Get all friends (if using dual system)
 * @returns {Promise<Array>} Combined friends
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

// Other utility functions...
export async function getFriendById(friendId) {
  try {
    const response = await apiClient.get(`/friends/${friendId}`);
    return response.data.friend;
  } catch (error) {
    console.error('Get friend by ID error:', error.message);
    throw error;
  }
}

export async function updateFriend(friendId, updates) {
  try {
    const response = await apiClient.patch(`/friends/${friendId}`, {
      firstname: updates.firstname || updates.firstName,
      lastname: updates.lastname || updates.lastName,
    });
    return response.data.friend;
  } catch (error) {
    console.error('Update friend error:', error.message);
    throw error;
  }
}

export async function deleteFriend(friendId) {
  try {
    await apiClient.delete(`/friends/${friendId}`);
    return true;
  } catch (error) {
    console.error('Delete friend error:', error.message);
    throw error;
  }
}

export async function getAllUsers() {
  try {
    const response = await apiClient.get('/users');
    return response.data.users || [];
  } catch (error) {
    console.error('Get all users error:', error.message);
    throw error;
  }
}

// Backward compatibility
export async function addFriend(friendId) {
  return addUserFriend(friendId);
}
// // client/util/friend.js - UPDATED with correct API routes and api-client
// import apiClient from './api-client';

// /**
//  * Get all users (for finding/adding friends)
//  * @returns {Promise<Array>} Array of users
//  */
// export async function getAllUsers() {
//   try {
//     const response = await apiClient.get('/users');
//     return response.data.users || [];
//   } catch (error) {
//     console.error('Get all users error:', error.message);
//     throw error;
//   }
// }

// /**
//  * Get all friends for a specific user
//  *  FIXED: Uses correct backend route /api/friends/user/:userid
//  * @param {string} userId - User ID
//  * @returns {Promise<Array>} Array of friends
//  */
// export async function getFriends(userId) {
//   try {
//     const response = await apiClient.get(`/friends/user/${userId}`);
//     return response.data.friends || [];
//   } catch (error) {
//     console.error('Get friends error:', error.message);
//     // Return empty array instead of throwing to handle "no friends yet" gracefully
//     if (error.status === 404) {
//       return [];
//     }
//     throw error;
//   }
// }

// /**
//  * Get all friends for current authenticated user
//  *  NEW: Automatically gets userId from context/storage
//  * @returns {Promise<Array>} Array of friends
//  */
// export async function getMyFriends() {
//   try {
//     // First get current user info
//     const userResponse = await apiClient.get('/users/me');
//     const userId = userResponse.data.user.id || userResponse.data.user._id;
    
//     // Then get friends for that user
//     return await getFriends(userId);
//   } catch (error) {
//     console.error('Get my friends error:', error.message);
//     if (error.status === 404) {
//       return [];
//     }
//     throw error;
//   }
// }

// /**
//  * Get single friend by ID
//  * @param {string} friendId - Friend ID
//  * @returns {Promise<Object>} Friend details
//  */
// export async function getFriendById(friendId) {
//   try {
//     const response = await apiClient.get(`/friends/${friendId}`);
//     return response.data.friend;
//   } catch (error) {
//     console.error('Get friend by ID error:', error.message);
//     throw error;
//   }
// }

// /**
//  * Create a new friend
//  * @param {Object} friendData - Friend details (email, firstname, lastname, uid)
//  * @returns {Promise<Object>} Created friend
//  */
// export async function createFriend(friendData) {
//   try {
//     const response = await apiClient.post('/friends', friendData);
//     return response.data.friend;
//   } catch (error) {
//     console.error('Create friend error:', error.message);
//     throw error;
//   }
// }

// /**
//  * Update friend
//  * @param {string} friendId - Friend ID
//  * @param {Object} updates - Fields to update (firstname, lastname)
//  * @returns {Promise<Object>} Updated friend
//  */
// export async function updateFriend(friendId, updates) {
//   try {
//     const response = await apiClient.patch(`/friends/${friendId}`, updates);
//     return response.data.friend;
//   } catch (error) {
//     console.error('Update friend error:', error.message);
//     throw error;
//   }
// }

// /**
//  * Delete friend
//  * @param {string} friendId - Friend ID
//  * @returns {Promise<boolean>} Success status
//  */
// export async function deleteFriend(friendId) {
//   try {
//     await apiClient.delete(`/friends/${friendId}`);
//     return true;
//   } catch (error) {
//     console.error('Delete friend error:', error.message);
//     throw error;
//   }
// }

// /**
//  * Search users by email or name (for adding friends)
//  * @param {string} query - Search query
//  * @returns {Promise<Array>} Array of matching users
//  */
// export async function searchUsers(query) {
//   try {
//     const response = await apiClient.get('/users/search', {
//       params: { q: query }
//     });
//     return response.data.users || [];
//   } catch (error) {
//     console.error('Search users error:', error.message);
//     throw error;
//   }
// }

// // ========================================
// // BACKWARD COMPATIBILITY (DEPRECATED)
// // Legacy functions for existing code
// // ========================================

// /**
//  * @deprecated Use getAllUsers() instead
//  */
// export async function getAllUsersWithToken(token) {
//   try {
//     const response = await apiClient.get('/users', {
//       headers: { Authorization: `Bearer ${token}` }
//     });
//     return response.data;
//   } catch (error) {
//     console.error('Get all users error:', error.message);
//     throw error;
//   }
// }

// /**
//  * @deprecated Use getFriends(userId) instead
//  */
// export async function getAllFriendsForUser(token, uid) {
//   try {
//     const response = await apiClient.get(`/friends/user/${uid}`, {
//       headers: { Authorization: `Bearer ${token}` }
//     });
    
//     const data = response.data;
//     const friends = [];

//     if (data.friends && Array.isArray(data.friends)) {
//       for (const friend of data.friends) {
//         friends.push({
//           id: friend.id || friend._id,
//           email: friend.email,
//           name: friend.firstname ? `${friend.firstname} ${friend.lastname}` : friend.email,
//           firstname: friend.firstname,
//           lastname: friend.lastname,
//         });
//       }
//     }

//     return friends;
//   } catch (error) {
//     console.error('Get friends error:', error.message);
//     if (error.response?.status === 404) {
//       return [];
//     }
//     throw error;
//   }
// }

// /**
//  * Add a user as friend
//  * @param {string} friendId - User ID to add as friend
//  * @returns {Promise<Object>} Friend data
//  */
// export async function addFriend(friendId) {
//     try {
//       const response = await apiClient.post('/friends', {
//         friendId: friendId
//       });
//       return response.data.friend;
//     } catch (error) {
//       console.error('Add friend error:', error.message);
//       throw error;
//     }
//   }


//   export async function addUserFriend(friendId) {
//     try {
//       const response = await apiClient.post('/friends', {
//         friendId: friendId
//       });
//       return response.data.friend || response.data;
//     } catch (error) {
//       console.error('Add user friend error:', error.message);
//       if (error.response?.data?.message?.includes('already friends')) {
//         throw new Error('You are already friends with this user');
//       }
//       throw error;
//     }
//   }

//   export async function addContact(contactData) {
//     try {
//       const response = await apiClient.post('/contacts', {
//         email: contactData.email,
//         firstName: contactData.firstName,
//         lastName: contactData.lastName,
//         phoneNumber: contactData.phoneNumber,
//       });
//       return response.data;
//     } catch (error) {
//       console.error('Add contact error:', error.message);
//       if (error.response?.data?.message?.includes('already have a contact')) {
//         throw new Error('You already have a contact with this email');
//       }
//       throw error;
//     }
//   }
/**
 * Invite a contact to join the platform
 * POST /api/contacts/:id/invite
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
 * Delete an external contact
 * DELETE /api/contacts/:id
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
 * Remove a registered user from friends
 * DELETE /api/friends/:friendId
 */
export async function removeFriend(friendId) {
  try {
    // Uses DELETE /api/friends/user/:friendUserId
    // This removes from both users' friends arrays mutually
    await apiClient.delete(`/friends/user/${friendId}`);
    return true;
  } catch (error) {
    console.error('Remove friend error:', error.message);
    throw error;
  }
}