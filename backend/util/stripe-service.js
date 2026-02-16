const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const logger = require("./logger");

// ============================================
// CONNECTED ACCOUNTS (For Recipients)
// ============================================

/**
 * Create Stripe Connected Account
 * @param {Object} accountData - Account creation data
 * @returns {Promise<Object>} Stripe account object
 */
async function createConnectedAccount(accountData) {
  const startTime = Date.now();
  
  logger.info("stripeService.createConnectedAccount - START", {
    email: accountData.email,
    country: accountData.country,
    type: accountData.type,
  });

  try {
    const account = await stripe.accounts.create({
      type: accountData.type || "express", // express, standard, custom
      country: accountData.country || "US",
      email: accountData.email,
      business_type: accountData.business_type || "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      metadata: accountData.metadata || {},
    });

    const duration = Date.now() - startTime;
    logger.info("stripeService.createConnectedAccount - SUCCESS", {
      accountId: account.id,
      email: account.email,
      type: account.type,
      duration: `${duration}ms`,
    });

    return account;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.createConnectedAccount - ERROR", {
      error: error.message,
      code: error.code,
      type: error.type,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Create Account Link for onboarding
 * @param {string} accountId - Stripe account ID
 * @param {Object} options - Link options
 * @returns {Promise<Object>} Account link object
 */
async function createAccountLink(accountId, options = {}) {
  const startTime = Date.now();
  
  logger.info("stripeService.createAccountLink - START", {
    accountId,
    type: options.type || "account_onboarding",
  });

  try {
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: options.refresh_url || `${process.env.CLIENT_URL}/stripe/refresh`,
      return_url: options.return_url || `${process.env.CLIENT_URL}/stripe/onboarded`,
      type: options.type || "account_onboarding",
      collect: options.collect || undefined, // 'currently_due' or 'eventually_due'
    });

    const duration = Date.now() - startTime;
    logger.info("stripeService.createAccountLink - SUCCESS", {
      accountId,
      expiresAt: accountLink.expires_at,
      duration: `${duration}ms`,
    });

    return accountLink;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.createAccountLink - ERROR", {
      accountId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Retrieve Connected Account
 * @param {string} accountId - Stripe account ID
 * @returns {Promise<Object>} Stripe account object
 */
async function retrieveAccount(accountId) {
  const startTime = Date.now();
  
  logger.info("stripeService.retrieveAccount - START", { accountId });

  try {
    const account = await stripe.accounts.retrieve(accountId);

    const duration = Date.now() - startTime;
    logger.debug("stripeService.retrieveAccount - SUCCESS", {
      accountId,
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      duration: `${duration}ms`,
    });

    return account;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.retrieveAccount - ERROR", {
      accountId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Update Connected Account
 * @param {string} accountId - Stripe account ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated account object
 */
async function updateAccount(accountId, updates) {
  const startTime = Date.now();
  
  logger.info("stripeService.updateAccount - START", {
    accountId,
    updates: Object.keys(updates),
  });

  try {
    const account = await stripe.accounts.update(accountId, updates);

    const duration = Date.now() - startTime;
    logger.info("stripeService.updateAccount - SUCCESS", {
      accountId,
      duration: `${duration}ms`,
    });

    return account;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.updateAccount - ERROR", {
      accountId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Delete Connected Account
 * @param {string} accountId - Stripe account ID
 * @returns {Promise<Object>} Deletion confirmation
 */
async function deleteAccount(accountId) {
  const startTime = Date.now();
  
  logger.info("stripeService.deleteAccount - START", { accountId });

  try {
    const deleted = await stripe.accounts.del(accountId);

    const duration = Date.now() - startTime;
    logger.info("stripeService.deleteAccount - SUCCESS", {
      accountId,
      deleted: deleted.deleted,
      duration: `${duration}ms`,
    });

    return deleted;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.deleteAccount - ERROR", {
      accountId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Retrieve Account Balance
 * @param {string} accountId - Stripe account ID
 * @returns {Promise<Object>} Balance object
 */
async function retrieveAccountBalance(accountId) {
  const startTime = Date.now();
  
  logger.info("stripeService.retrieveAccountBalance - START", { accountId });

  try {
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountId,
    });

    const duration = Date.now() - startTime;
    logger.debug("stripeService.retrieveAccountBalance - SUCCESS", {
      accountId,
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
      currency: balance.available[0]?.currency || "usd",
      duration: `${duration}ms`,
    });

    return balance;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.retrieveAccountBalance - ERROR", {
      accountId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// CUSTOMERS (For Contributors)
// ============================================

/**
 * Create Stripe Customer
 * @param {Object} customerData - Customer creation data
 * @returns {Promise<Object>} Stripe customer object
 */
async function createCustomer(customerData) {
  const startTime = Date.now();
  
  logger.info("stripeService.createCustomer - START", {
    email: customerData.email,
    name: customerData.name,
  });

  try {
    const customer = await stripe.customers.create({
      email: customerData.email,
      name: customerData.name,
      phone: customerData.phone,
      address: customerData.address,
      metadata: customerData.metadata || {},
    });

    const duration = Date.now() - startTime;
    logger.info("stripeService.createCustomer - SUCCESS", {
      customerId: customer.id,
      email: customer.email,
      duration: `${duration}ms`,
    });

    return customer;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.createCustomer - ERROR", {
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Retrieve Customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Customer object
 */
async function retrieveCustomer(customerId) {
  const startTime = Date.now();
  
  logger.info("stripeService.retrieveCustomer - START", { customerId });

  try {
    const customer = await stripe.customers.retrieve(customerId);

    const duration = Date.now() - startTime;
    logger.debug("stripeService.retrieveCustomer - SUCCESS", {
      customerId,
      email: customer.email,
      duration: `${duration}ms`,
    });

    return customer;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.retrieveCustomer - ERROR", {
      customerId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Update Customer
 * @param {string} customerId - Stripe customer ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated customer object
 */
async function updateCustomer(customerId, updates) {
  const startTime = Date.now();
  
  logger.info("stripeService.updateCustomer - START", {
    customerId,
    updates: Object.keys(updates),
  });

  try {
    const customer = await stripe.customers.update(customerId, updates);

    const duration = Date.now() - startTime;
    logger.info("stripeService.updateCustomer - SUCCESS", {
      customerId,
      duration: `${duration}ms`,
    });

    return customer;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.updateCustomer - ERROR", {
      customerId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Delete Customer
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Object>} Deletion confirmation
 */
async function deleteCustomer(customerId) {
  const startTime = Date.now();
  
  logger.info("stripeService.deleteCustomer - START", { customerId });

  try {
    const deleted = await stripe.customers.del(customerId);

    const duration = Date.now() - startTime;
    logger.info("stripeService.deleteCustomer - SUCCESS", {
      customerId,
      deleted: deleted.deleted,
      duration: `${duration}ms`,
    });

    return deleted;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.deleteCustomer - ERROR", {
      customerId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// PAYMENT METHODS
// ============================================

/**
 * Attach Payment Method to Customer
 * @param {string} paymentMethodId - Payment method ID
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} Payment method object
 */
async function attachPaymentMethod(paymentMethodId, customerId) {
  const startTime = Date.now();
  
  logger.info("stripeService.attachPaymentMethod - START", {
    paymentMethodId,
    customerId,
  });

  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    });

    const duration = Date.now() - startTime;
    logger.info("stripeService.attachPaymentMethod - SUCCESS", {
      paymentMethodId,
      customerId,
      type: paymentMethod.type,
      duration: `${duration}ms`,
    });

    return paymentMethod;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.attachPaymentMethod - ERROR", {
      paymentMethodId,
      customerId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Detach Payment Method
 * @param {string} paymentMethodId - Payment method ID
 * @returns {Promise<Object>} Detached payment method
 */
async function detachPaymentMethod(paymentMethodId) {
  const startTime = Date.now();
  
  logger.info("stripeService.detachPaymentMethod - START", {
    paymentMethodId,
  });

  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

    const duration = Date.now() - startTime;
    logger.info("stripeService.detachPaymentMethod - SUCCESS", {
      paymentMethodId,
      duration: `${duration}ms`,
    });

    return paymentMethod;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.detachPaymentMethod - ERROR", {
      paymentMethodId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * List Customer Payment Methods
 * @param {string} customerId - Customer ID
 * @param {string} type - Payment method type (default: 'card')
 * @returns {Promise<Object>} List of payment methods
 */
async function listPaymentMethods(customerId, type = "card") {
  const startTime = Date.now();
  
  logger.info("stripeService.listPaymentMethods - START", {
    customerId,
    type,
  });

  try {
    const paymentMethods = await stripe.paymentMethods.list({
      customer: customerId,
      type: type,
    });

    const duration = Date.now() - startTime;
    logger.debug("stripeService.listPaymentMethods - SUCCESS", {
      customerId,
      count: paymentMethods.data.length,
      duration: `${duration}ms`,
    });

    return paymentMethods;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.listPaymentMethods - ERROR", {
      customerId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// PAYMENT INTENTS
// ============================================

/**
 * Create Payment Intent
 * @param {Object} intentData - Payment intent data
 * @returns {Promise<Object>} Payment intent object
 */
async function createPaymentIntent(intentData) {
  const startTime = Date.now();
  
  logger.info("stripeService.createPaymentIntent - START", {
    amount: intentData.amount,
    currency: intentData.currency || "usd",
    customerId: intentData.customer,
  });

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: intentData.amount, // Amount in cents
      currency: intentData.currency || "usd",
      customer: intentData.customer,
      payment_method_types: intentData.payment_method_types || ["card"],
      metadata: intentData.metadata || {},
      description: intentData.description,
      statement_descriptor: intentData.statement_descriptor,
      transfer_data: intentData.transfer_data, // For connected accounts
      application_fee_amount: intentData.application_fee_amount, // Platform fee
    });

    const duration = Date.now() - startTime;
    logger.info("stripeService.createPaymentIntent - SUCCESS", {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
      duration: `${duration}ms`,
    });

    return paymentIntent;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.createPaymentIntent - ERROR", {
      amount: intentData.amount,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Retrieve Payment Intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Payment intent object
 */
async function retrievePaymentIntent(paymentIntentId) {
  const startTime = Date.now();
  
  logger.info("stripeService.retrievePaymentIntent - START", {
    paymentIntentId,
  });

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    const duration = Date.now() - startTime;
    logger.debug("stripeService.retrievePaymentIntent - SUCCESS", {
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      duration: `${duration}ms`,
    });

    return paymentIntent;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.retrievePaymentIntent - ERROR", {
      paymentIntentId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Update Payment Intent
 * @param {string} paymentIntentId - Payment intent ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated payment intent
 */
async function updatePaymentIntent(paymentIntentId, updates) {
  const startTime = Date.now();
  
  logger.info("stripeService.updatePaymentIntent - START", {
    paymentIntentId,
    updates: Object.keys(updates),
  });

  try {
    const paymentIntent = await stripe.paymentIntents.update(
      paymentIntentId,
      updates
    );

    const duration = Date.now() - startTime;
    logger.info("stripeService.updatePaymentIntent - SUCCESS", {
      paymentIntentId,
      duration: `${duration}ms`,
    });

    return paymentIntent;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.updatePaymentIntent - ERROR", {
      paymentIntentId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Cancel Payment Intent
 * @param {string} paymentIntentId - Payment intent ID
 * @returns {Promise<Object>} Cancelled payment intent
 */
async function cancelPaymentIntent(paymentIntentId) {
  const startTime = Date.now();
  
  logger.info("stripeService.cancelPaymentIntent - START", {
    paymentIntentId,
  });

  try {
    const paymentIntent = await stripe.paymentIntents.cancel(paymentIntentId);

    const duration = Date.now() - startTime;
    logger.info("stripeService.cancelPaymentIntent - SUCCESS", {
      paymentIntentId,
      status: paymentIntent.status,
      duration: `${duration}ms`,
    });

    return paymentIntent;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.cancelPaymentIntent - ERROR", {
      paymentIntentId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Confirm Payment Intent
 * @param {string} paymentIntentId - Payment intent ID
 * @param {Object} options - Confirmation options
 * @returns {Promise<Object>} Confirmed payment intent
 */
async function confirmPaymentIntent(paymentIntentId, options = {}) {
  const startTime = Date.now();
  
  logger.info("stripeService.confirmPaymentIntent - START", {
    paymentIntentId,
  });

  try {
    const paymentIntent = await stripe.paymentIntents.confirm(
      paymentIntentId,
      options
    );

    const duration = Date.now() - startTime;
    logger.info("stripeService.confirmPaymentIntent - SUCCESS", {
      paymentIntentId,
      status: paymentIntent.status,
      duration: `${duration}ms`,
    });

    return paymentIntent;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.confirmPaymentIntent - ERROR", {
      paymentIntentId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// REFUNDS
// ============================================

/**
 * Create Refund
 * @param {Object} refundData - Refund data
 * @returns {Promise<Object>} Refund object
 */
async function createRefund(refundData) {
  const startTime = Date.now();
  
  logger.info("stripeService.createRefund - START", {
    paymentIntentId: refundData.payment_intent,
    amount: refundData.amount,
    reason: refundData.reason,
  });

  try {
    const refund = await stripe.refunds.create({
      payment_intent: refundData.payment_intent,
      amount: refundData.amount, // Optional - full refund if not specified
      reason: refundData.reason, // 'duplicate', 'fraudulent', 'requested_by_customer'
      metadata: refundData.metadata || {},
    });

    const duration = Date.now() - startTime;
    logger.info("stripeService.createRefund - SUCCESS", {
      refundId: refund.id,
      amount: refund.amount,
      status: refund.status,
      duration: `${duration}ms`,
    });

    return refund;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.createRefund - ERROR", {
      paymentIntentId: refundData.payment_intent,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Retrieve Refund
 * @param {string} refundId - Refund ID
 * @returns {Promise<Object>} Refund object
 */
async function retrieveRefund(refundId) {
  const startTime = Date.now();
  
  logger.info("stripeService.retrieveRefund - START", { refundId });

  try {
    const refund = await stripe.refunds.retrieve(refundId);

    const duration = Date.now() - startTime;
    logger.debug("stripeService.retrieveRefund - SUCCESS", {
      refundId,
      status: refund.status,
      amount: refund.amount,
      duration: `${duration}ms`,
    });

    return refund;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.retrieveRefund - ERROR", {
      refundId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// TRANSFERS (For Connected Accounts)
// ============================================

/**
 * Create Transfer to Connected Account
 * @param {Object} transferData - Transfer data
 * @returns {Promise<Object>} Transfer object
 */
async function createTransfer(transferData) {
  const startTime = Date.now();
  
  logger.info("stripeService.createTransfer - START", {
    amount: transferData.amount,
    destination: transferData.destination,
    currency: transferData.currency || "usd",
  });

  try {
    const transfer = await stripe.transfers.create({
      amount: transferData.amount, // Amount in cents
      currency: transferData.currency || "usd",
      destination: transferData.destination, // Connected account ID
      transfer_group: transferData.transfer_group,
      metadata: transferData.metadata || {},
    });

    const duration = Date.now() - startTime;
    logger.info("stripeService.createTransfer - SUCCESS", {
      transferId: transfer.id,
      amount: transfer.amount,
      destination: transfer.destination,
      duration: `${duration}ms`,
    });

    return transfer;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.createTransfer - ERROR", {
      amount: transferData.amount,
      destination: transferData.destination,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Retrieve Transfer
 * @param {string} transferId - Transfer ID
 * @returns {Promise<Object>} Transfer object
 */
async function retrieveTransfer(transferId) {
  const startTime = Date.now();
  
  logger.info("stripeService.retrieveTransfer - START", { transferId });

  try {
    const transfer = await stripe.transfers.retrieve(transferId);

    const duration = Date.now() - startTime;
    logger.debug("stripeService.retrieveTransfer - SUCCESS", {
      transferId,
      amount: transfer.amount,
      destination: transfer.destination,
      duration: `${duration}ms`,
    });

    return transfer;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.retrieveTransfer - ERROR", {
      transferId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// PAYOUTS
// ============================================

/**
 * Create Payout
 * @param {Object} payoutData - Payout data
 * @param {string} connectedAccountId - Connected account ID
 * @returns {Promise<Object>} Payout object
 */
async function createPayout(payoutData, connectedAccountId) {
  const startTime = Date.now();
  
  logger.info("stripeService.createPayout - START", {
    amount: payoutData.amount,
    connectedAccountId,
    currency: payoutData.currency || "usd",
  });

  try {
    const payout = await stripe.payouts.create(
      {
        amount: payoutData.amount, // Amount in cents
        currency: payoutData.currency || "usd",
        metadata: payoutData.metadata || {},
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    const duration = Date.now() - startTime;
    logger.info("stripeService.createPayout - SUCCESS", {
      payoutId: payout.id,
      amount: payout.amount,
      status: payout.status,
      arrivalDate: payout.arrival_date,
      duration: `${duration}ms`,
    });

    return payout;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.createPayout - ERROR", {
      amount: payoutData.amount,
      connectedAccountId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * Retrieve Payout
 * @param {string} payoutId - Payout ID
 * @param {string} connectedAccountId - Connected account ID
 * @returns {Promise<Object>} Payout object
 */
async function retrievePayout(payoutId, connectedAccountId) {
  const startTime = Date.now();
  
  logger.info("stripeService.retrievePayout - START", {
    payoutId,
    connectedAccountId,
  });

  try {
    const payout = await stripe.payouts.retrieve(payoutId, {
      stripeAccount: connectedAccountId,
    });

    const duration = Date.now() - startTime;
    logger.debug("stripeService.retrievePayout - SUCCESS", {
      payoutId,
      status: payout.status,
      amount: payout.amount,
      duration: `${duration}ms`,
    });

    return payout;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.retrievePayout - ERROR", {
      payoutId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

/**
 * List Payouts for Connected Account
 * @param {string} connectedAccountId - Connected account ID
 * @param {Object} options - List options (limit, starting_after, etc.)
 * @returns {Promise<Object>} List of payouts
 */
async function listPayouts(connectedAccountId, options = {}) {
  const startTime = Date.now();
  
  logger.info("stripeService.listPayouts - START", {
    connectedAccountId,
    limit: options.limit || 10,
  });

  try {
    const payouts = await stripe.payouts.list(
      {
        limit: options.limit || 10,
        starting_after: options.starting_after,
        ending_before: options.ending_before,
      },
      {
        stripeAccount: connectedAccountId,
      }
    );

    const duration = Date.now() - startTime;
    logger.debug("stripeService.listPayouts - SUCCESS", {
      connectedAccountId,
      count: payouts.data.length,
      hasMore: payouts.has_more,
      duration: `${duration}ms`,
    });

    return payouts;
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("stripeService.listPayouts - ERROR", {
      connectedAccountId,
      error: error.message,
      duration: `${duration}ms`,
    });
    throw error;
  }
}

// ============================================
// WEBHOOK VERIFICATION
// ============================================

/**
 * Verify Webhook Signature
 * @param {string} payload - Raw request body
 * @param {string} signature - Stripe signature header
 * @param {string} secret - Webhook secret
 * @returns {Object} Verified event object
 */
function verifyWebhookSignature(payload, signature, secret) {
  logger.debug("stripeService.verifyWebhookSignature", {
    hasPayload: !!payload,
    hasSignature: !!signature,
    hasSecret: !!secret,
  });

  try {
    const event = stripe.webhooks.constructEvent(payload, signature, secret);
    
    logger.info("Webhook signature verified", {
      eventId: event.id,
      eventType: event.type,
    });

    return event;
  } catch (error) {
    logger.error("Webhook signature verification failed", {
      error: error.message,
    });
    throw error;
  }
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Calculate Stripe fees
 * @param {number} amount - Amount in dollars
 * @returns {Object} Fee breakdown
 */
function calculateFees(amount) {
  const stripeFeePercentage = 0.029; // 2.9%
  const stripeFeeFixed = 0.30; // $0.30
  
  const stripeFee = (amount * stripeFeePercentage) + stripeFeeFixed;
  const netAmount = amount - stripeFee;
  
  return {
    amount: amount,
    stripeFee: parseFloat(stripeFee.toFixed(2)),
    netAmount: parseFloat(netAmount.toFixed(2)),
    stripeFeePercentage: stripeFeePercentage * 100,
    stripeFeeFixed: stripeFeeFixed,
  };
}

/**
 * Convert dollars to cents
 * @param {number} dollars - Amount in dollars
 * @returns {number} Amount in cents
 */
function dollarsToCents(dollars) {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 * @param {number} cents - Amount in cents
 * @returns {number} Amount in dollars
 */
function centsToDollars(cents) {
  return parseFloat((cents / 100).toFixed(2));
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Connected Accounts
  createConnectedAccount,
  createAccountLink,
  retrieveAccount,
  updateAccount,
  deleteAccount,
  retrieveAccountBalance,

  // Customers
  createCustomer,
  retrieveCustomer,
  updateCustomer,
  deleteCustomer,

  // Payment Methods
  attachPaymentMethod,
  detachPaymentMethod,
  listPaymentMethods,

  // Payment Intents
  createPaymentIntent,
  retrievePaymentIntent,
  updatePaymentIntent,
  cancelPaymentIntent,
  confirmPaymentIntent,

  // Refunds
  createRefund,
  retrieveRefund,

  // Transfers
  createTransfer,
  retrieveTransfer,

  // Payouts
  createPayout,
  retrievePayout,
  listPayouts,

  // Webhooks
  verifyWebhookSignature,

  // Utilities
  calculateFees,
  dollarsToCents,
  centsToDollars,
};