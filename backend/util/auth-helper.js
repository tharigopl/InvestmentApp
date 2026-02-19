// backend/util/auth-helper.js
/**
 * Utility to extract user ID from req.userData
 * Handles both old and new auth middleware structures
 */

/**
 * Extract user ID from request userData
 * Supports multiple auth middleware patterns
 * 
 * @param {Object} userData - req.userData from auth middleware
 * @returns {string|null} - User ID or null
 */
function getUserId(userData) {
    if (!userData) return null;
    
    // New structure (after fix): req.userData = decodedToken
    // decodedToken = { userId: "...", email: "...", iat: ..., exp: ... }
    if (typeof userData.userId === 'string') {
      return userData.userId;
    }
    
    // Old structure (nested): req.userData = { userId: { userId: "...", email: "..." } }
    if (userData.userId && typeof userData.userId === 'object' && userData.userId.userId) {
      return userData.userId.userId;
    }
    
    // Alternative structures
    if (userData.user?.id) return userData.user.id;
    if (userData.user?._id) return userData.user._id;
    if (typeof userData.user === 'string') return userData.user;
    if (userData.id) return userData.id;
    if (userData._id) return userData._id;
    
    return null;
  }
  
  /**
   * Extract user email from request userData
   * 
   * @param {Object} userData - req.userData from auth middleware
   * @returns {string|null} - User email or null
   */
  function getUserEmail(userData) {
    if (!userData) return null;
    
    // New structure
    if (typeof userData.email === 'string') {
      return userData.email;
    }
    
    // Old structure (nested)
    if (userData.userId && typeof userData.userId === 'object' && userData.userId.email) {
      return userData.userId.email;
    }
    
    // Alternative structures
    if (userData.user?.email) return userData.user.email;
    
    return null;
  }
  
  /**
   * Get full user data object
   * 
   * @param {Object} userData - req.userData from auth middleware
   * @returns {Object} - Normalized user data
   */
  function getUserData(userData) {
    if (!userData) return null;
    
    // New structure (flat)
    if (typeof userData.userId === 'string') {
      return {
        userId: userData.userId,
        email: userData.email,
        iat: userData.iat,
        exp: userData.exp
      };
    }
    
    // Old structure (nested)
    if (userData.userId && typeof userData.userId === 'object') {
      return {
        userId: userData.userId.userId,
        email: userData.userId.email,
        iat: userData.userId.iat,
        exp: userData.userId.exp
      };
    }
    
    return userData;
  }
  
  module.exports = {
    getUserId,
    getUserEmail,
    getUserData
  };