// client/util/stripe.js - Refactored to use apiClient
import apiClient from './api-client';

/**
 * Link Stripe account for user
 * @param {string} location - User's country/location
 * @returns {Promise<Object>} Stripe account link data
 */
export async function linkStripe(location) {
  try {
    console.log("Linking Stripe, location:", location);
    
    const response = await apiClient.get('/stripe/link', {
      params: { country: location },
    });
    
    console.log("Link Stripe response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Link Stripe error:', error.message);
    throw error;
  }
}

/**
 * Get Stripe account details
 * @param {string} stripeaccountid - Stripe account ID
 * @returns {Promise<Object>} Account details
 */
export async function getStripeAccount(stripeaccountid) {
  try {
    console.log("Getting Stripe account:", stripeaccountid);
    
    const response = await apiClient.get(`/stripe/account/${stripeaccountid}`);
    
    console.log("Get Stripe account response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Get Stripe account error:', error.message);
    throw error;
  }
}

/**
 * Create Stripe dashboard link
 * @param {string} stripeaccountid - Stripe account ID
 * @returns {Promise<Object>} Dashboard link data
 */
export async function createStripeDashboard(stripeaccountid) {
  try {
    console.log("Creating Stripe dashboard link:", stripeaccountid);
    
    const response = await apiClient.get(`/stripe/account/account/${stripeaccountid}`);
    
    console.log("Create dashboard response:", response.data);
    return response.data;
  } catch (error) {
    console.error('Create Stripe dashboard error:', error.message);
    throw error;
  }
}

/**
 * Create connected account for payouts
 * @param {Object} accountData - Account details
 * @returns {Promise<Object>} Created account
 */
export async function createConnectedAccount(accountData) {
  try {
    const response = await apiClient.post('/stripe/create-connected-account', accountData);
    return response.data;
  } catch (error) {
    console.error('Create connected account error:', error.message);
    throw error;
  }
}

/**
 * Get account status
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} Account status
 */
export async function getAccountStatus(accountId) {
  try {
    const response = await apiClient.get(`/stripe/account-status/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Get account status error:', error.message);
    throw error;
  }
}

/**
 * Refresh account link (for onboarding)
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} New account link
 */
export async function refreshAccountLink(accountId) {
  try {
    const response = await apiClient.post('/stripe/refresh-account-link', {
      accountId,
    });
    return response.data;
  } catch (error) {
    console.error('Refresh account link error:', error.message);
    throw error;
  }
}

/**
 * Get account balance
 * @param {string} accountId - Account ID
 * @returns {Promise<Object>} Balance information
 */
export async function getAccountBalance(accountId) {
  try {
    const response = await apiClient.get(`/stripe/balance/${accountId}`);
    return response.data;
  } catch (error) {
    console.error('Get account balance error:', error.message);
    throw error;
  }
}

/**
 * Get or create customer
 * @returns {Promise<Object>} Customer data
 */
export async function getOrCreateCustomer() {
  try {
    const response = await apiClient.post('/stripe/customer');
    return response.data;
  } catch (error) {
    console.error('Get/create customer error:', error.message);
    throw error;
  }
}

/**
 * Add payment method
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<Object>} Payment method data
 */
export async function addPaymentMethod(paymentMethodId) {
  try {
    const response = await apiClient.post('/stripe/payment-method', {
      paymentMethodId,
    });
    return response.data;
  } catch (error) {
    console.error('Add payment method error:', error.message);
    throw error;
  }
}