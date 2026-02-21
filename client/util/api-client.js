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
        // Clear stored token
        await AsyncStorage.removeItem('token');
        await AsyncStorage.removeItem('uid');
        
        // You can emit an event here to navigate to login
        // EventEmitter.emit('unauthorized');
        
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

/**
 * Helper function to check if user is authenticated
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
 * Helper function to get current auth token
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
 * Helper function to set auth token
 */
export const setAuthToken = async (token) => {
  try {
    await AsyncStorage.setItem('token', token);
  } catch (error) {
    console.error('Error setting auth token:', error);
  }
};

/**
 * Helper function to clear auth token
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