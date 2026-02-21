// client/config/api.js - API Configuration
import Constants from 'expo-constants';

// Get API URL from environment or use default
const getApiUrl = () => {
  // Try environment variable first
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  
  // Try expo constants (from app.json)
  if (Constants.expoConfig?.extra?.apiUrl) {
    return Constants.expoConfig.extra.apiUrl;
  }
  
  // Development defaults based on platform
  if (__DEV__) {
    const { Platform } = require('react-native');
    
    if (Platform.OS === 'web') {
      return 'http://localhost:5000';
    } else if (Platform.OS === 'android') {
      // Android emulator uses 10.0.2.2 to access host machine's localhost
      return 'http://10.0.2.2:5000';
    } else if (Platform.OS === 'ios') {
      return 'http://localhost:5000';
    }
  }
  
  // Production fallback - replace with your actual production URL
  return 'https://your-production-api.com';
};

export const API_URL = getApiUrl();

// Helper to build full API endpoints
export const buildApiUrl = (path) => {
  // Remove leading slash if present
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_URL}/${cleanPath}`;
};

// Log the API URL in development
if (__DEV__) {
  console.log('🌐 API URL:', API_URL);
}

export default {
  API_URL,
  buildApiUrl,
};