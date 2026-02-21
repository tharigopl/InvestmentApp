import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

/**
 * Create axios instance with base configuration
 */
const apiClient = axios.create({
  baseURL: config.API_URL,
  timeout: 15000, // 15 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request interceptor - Add auth token to every request
 */
apiClient.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      
      // Let axios set it automatically with proper boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }

      // Log request in development
      if (__DEV__) {
        console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
      }
      
      return config;
    } catch (error) {
      console.error('Error in request interceptor:', error);
      return config;
    }
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors globally
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log response in development
    if (__DEV__) {
      console.log(`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url}`, response.status);
    }
    
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Log error in development
    if (__DEV__) {
      console.error(
        `[API Error] ${originalRequest?.method?.toUpperCase()} ${originalRequest?.url}`,
        error.response?.status,
        error.response?.data
      );
    }
    
    // Handle 401 Unauthorized - Token expired or invalid
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Clear all auth data
        await clearAuthData();
        
        console.log('Session expired. Please login again.');
      } catch (storageError) {
        console.error('Error clearing auth data:', storageError);
      }
      
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (error.message === 'Network Error') {
      console.error('Network error - Check your internet connection');
      return Promise.reject({
        ...error,
        message: 'Network error. Please check your internet connection.',
      });
    }
    
    // Handle timeout errors
    if (error.code === 'ECONNABORTED') {
      console.error('Request timeout');
      return Promise.reject({
        ...error,
        message: 'Request timeout. Please try again.',
      });
    }
    
    // Handle other HTTP errors
    if (error.response) {
      const errorMessage = error.response.data?.message || error.response.data?.error || 'An error occurred';
      
      return Promise.reject({
        ...error,
        message: errorMessage,
        status: error.response.status,
        data: error.response.data,
      });
    }
    
    return Promise.reject(error);
  }
);

/**
 * Add retry logic for failed requests
 */
let retryCount = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

apiClient.interceptors.response.use(
  (response) => {
    // Reset retry count on success
    retryCount = 0;
    return response;
  },
  async (error) => {
    const { config, response } = error;
    
    // Don't retry if:
    // - No config (not a request error)
    // - Already retried max times
    // - Client error (4xx) - these won't succeed on retry
    // - Request was POST/PUT/PATCH/DELETE (not idempotent)
    if (
      !config ||
      retryCount >= MAX_RETRIES ||
      (response && response.status >= 400 && response.status < 500) ||
      (config.method && !['get', 'head', 'options'].includes(config.method.toLowerCase()))
    ) {
      retryCount = 0;
      return Promise.reject(error);
    }
    
    retryCount++;
    
    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retryCount));
    
    console.log(`Retrying request (${retryCount}/${MAX_RETRIES})...`);
    
    return apiClient(config);
  }
);

// ============================================
// AUTH HELPER FUNCTIONS
// ============================================

/**
 * Check if user is authenticated
 * @returns {Promise<boolean>}
 */
export const isAuthenticated = async () => {
  try {
    const token = await AsyncStorage.getItem('token');
    return !!token;
  } catch (error) {
    console.error('Error checking authentication:', error);
    return false;
  }
};

/**
 * Get current auth token
 * @returns {Promise<string|null>}
 */
export const getAuthToken = async () => {
  try {
    return await AsyncStorage.getItem('token');
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

/**
 * Get current user ID
 * @returns {Promise<string|null>}
 */
export const getUserId = async () => {
  try {
    return await AsyncStorage.getItem('uid');
  } catch (error) {
    console.error('Error getting user ID:', error);
    return null;
  }
};

/**
 * ✅ Save complete auth data (token + userId)
 * @param {string} token - Auth token
 * @param {string} userId - User ID
 * @returns {Promise<void>}
 */
export const saveAuthData = async (token, userId) => {
  try {
    await Promise.all([
      AsyncStorage.setItem('token', token),
      AsyncStorage.setItem('uid', userId),
    ]);
    console.log('✅ Auth data saved:', { userId });
  } catch (error) {
    console.error('Error saving auth data:', error);
    throw error;
  }
};

/**
 * ✅ Clear all auth data
 * @returns {Promise<void>}
 */
export const clearAuthData = async () => {
  try {
    await Promise.all([
      AsyncStorage.removeItem('token'),
      AsyncStorage.removeItem('uid'),
      AsyncStorage.removeItem('userAccount'),
    ]);
    console.log('✅ Auth data cleared');
  } catch (error) {
    console.error('Error clearing auth data:', error);
    throw error;
  }
};

/**
 * Get all auth data at once
 * @returns {Promise<{token: string|null, userId: string|null}>}
 */
export const getAuthData = async () => {
  try {
    const [token, userId] = await Promise.all([
      AsyncStorage.getItem('token'),
      AsyncStorage.getItem('uid'),
    ]);
    return { token, userId };
  } catch (error) {
    console.error('Error getting auth data:', error);
    return { token: null, userId: null };
  }
};

// ============================================
// DEPRECATED - Keep for backwards compatibility
// ============================================

/**
 * @deprecated Use saveAuthData instead
 */
export const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * @deprecated Use clearAuthData instead
 */
export const clearAuthToken = async () => {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('uid');
  } catch (error) {
    console.error('Error clearing auth token:', error);
  }
};

export default apiClient;