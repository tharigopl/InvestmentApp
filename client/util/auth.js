// client/util/auth.js - Refactored to use apiClient
import axios from 'axios';
import apiClient, { setAuthToken } from './api-client';

const API_KEY = 'AIzaSyDK6dLf66nFmxkJb58V5YMaZwvQYigadOU';

/**
 * Firebase authentication (legacy - still uses firebase)
 * @param {string} mode - 'signUp' or 'signInWithPassword'
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<string>} Firebase token
 */
async function authenticate(mode, email, password) {
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${API_KEY}`;

  const response = await axios.post(url, {
    email: email,
    password: password,
    returnSecureToken: true,
  });

  console.log("Firebase response.data", response.data.email);
  const token = response.data.idToken;

  return token;
}

/**
 * TDT Server authentication - Uses apiClient (token handled automatically)
 * @param {string} mode - 'signUp' or 'signInWithPassword'
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Response with token and user data
 */
async function tdtauthenticate(mode, email, password) {
  try {
    let url = `/users/login`;
    
    if (mode === 'signUp') {
      console.log("Signup mode");
      url = `/users/signup`;
    }
    
    console.log("Auth URL:", url);
    
    // Use apiClient - no need to pass token for auth endpoints
    const response = await apiClient.post(url, {
      email: email,
      password: password
    });
    
    console.log("Auth response:", response.data);
    
    // Save token for future requests
    if (response.data.token) {
      await setAuthToken(response.data.token);
    }
    
    return response.data;
  } catch (error) {
    console.error('Auth error:', error.message);
    throw error;
  }
}

/**
 * Get user location (using external API)
 * @returns {Promise<Object>} Location data
 */
async function getUserLocation() {
  try {
    const location = await axios.post('https://ipapi.co/json/');
    console.log("User location:", location.data);
    return location.data;
  } catch (error) {
    console.error('Get location error:', error.message);
    throw error;
  }
}

// ============================================
// EXPORTED FUNCTIONS
// ============================================

/**
 * Create user with Firebase (legacy)
 */
export function createUser(email, password) {
  return authenticate('signUp', email, password);
}

/**
 * Login with Firebase (legacy)
 */
export function login(email, password) {
  return authenticate('signInWithPassword', email, password);
}

/**
 * Login to TDT server (main auth method)
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} User and token
 */
export function logintdtserver(email, password) {
  return tdtauthenticate('signInWithPassword', email, password);
}

/**
 * Create user on TDT server
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {Promise<Object>} Created user and token
 */
export function createUserTdtServer(email, password) {
  return tdtauthenticate('signUp', email, password);
}

/**
 * Get user's location
 * @returns {Promise<Object>} Location data
 */
export function getUserLoc() {
  console.log("Get User Location");
  return getUserLocation();
}