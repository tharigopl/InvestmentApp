// client/util/contributions.js
import apiClient from './api-client';

/**
 * Create payment intent for contribution
 * @param {Object} contributionData - Contribution details
 * @returns {Promise<Object>} Payment intent with client secret
 */
export async function createContribution(contributionData) {
  try {
    const response = await apiClient.post('/stripe/create-payment-intent', contributionData);
    return response.data;
  } catch (error) {
    console.error('Create contribution error:', error.message);
    throw error;
  }
}

/**
 * Confirm payment after successful Stripe payment
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @returns {Promise<Object>} Confirmed contribution
 */
export async function confirmContribution(paymentIntentId) {
  try {
    const response = await apiClient.post('/stripe/confirm-contribution', { paymentIntentId });
    return response.data;
  } catch (error) {
    console.error('Confirm contribution error:', error.message);
    throw error;
  }
}

/**
 * Get contributions for an event
 * @param {string} eventId - Event ID
 * @returns {Promise<Array>} Array of contributions
 */
export async function getEventContributions(eventId) {
  try {
    const response = await apiClient.get(`/contributions/event/${eventId}`);
    return response.data.contributions || [];
  } catch (error) {
    console.error('Get event contributions error:', error.message);
    throw error;
  }
}

/**
 * Get user's contributions
 * @returns {Promise<Array>} User's contributions
 */
export async function getMyContributions() {
  try {
    const response = await apiClient.get('/contributions/my-contributions');
    return response.data.contributions || [];
  } catch (error) {
    console.error('Get my contributions error:', error.message);
    throw error;
  }
}

/**
 * Get single contribution by ID
 * @param {string} contributionId - Contribution ID
 * @returns {Promise<Object>} Contribution details
 */
export async function getContributionById(contributionId) {
  try {
    const response = await apiClient.get(`/contributions/${contributionId}`);
    return response.data.contribution;
  } catch (error) {
    console.error('Get contribution error:', error.message);
    throw error;
  }
}

/**
 * Request refund for contribution
 * @param {string} contributionId - Contribution ID
 * @param {string} reason - Refund reason
 * @returns {Promise<Object>} Refund details
 */
export async function requestRefund(contributionId, reason) {
  try {
    const response = await apiClient.post(`/contributions/${contributionId}/refund`, { reason });
    return response.data;
  } catch (error) {
    console.error('Request refund error:', error.message);
    throw error;
  }
}

/**
 * Update contribution message
 * @param {string} contributionId - Contribution ID
 * @param {string} message - New message
 * @returns {Promise<Object>} Updated contribution
 */
export async function updateContributionMessage(contributionId, message) {
  try {
    const response = await apiClient.patch(`/contributions/${contributionId}`, { message });
    return response.data.contribution;
  } catch (error) {
    console.error('Update contribution error:', error.message);
    throw error;
  }
}

/**
 * Get contribution statistics for user
 * @returns {Promise<Object>} Statistics
 */
export async function getContributionStats() {
  try {
    const response = await apiClient.get('/contributions/stats');
    return response.data.stats;
  } catch (error) {
    console.error('Get contribution stats error:', error.message);
    throw error;
  }
}

/**
 * Calculate Stripe fees
 * @param {number} amount - Contribution amount
 * @returns {Object} Fee breakdown
 */
export function calculateFees(amount) {
  const stripeFeePercentage = 0.029; // 2.9%
  const stripeFeeFixed = 0.30; // $0.30
  
  const stripeFee = (amount * stripeFeePercentage) + stripeFeeFixed;
  const netAmount = amount - stripeFee;
  
  return {
    amount: parseFloat(amount.toFixed(2)),
    stripeFee: parseFloat(stripeFee.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2)),
    stripeFeePercentage: stripeFeePercentage * 100,
    stripeFeeFixed: stripeFeeFixed,
  };
}

/**
 * Format contribution for display
 * @param {Object} contribution - Contribution object
 * @returns {Object} Formatted contribution
 */
export function formatContribution(contribution) {
  return {
    ...contribution,
    formattedAmount: `$${contribution.amount.toFixed(2)}`,
    formattedDate: new Date(contribution.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }),
    formattedTime: new Date(contribution.createdAt).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }),
    statusColor: getStatusColor(contribution.paymentDetails?.status),
    statusIcon: getStatusIcon(contribution.paymentDetails?.status),
  };
}

/**
 * Get status color for contribution
 * @param {string} status - Payment status
 * @returns {string} Color code
 */
function getStatusColor(status) {
  const colors = {
    succeeded: '#10b981',
    pending: '#f59e0b',
    failed: '#ef4444',
    refunded: '#6b7280',
  };
  return colors[status] || colors.pending;
}

/**
 * Get status icon for contribution
 * @param {string} status - Payment status
 * @returns {string} Icon name
 */
function getStatusIcon(status) {
  const icons = {
    succeeded: 'checkmark-circle',
    pending: 'time',
    failed: 'close-circle',
    refunded: 'return-up-back',
  };
  return icons[status] || icons.pending;
}

/**
 * Validate contribution amount
 * @param {number} amount - Amount to validate
 * @param {number} minAmount - Minimum allowed (default: $1)
 * @param {number} maxAmount - Maximum allowed (default: $10000)
 * @returns {Object} Validation result
 */
export function validateContributionAmount(amount, minAmount = 1, maxAmount = 10000) {
  // Convert to number and sanitize
  const numAmount = parseFloat(amount);
  
  if (!numAmount || isNaN(numAmount)) {
    return { valid: false, error: 'Please enter a valid amount' };
  }

  if (numAmount < minAmount) {
    return { valid: false, error: `Minimum contribution is $${minAmount}` };
  }

  if (numAmount > maxAmount) {
    return { valid: false, error: `Maximum contribution is $${maxAmount}` };
  }

  // Check for too many decimal places
  if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
    return { valid: false, error: 'Amount can only have up to 2 decimal places' };
  }

  return { valid: true, error: null };
}

/**
 * Group contributions by date
 * @param {Array} contributions - Array of contributions
 * @returns {Object} Contributions grouped by date
 */
export function groupContributionsByDate(contributions) {
  const grouped = {};

  contributions.forEach(contribution => {
    const date = new Date(contribution.createdAt).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    if (!grouped[date]) {
      grouped[date] = [];
    }

    grouped[date].push(contribution);
  });

  return grouped;
}

/**
 * Calculate total contributions
 * @param {Array} contributions - Array of contributions
 * @returns {Object} Total statistics
 */
export function calculateContributionTotals(contributions) {
  const succeeded = contributions.filter(
    c => c.paymentDetails?.status === 'succeeded'
  );

  const totalAmount = succeeded.reduce((sum, c) => sum + c.amount, 0);
  const totalFees = succeeded.reduce(
    (sum, c) => sum + (c.paymentDetails?.fees || 0),
    0
  );

  return {
    count: succeeded.length,
    totalAmount: parseFloat(totalAmount.toFixed(2)),
    totalFees: parseFloat(totalFees.toFixed(2)),
    averageAmount: succeeded.length > 0
      ? parseFloat((totalAmount / succeeded.length).toFixed(2))
      : 0,
  };
}