const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const logger = require("../util/logger"); // Winston logger

const HttpError = require("../models/http-error");
const User = require("../models/user");
const {
  StripeCustomer,
  StripeConnectedAccount,
  StripePaymentIntent,
  StripePayout,
  StripeWebhookEvent,
} = require("../models/stripe-models");
const Contribution = require("../models/contribution");
const InvestmentEvent = require("../models/investment-event");

// ============================================
// CONNECTED ACCOUNT MANAGEMENT (For Recipients)
// ============================================

/**
 * Create Stripe Connected Account for receiving investment gifts
 * POST /api/stripe/create-connected-account
 */
const createConnectedAccount = async (req, res, next) => {
  const startTime = Date.now();
  const { country, accountType, businessType } = req.body;
  const userId = req.userData.userId;

  logger.info("createConnectedAccount - START", {
    userId,
    country,
    accountType,
    businessType,
    requestId: req.id,
  });

  try {
    // Check if user already has a connected account
    let existingAccount = await StripeConnectedAccount.findOne({ user: userId });

    if (existingAccount) {
      logger.info("Existing connected account found", {
        userId,
        accountId: existingAccount.stripeAccountId,
        onboardingStatus: existingAccount.onboardingStatus,
      });

      // Retrieve latest status from Stripe
      const stripeAccount = await stripe.accounts.retrieve(
        existingAccount.stripeAccountId
      );

      logger.debug("Retrieved Stripe account details", {
        accountId: stripeAccount.id,
        chargesEnabled: stripeAccount.charges_enabled,
        payoutsEnabled: stripeAccount.payouts_enabled,
        detailsSubmitted: stripeAccount.details_submitted,
      });

      // Update our database with latest info
      existingAccount.chargesEnabled = stripeAccount.charges_enabled;
      existingAccount.payoutsEnabled = stripeAccount.payouts_enabled;
      existingAccount.detailsSubmitted = stripeAccount.details_submitted;
      existingAccount.onboardingStatus = stripeAccount.details_submitted
        ? "completed"
        : "in-progress";

      await existingAccount.save();

      // Create new account link if onboarding not complete
      let accountLink = null;
      if (!stripeAccount.details_submitted) {
        logger.info("Creating new account link for incomplete onboarding", {
          accountId: stripeAccount.id,
        });

        accountLink = await stripe.accountLinks.create({
          account: stripeAccount.id,
          refresh_url: `${process.env.CLIENT_URL}/stripe/refresh`,
          return_url: `${process.env.CLIENT_URL}/stripe/onboarded`,
          type: "account_onboarding",
        });

        existingAccount.lastAccountLinkUrl = accountLink.url;
        existingAccount.accountLinkExpiresAt = new Date(
          accountLink.expires_at * 1000
        );
        await existingAccount.save();

        logger.debug("Account link created", {
          expiresAt: accountLink.expires_at,
        });
      }

      const duration = Date.now() - startTime;
      logger.info("createConnectedAccount - SUCCESS (existing account)", {
        userId,
        accountId: stripeAccount.id,
        duration: `${duration}ms`,
      });

      return res.json({
        account: stripeAccount,
        accountLink: accountLink,
        message: "Account already exists",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      logger.error("User not found", { userId });
      return next(new HttpError("User not found", 404));
    }

    logger.debug("Creating new Stripe Connected Account", {
      email: user.email,
      country,
      accountType,
    });

    // Prepare account data
    const accountData = {
      type: accountType || "express",
      country: country || "US",
      email: user.email,
      business_type: businessType || "individual",
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
    };

    // Create Stripe Connected Account
    const stripeAccount = await stripe.accounts.create(accountData);
    logger.info("Stripe account created successfully", {
      accountId: stripeAccount.id,
      email: stripeAccount.email,
      type: stripeAccount.type,
    });

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: `${process.env.CLIENT_URL}/stripe/refresh`,
      return_url: `${process.env.CLIENT_URL}/stripe/onboarded`,
      type: "account_onboarding",
    });

    logger.debug("Account link created", {
      accountId: stripeAccount.id,
      expiresAt: accountLink.expires_at,
    });

    // Save to our database
    const connectedAccount = new StripeConnectedAccount({
      user: userId,
      stripeAccountId: stripeAccount.id,
      accountType: stripeAccount.type,
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      detailsSubmitted: stripeAccount.details_submitted,

      requirements: {
        currentlyDue: stripeAccount.requirements?.currently_due || [],
        eventuallyDue: stripeAccount.requirements?.eventually_due || [],
        pastDue: stripeAccount.requirements?.past_due || [],
        pendingVerification: stripeAccount.requirements?.pending_verification || [],
        errors: stripeAccount.requirements?.errors || [],
      },

      businessProfile: {
        name: stripeAccount.business_profile?.name,
        productDescription: stripeAccount.business_profile?.product_description,
        supportEmail: stripeAccount.business_profile?.support_email,
        supportPhone: stripeAccount.business_profile?.support_phone,
      },

      capabilities: {
        cardPayments: stripeAccount.capabilities?.card_payments || "inactive",
        transfers: stripeAccount.capabilities?.transfers || "inactive",
      },

      onboardingStatus: stripeAccount.details_submitted
        ? "completed"
        : "in-progress",

      lastAccountLinkUrl: accountLink.url,
      accountLinkExpiresAt: new Date(accountLink.expires_at * 1000),
    });

    await connectedAccount.save();
    logger.info("Connected account saved to database", {
      connectedAccountId: connectedAccount._id,
      accountId: stripeAccount.id,
    });

    // Update user with connected account reference
    user.stripeConnectedAccountId = stripeAccount.id;
    await user.save();

    logger.debug("User updated with connected account ID", {
      userId,
      stripeConnectedAccountId: stripeAccount.id,
    });

    const duration = Date.now() - startTime;
    logger.info("createConnectedAccount - SUCCESS (new account)", {
      userId,
      accountId: stripeAccount.id,
      duration: `${duration}ms`,
    });

    res.status(201).json({
      account: stripeAccount,
      accountLink: accountLink,
      message: "Connected account created successfully",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("createConnectedAccount - ERROR", {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError(
        "Failed to create connected account: " + error.message,
        500
      )
    );
  }
};

/**
 * Get Connected Account Status
 * GET /api/stripe/account-status/:accountId
 */
const getAccountStatus = async (req, res, next) => {
  const startTime = Date.now();
  const { accountId } = req.params;
  const userId = req.userData.userId;

  logger.info("getAccountStatus - START", {
    userId,
    accountId,
    requestId: req.id,
  });

  try {
    // Find account in our database
    const connectedAccount = await StripeConnectedAccount.findOne({
      user: userId,
      _id: accountId,
    });

    if (!connectedAccount) {
      logger.warn("Connected account not found", { userId, accountId });
      return next(new HttpError("Connected account not found", 404));
    }

    logger.debug("Connected account found in database", {
      stripeAccountId: connectedAccount.stripeAccountId,
      onboardingStatus: connectedAccount.onboardingStatus,
    });

    // Get latest status from Stripe
    const stripeAccount = await stripe.accounts.retrieve(
      connectedAccount.stripeAccountId
    );

    logger.debug("Retrieved account status from Stripe", {
      chargesEnabled: stripeAccount.charges_enabled,
      payoutsEnabled: stripeAccount.payouts_enabled,
      detailsSubmitted: stripeAccount.details_submitted,
      requirementsCount: stripeAccount.requirements?.currently_due?.length || 0,
    });

    // Update our database
    connectedAccount.chargesEnabled = stripeAccount.charges_enabled;
    connectedAccount.payoutsEnabled = stripeAccount.payouts_enabled;
    connectedAccount.detailsSubmitted = stripeAccount.details_submitted;

    connectedAccount.requirements = {
      currentlyDue: stripeAccount.requirements?.currently_due || [],
      eventuallyDue: stripeAccount.requirements?.eventually_due || [],
      pastDue: stripeAccount.requirements?.past_due || [],
      pendingVerification: stripeAccount.requirements?.pending_verification || [],
      errors: stripeAccount.requirements?.errors || [],
    };

    connectedAccount.onboardingStatus = stripeAccount.details_submitted
      ? "completed"
      : stripeAccount.requirements?.currently_due.length > 0
      ? "requires-action"
      : "in-progress";

    await connectedAccount.save();

    const duration = Date.now() - startTime;
    logger.info("getAccountStatus - SUCCESS", {
      userId,
      accountId,
      onboardingStatus: connectedAccount.onboardingStatus,
      duration: `${duration}ms`,
    });

    res.json({
      account: connectedAccount,
      stripeAccount: stripeAccount,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("getAccountStatus - ERROR", {
      userId,
      accountId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError("Failed to retrieve account status: " + error.message, 500)
    );
  }
};

/**
 * Refresh Account Link (if expired)
 * POST /api/stripe/refresh-account-link
 */
const refreshAccountLink = async (req, res, next) => {
  const startTime = Date.now();
  const { accountId } = req.body;
  const userId = req.userData.userId;

  logger.info("refreshAccountLink - START", {
    userId,
    accountId,
    requestId: req.id,
  });

  try {
    const connectedAccount = await StripeConnectedAccount.findOne({
      user: userId,
      _id: accountId,
    });

    if (!connectedAccount) {
      logger.warn("Connected account not found for refresh", {
        userId,
        accountId,
      });
      return next(new HttpError("Connected account not found", 404));
    }

    logger.debug("Creating new account link", {
      stripeAccountId: connectedAccount.stripeAccountId,
    });

    // Create new account link
    const accountLink = await stripe.accountLinks.create({
      account: connectedAccount.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/stripe/refresh`,
      return_url: `${process.env.CLIENT_URL}/stripe/onboarded`,
      type: "account_onboarding",
    });

    logger.debug("New account link created", {
      expiresAt: accountLink.expires_at,
    });

    // Update database
    connectedAccount.lastAccountLinkUrl = accountLink.url;
    connectedAccount.accountLinkExpiresAt = new Date(
      accountLink.expires_at * 1000
    );
    await connectedAccount.save();

    const duration = Date.now() - startTime;
    logger.info("refreshAccountLink - SUCCESS", {
      userId,
      accountId,
      duration: `${duration}ms`,
    });

    res.json({
      accountLink: accountLink,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("refreshAccountLink - ERROR", {
      userId,
      accountId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError("Failed to refresh account link: " + error.message, 500)
    );
  }
};

/**
 * Get Account Balance
 * GET /api/stripe/balance/:accountId
 */
const getAccountBalance = async (req, res, next) => {
  const startTime = Date.now();
  const { accountId } = req.params;
  const userId = req.userData.userId;

  logger.info("getAccountBalance - START", {
    userId,
    accountId,
    requestId: req.id,
  });

  try {
    const connectedAccount = await StripeConnectedAccount.findOne({
      user: userId,
      _id: accountId,
    });

    if (!connectedAccount) {
      logger.warn("Connected account not found for balance check", {
        userId,
        accountId,
      });
      return next(new HttpError("Connected account not found", 404));
    }

    logger.debug("Retrieving balance from Stripe", {
      stripeAccountId: connectedAccount.stripeAccountId,
    });

    // Get balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccount.stripeAccountId,
    });

    logger.debug("Balance retrieved", {
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
      currency: balance.available[0]?.currency || "usd",
    });

    // Update our database
    connectedAccount.balance = {
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
      currency: balance.available[0]?.currency || "usd",
      lastUpdated: new Date(),
    };

    await connectedAccount.save();

    const duration = Date.now() - startTime;
    logger.info("getAccountBalance - SUCCESS", {
      userId,
      accountId,
      available: balance.available[0]?.amount || 0,
      duration: `${duration}ms`,
    });

    res.json({
      balance: balance,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("getAccountBalance - ERROR", {
      userId,
      accountId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError("Failed to retrieve balance: " + error.message, 500)
    );
  }
};

// ============================================
// CUSTOMER MANAGEMENT (For Contributors)
// ============================================

/**
 * Get or Create Stripe Customer
 * POST /api/stripe/customer
 */
const getOrCreateCustomer = async (req, res, next) => {
  const startTime = Date.now();
  const userId = req.userData.userId;

  logger.info("getOrCreateCustomer - START", {
    userId,
    requestId: req.id,
  });

  try {
    // Check if customer already exists
    let customer = await StripeCustomer.findOne({ user: userId });

    if (customer) {
      logger.info("Existing Stripe customer found", {
        userId,
        customerId: customer.stripeCustomerId,
      });

      // Retrieve latest from Stripe
      const stripeCustomer = await stripe.customers.retrieve(
        customer.stripeCustomerId
      );

      const duration = Date.now() - startTime;
      logger.info("getOrCreateCustomer - SUCCESS (existing)", {
        userId,
        customerId: stripeCustomer.id,
        duration: `${duration}ms`,
      });

      return res.json({
        customer: stripeCustomer,
        message: "Customer already exists",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      logger.error("User not found for customer creation", { userId });
      return next(new HttpError("User not found", 404));
    }

    logger.debug("Creating new Stripe customer", {
      email: user.email,
      name: `${user.fname} ${user.lname}`,
    });

    // Create Stripe customer
    const stripeCustomer = await stripe.customers.create({
      email: user.email,
      name: `${user.fname} ${user.lname}`,
      phone: user.phoneno,
      address: user.address
        ? {
            line1: user.address.street,
            line2: user.address.unit,
            city: user.address.city,
            state: user.address.state,
            postal_code: user.address.postalcode,
            country: user.address.country || "US",
          }
        : undefined,
      metadata: {
        userId: userId.toString(),
      },
    });

    logger.info("Stripe customer created", {
      customerId: stripeCustomer.id,
      email: stripeCustomer.email,
    });

    // Save to database
    customer = new StripeCustomer({
      user: userId,
      stripeCustomerId: stripeCustomer.id,
      email: user.email,
      name: `${user.fname} ${user.lname}`,
      billingAddress: user.address
        ? {
            line1: user.address.street,
            line2: user.address.unit,
            city: user.address.city,
            state: user.address.state,
            postalCode: user.address.postalcode,
            country: user.address.country || "US",
          }
        : undefined,
    });

    await customer.save();
    logger.debug("Customer saved to database", {
      customerDbId: customer._id,
    });

    // Update user
    user.stripeCustomerId = stripeCustomer.id;
    await user.save();

    const duration = Date.now() - startTime;
    logger.info("getOrCreateCustomer - SUCCESS (new)", {
      userId,
      customerId: stripeCustomer.id,
      duration: `${duration}ms`,
    });

    res.status(201).json({
      customer: stripeCustomer,
      message: "Customer created successfully",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("getOrCreateCustomer - ERROR", {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError("Failed to create customer: " + error.message, 500)
    );
  }
};

/**
 * Add Payment Method
 * POST /api/stripe/payment-method
 */
const addPaymentMethod = async (req, res, next) => {
  const startTime = Date.now();
  const { paymentMethodId } = req.body;
  const userId = req.userData.userId;

  logger.info("addPaymentMethod - START", {
    userId,
    paymentMethodId,
    requestId: req.id,
  });

  try {
    const customer = await StripeCustomer.findOne({ user: userId });

    if (!customer) {
      logger.warn("Customer not found for payment method", { userId });
      return next(new HttpError("Customer not found", 404));
    }

    logger.debug("Attaching payment method to customer", {
      paymentMethodId,
      customerId: customer.stripeCustomerId,
    });

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.stripeCustomerId,
    });

    logger.info("Payment method attached", {
      paymentMethodId: paymentMethod.id,
      type: paymentMethod.type,
      last4: paymentMethod.card?.last4,
    });

    // Set as default if this is the first payment method
    if (!customer.defaultPaymentMethod) {
      logger.debug("Setting as default payment method", { paymentMethodId });

      await stripe.customers.update(customer.stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      customer.defaultPaymentMethod = paymentMethodId;
    }

    // Add to our database
    customer.paymentMethods.push({
      id: paymentMethod.id,
      type: paymentMethod.type,
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      expMonth: paymentMethod.card?.exp_month,
      expYear: paymentMethod.card?.exp_year,
      isDefault: !customer.defaultPaymentMethod,
    });

    await customer.save();

    const duration = Date.now() - startTime;
    logger.info("addPaymentMethod - SUCCESS", {
      userId,
      paymentMethodId,
      isDefault: !customer.defaultPaymentMethod,
      duration: `${duration}ms`,
    });

    res.json({
      paymentMethod: paymentMethod,
      message: "Payment method added successfully",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("addPaymentMethod - ERROR", {
      userId,
      paymentMethodId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError("Failed to add payment method: " + error.message, 500)
    );
  }
};

// ============================================
// CONTRIBUTION PAYMENTS
// ============================================

/**
 * Create Payment Intent for Contribution
 * POST /api/stripe/create-payment-intent
 */
const createPaymentIntent = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId, amount, message, isAnonymous } = req.body;
  const userId = req.userData.userId;

  logger.info("createPaymentIntent - START", {
    userId,
    eventId,
    amount,
    isAnonymous,
    requestId: req.id,
  });

  try {
    // Validate amount
    if (!amount || amount < 1) {
      logger.warn("Invalid contribution amount", { amount, userId });
      return next(new HttpError("Invalid contribution amount", 400));
    }

    // Get or create customer
    let customer = await StripeCustomer.findOne({ user: userId });
    if (!customer) {
      logger.debug("Customer not found, creating new one", { userId });

      const user = await User.findById(userId);
      const stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: `${user.fname} ${user.lname}`,
        metadata: { userId: userId.toString() },
      });

      customer = new StripeCustomer({
        user: userId,
        stripeCustomerId: stripeCustomer.id,
        email: user.email,
        name: `${user.fname} ${user.lname}`,
      });
      await customer.save();

      user.stripeCustomerId = stripeCustomer.id;
      await user.save();

      logger.info("New customer created", { customerId: stripeCustomer.id });
    }

    // Get event details
    const event = await InvestmentEvent.findById(eventId);
    if (!event) {
      logger.error("Investment event not found", { eventId, userId });
      return next(new HttpError("Investment event not found", 404));
    }

    logger.debug("Event found", {
      eventId,
      eventTitle: event.eventTitle,
      currentAmount: event.currentAmount,
      targetAmount: event.targetAmount,
    });

    // Calculate fees
    const stripeFee = amount * 0.029 + 0.3;
    const applicationFee = 0;
    const netAmount = amount - stripeFee - applicationFee;

    logger.debug("Fee calculation", {
      amount,
      stripeFee: stripeFee.toFixed(2),
      netAmount: netAmount.toFixed(2),
    });

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: "usd",
      customer: customer.stripeCustomerId,
      payment_method_types: ["card"],
      metadata: {
        eventId: eventId.toString(),
        userId: userId.toString(),
        type: "investment_contribution",
        eventTitle: event.eventTitle,
      },
    });

    logger.info("Payment intent created", {
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount,
      status: paymentIntent.status,
    });

    // Create contribution record
    const contribution = new Contribution({
      event: eventId,
      contributor: userId,
      amount: amount,
      paymentDetails: {
        stripePaymentIntentId: paymentIntent.id,
        status: "pending",
        fees: stripeFee,
        netAmount: netAmount,
        currency: "usd",
      },
      message: message || "",
      isAnonymous: isAnonymous || false,
    });

    await contribution.save();
    logger.debug("Contribution record created", {
      contributionId: contribution._id,
    });

    // Create payment intent record
    const paymentIntentRecord = new StripePaymentIntent({
      contribution: contribution._id,
      event: eventId,
      contributor: userId,
      paymentIntentId: paymentIntent.id,
      amount: Math.round(amount * 100),
      currency: "usd",
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      fees: {
        stripeFee: Math.round(stripeFee * 100),
        applicationFee: Math.round(applicationFee * 100),
        netAmount: Math.round(netAmount * 100),
      },
      metadata: {
        eventTitle: event.eventTitle,
        contributorMessage: message,
        isAnonymous: isAnonymous || false,
      },
    });

    await paymentIntentRecord.save();
    logger.debug("Payment intent record saved", {
      recordId: paymentIntentRecord._id,
    });

    const duration = Date.now() - startTime;
    logger.info("createPaymentIntent - SUCCESS", {
      userId,
      eventId,
      paymentIntentId: paymentIntent.id,
      contributionId: contribution._id,
      amount,
      duration: `${duration}ms`,
    });

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      contributionId: contribution._id,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("createPaymentIntent - ERROR", {
      userId,
      eventId,
      amount,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError("Failed to create payment intent: " + error.message, 500)
    );
  }
};

/**
 * Confirm Payment (after successful payment on frontend)
 * POST /api/stripe/confirm-payment
 */
const confirmPayment = async (req, res, next) => {
  const startTime = Date.now();
  const { paymentIntentId } = req.body;

  logger.info("confirmPayment - START", {
    paymentIntentId,
    requestId: req.id,
  });

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    logger.debug("Payment intent retrieved from Stripe", {
      paymentIntentId,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
    });

    if (paymentIntent.status !== "succeeded") {
      logger.warn("Payment not completed", {
        paymentIntentId,
        status: paymentIntent.status,
      });
      return next(new HttpError("Payment not completed", 400));
    }

    // Update payment intent record
    const paymentRecord = await StripePaymentIntent.findOneAndUpdate(
      { paymentIntentId },
      {
        status: "succeeded",
        succeededAt: new Date(),
        amountReceived: paymentIntent.amount_received,
      },
      { new: true }
    );

    if (!paymentRecord) {
      logger.error("Payment record not found in database", { paymentIntentId });
      return next(new HttpError("Payment record not found", 404));
    }

    logger.debug("Payment record updated", {
      recordId: paymentRecord._id,
      amountReceived: paymentIntent.amount_received,
    });

    // Update contribution
    const contribution = await Contribution.findByIdAndUpdate(
      paymentRecord.contribution,
      {
        "paymentDetails.status": "succeeded",
      },
      { new: true }
    );

    logger.info("Contribution marked as succeeded", {
      contributionId: contribution._id,
      eventId: contribution.event,
      amount: contribution.amount,
    });

    // Update event
    const event = await InvestmentEvent.findById(contribution.event);
    const previousAmount = event.currentAmount;
    event.currentAmount += contribution.amount;
    event.contributors.push({
      user: contribution.contributor,
      amount: contribution.amount,
      contributedAt: new Date(),
      stripePaymentId: paymentIntentId,
      message: contribution.message,
      isAnonymous: contribution.isAnonymous,
    });

    logger.debug("Event updated with contribution", {
      eventId: event._id,
      previousAmount,
      newAmount: event.currentAmount,
      targetAmount: event.targetAmount,
    });

    // Check if event is fully funded
    if (event.currentAmount >= event.targetAmount && event.status === "active") {
      event.status = "funded";
      logger.info("Event fully funded!", {
        eventId: event._id,
        finalAmount: event.currentAmount,
        targetAmount: event.targetAmount,
      });
      // TODO: Trigger stock purchase workflow
    }

    await event.save();

    // Update user statistics
    const user = await User.findById(contribution.contributor);
    await user.updateContributionStats(contribution.amount);

    logger.debug("User statistics updated", {
      userId: user._id,
      totalGiftsGiven: user.investmentProfile.totalGiftsGiven,
      totalAmountGiven: user.investmentProfile.totalAmountGiven,
    });

    const duration = Date.now() - startTime;
    logger.info("confirmPayment - SUCCESS", {
      paymentIntentId,
      contributionId: contribution._id,
      eventId: event._id,
      eventStatus: event.status,
      duration: `${duration}ms`,
    });

    res.json({
      success: true,
      contribution,
      event,
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("confirmPayment - ERROR", {
      paymentIntentId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError("Failed to confirm payment: " + error.message, 500)
    );
  }
};

// ============================================
// WEBHOOK HANDLING
// ============================================

/**
 * Handle Stripe Webhooks
 * POST /api/stripe/webhook
 */
const handleWebhook = async (req, res, next) => {
  const startTime = Date.now();
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  logger.info("handleWebhook - START", {
    signature: sig ? "present" : "missing",
  });

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    logger.info("Webhook signature verified", {
      eventId: event.id,
      eventType: event.type,
    });
  } catch (err) {
    logger.error("Webhook signature verification failed", {
      error: err.message,
    });
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Log webhook event
  const webhookEvent = new StripeWebhookEvent({
    eventId: event.id,
    type: event.type,
    data: event.data,
    apiVersion: event.api_version,
    livemode: event.livemode,
  });

  await webhookEvent.save();
  logger.debug("Webhook event saved to database", {
    webhookDbId: webhookEvent._id,
    eventType: event.type,
  });

  // Handle different event types
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        logger.info("Processing payment_intent.succeeded", {
          paymentIntentId: event.data.object.id,
        });
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        logger.info("Processing payment_intent.payment_failed", {
          paymentIntentId: event.data.object.id,
        });
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "account.updated":
        logger.info("Processing account.updated", {
          accountId: event.data.object.id,
        });
        await handleAccountUpdated(event.data.object);
        break;

      case "payout.paid":
        logger.info("Processing payout.paid", {
          payoutId: event.data.object.id,
        });
        await handlePayoutPaid(event.data.object);
        break;

      case "payout.failed":
        logger.info("Processing payout.failed", {
          payoutId: event.data.object.id,
        });
        await handlePayoutFailed(event.data.object);
        break;

      default:
        logger.debug("Unhandled webhook event type", { type: event.type });
    }

    // Mark webhook as processed
    webhookEvent.processed = true;
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();

    const duration = Date.now() - startTime;
    logger.info("handleWebhook - SUCCESS", {
      eventId: event.id,
      eventType: event.type,
      duration: `${duration}ms`,
    });
  } catch (error) {
    logger.error("Webhook processing error", {
      eventId: event.id,
      eventType: event.type,
      error: error.message,
      stack: error.stack,
    });

    webhookEvent.processingError = {
      message: error.message,
      stack: error.stack,
      attempts: (webhookEvent.processingError?.attempts || 0) + 1,
    };
    await webhookEvent.save();
  }

  res.json({ received: true });
};

// Webhook event handlers
async function handlePaymentIntentSucceeded(paymentIntent) {
  logger.info("handlePaymentIntentSucceeded", {
    paymentIntentId: paymentIntent.id,
    amount: paymentIntent.amount,
  });

  const paymentRecord = await StripePaymentIntent.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: "succeeded",
      succeededAt: new Date(),
      amountReceived: paymentIntent.amount_received,
    }
  );

  if (paymentRecord) {
    await Contribution.findByIdAndUpdate(paymentRecord.contribution, {
      "paymentDetails.status": "succeeded",
    });
    logger.debug("Payment and contribution updated", {
      contributionId: paymentRecord.contribution,
    });
  } else {
    logger.warn("Payment record not found for succeeded intent", {
      paymentIntentId: paymentIntent.id,
    });
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  logger.warn("handlePaymentIntentFailed", {
    paymentIntentId: paymentIntent.id,
    errorCode: paymentIntent.last_payment_error?.code,
    errorMessage: paymentIntent.last_payment_error?.message,
  });

  const paymentRecord = await StripePaymentIntent.findOneAndUpdate(
    { paymentIntentId: paymentIntent.id },
    {
      status: "failed",
      failedAt: new Date(),
      lastPaymentError: {
        code: paymentIntent.last_payment_error?.code,
        message: paymentIntent.last_payment_error?.message,
        type: paymentIntent.last_payment_error?.type,
      },
    }
  );

  if (paymentRecord) {
    await Contribution.findByIdAndUpdate(paymentRecord.contribution, {
      "paymentDetails.status": "failed",
    });
    logger.debug("Payment and contribution marked as failed", {
      contributionId: paymentRecord.contribution,
    });
  }
}

async function handleAccountUpdated(account) {
  logger.info("handleAccountUpdated", {
    accountId: account.id,
    detailsSubmitted: account.details_submitted,
  });

  const updated = await StripeConnectedAccount.findOneAndUpdate(
    { stripeAccountId: account.id },
    {
      chargesEnabled: account.charges_enabled,
      payoutsEnabled: account.payouts_enabled,
      detailsSubmitted: account.details_submitted,
      "requirements.currentlyDue": account.requirements?.currently_due || [],
      "requirements.eventuallyDue": account.requirements?.eventually_due || [],
      onboardingStatus: account.details_submitted ? "completed" : "in-progress",
    }
  );

  if (updated) {
    logger.debug("Connected account updated", {
      accountDbId: updated._id,
      onboardingStatus: updated.onboardingStatus,
    });
  }
}

async function handlePayoutPaid(payout) {
  logger.info("handlePayoutPaid", {
    payoutId: payout.id,
    amount: payout.amount,
    arrivalDate: payout.arrival_date,
  });

  await StripePayout.findOneAndUpdate(
    { payoutId: payout.id },
    {
      status: "paid",
      paidAt: new Date(payout.arrival_date * 1000),
    }
  );
}

async function handlePayoutFailed(payout) {
  logger.error("handlePayoutFailed", {
    payoutId: payout.id,
    failureCode: payout.failure_code,
    failureMessage: payout.failure_message,
  });

  await StripePayout.findOneAndUpdate(
    { payoutId: payout.id },
    {
      status: "failed",
      failedAt: new Date(),
      failureCode: payout.failure_code,
      failureMessage: payout.failure_message,
    }
  );
}

// ============================================
// LEGACY SUPPORT (For Migration)
// ============================================

/**
 * Onboarding Complete Redirect
 * GET /api/stripe/onboarded
 */
const onBoardedStripe = async (req, res, next) => {
  logger.info("onBoardedStripe - Redirect endpoint hit");

  res.json({
    message:
      "Account created successfully! Close the browser and return to the app. Thanks!",
  });
};

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Connected Account (Recipients)
  createConnectedAccount,
  getAccountStatus,
  refreshAccountLink,
  getAccountBalance,

  // Customer (Contributors)
  getOrCreateCustomer,
  addPaymentMethod,

  // Payments
  createPaymentIntent,
  confirmPayment,

  // Webhooks
  handleWebhook,

  // Legacy
  onBoardedStripe,
};
