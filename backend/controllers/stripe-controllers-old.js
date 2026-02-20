const fs = require("fs");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const HttpError = require("../models/http-error");
const User = require("../models/user");

const stripeService = require("../util/stripeservice");
//const onBoardStripe = require('../util/stripeservice');
//const StripeUser = require("../models/stripeuser");
//const StripeUserAccountLink = require("../models/stripeaccountlink");
const { StripeCustomer,
  StripeConnectedAccount,
  StripePaymentIntent,
  StripePayout,
  StripeWebhookEvent,
 } = require("../models/stripe-models");

const Contribution = require("../models/contribution");
const InvestmentEvent = require("../models/investment-event");

const createStAccount = async (req, res, next) => {
  console.log("CreaTE Stripe Account1", req.query.country);
  let accountLink;
  let account;
  let stripeuserdata = {};
  let userCountry = "";
  userCountry = req.query.country;
  let existingStripeUser;
  try {
    existingStripeUser = await StripeUser.findOne({
      email: req.userData.email,
    });
  } catch (err) {
    const error = new HttpError("Stripe User Not Found", 500);
    //return next(error);
  }

  if (existingStripeUser) {
    const exStUser = await stripeService.retrieveStripeAccountByAccountId(
      existingStripeUser.id
    );
    console.log("Existing Struoe ", exStUser);
    account = exStUser;
  } else {
    try {
      console.log("CreaTE Stripe Account2");
      stripeuserdata["email"] = req.userData.email;

      if(userCountry == "US"){
        stripeuserdata["country"] = "US";
        stripeuserdata["type"] = "express";
        stripeuserdata["requested_capabilities"] = ['card_payments', 'transfers'];
        stripeuserdata["business_type"] = "individual";
      }else{
        stripeuserdata["country"] = "IN";
        stripeuserdata["type"] = "standard";        
        stripeuserdata["business_type"] = "individual";
      }



      account = await stripeService.createStripeAccount(stripeuserdata);
      console.log("CreaTE Stripe Account5", account);
    } catch (err) {
      console.log("CreaTE Stripe Account3", err);
      const error = new HttpError(
        "Linking stripe account failed, please try again later.",
        500
      );
      return next(error);
    }

    try {
      console.log("CreaTE Stripe Account2= Link", account.id);
      accountLink = await stripeService.createStripeAccountLink(account.id);
      console.log("CreaTE Stripe Account Link 2");

      const newAccLink = new StripeUserAccountLink(accountLink);
      await newAccLink.save();
      console.log("CreaTE Stripe Account Link 3", newAccLink);
      account["accountlink"] = newAccLink._id;

      const newAcc = new StripeUser(account);
      const savedAcc = await newAcc.save();

      let existingUser;
      try {
        existingUser = await User.findOne({ email: account.email });
        console.log("CreaTE Stripe Account Link 3", existingUser);
        existingUser["stripeuser"] = savedAcc._id;

        await existingUser.save();

        console.log("CreaTE Stripe Account99");
      } catch (err) {
        const error = new HttpError(
          "Signing up failed, please try again later.",
          500
        );
        return next(error);
      }

      console.log("CreaTE Stripe Account3");
    } catch (err) {
      const error = new HttpError(
        "Linking stripe account failed, please try again later." + err,
        500
      );
      return next(error);
    }
  }

  res.json({
    account: account,
    accountLink: accountLink,
  });
};

// const onBoardedStripe = async (req, res, next) => {
//   console.log("Onboarded stripe");
//   let accountLink;
//   try {
//     accountLink = await stripeService.onBoardStripe();
//   } catch (err) {
//     const error = new HttpError(
//       "Linking stripe account failed, please try again later.",
//       500
//     );
//     return next(error);
//   }

//   res.json({
//     accountLink:
//       "Account created successfully! Close the browser and return to the app. Thanks!",
//   });
// };

const getStripeAccountByAccountId = async (req, res, next) => {
  console.log(
    "Get Stripe Account by account id stripe",
    req.params.stripeaccountid
  );
  let accountLink;
  try {
    //const stripeUser = await StripeUser.findById(req.params.stripeaccountid);
    let existingStripeUser;
    console.log("Stripe user");
    try {
      existingStripeUser = await StripeUser.findOne({
        _id: req.params.stripeaccountid,
      });
      console.log("Stripe user ret ", existingStripeUser);
    } catch (err) {
      const error = new HttpError("Stripe User Not Found", 500);
      //return next(error);
    }
    console.log("Existing stripe user ", existingStripeUser)
    accountLink = await stripeService.retrieveStripeAccountByAccountId(
      existingStripeUser.id
    );
  } catch (err) {
    const error = new HttpError(
      "Linking stripe account failed, please try again later." + err,
      500
    );
    return next(error);
  }

  res.json({
    accountLink: accountLink,
  });
};

const getStripeBalanceAccountId = async (req, res, next) => {
  console.log(
    "Get Stripe Account balance stripe id",
    req.params.stripeaccountid
  );
  let balance;
  try {
    //const stripeUser = await StripeUser.findById(req.params.stripeaccountid);
    let existingStripeUser;
    console.log("Stripe user");
    try {
      existingStripeUser = await StripeUser.findOne({
        _id: req.params.stripeaccountid,
      });
      console.log("Stripe user ret ", existingStripeUser.id);
    } catch (err) {
      const error = new HttpError("Stripe User Not Found", 500);
      //return next(error);
    }

    balance = await stripeService.retrieveStripeBalanceByAccountId(
      existingStripeUser.id
    );
  } catch (err) {
    const error = new HttpError(
      "Linking stripe account failed, please try again later." + err,
      500
    );
    return next(error);
  }

  res.json({
    balance: balance,
  });
};

const createStAccountCustom = async (req, res, next) => {
  console.log("CreaTE Stripe Custom Account1",req.body.email);
  let accountLink;
  let account;
  
  try {

    account = await stripeService.createStripeCustomAccount(req.body);

  } catch (err) {
    const error = new HttpError(
      "Linking custom stripe account failed, please try again later." + err,
      500
    );
  }

  try {
    console.log("CreaTE Stripe Account2= Link", account.id);
    accountLink = await stripeService.createStripeCustomAccountLink(account.id);
    console.log("CreaTE Stripe Account Link 2");

    const newAccLink = new StripeUserAccountLink(accountLink);
    await newAccLink.save();
    console.log("CreaTE Stripe Account Link 3", newAccLink);
    account["accountlink"] = newAccLink._id;

    const newAcc = new StripeUser(account);
    const savedAcc = await newAcc.save();

    let existingUser;
    try {
      existingUser = await User.findOne({ email: account.email });
      console.log("CreaTE Stripe Account Link 3", existingUser);
      existingUser["stripeuser"] = savedAcc._id;

      await existingUser.save();

      console.log("CreaTE Stripe Account99");
    } catch (err) {
      const error = new HttpError(
        "Signing up failed, please try again later.",
        500
      );
      return next(error);
    }

    console.log("CreaTE Stripe Account3");
  } catch (err) {
    const error = new HttpError(
      "Linking stripe account failed, please try again later." + err,
      500
    );
    return next(error);
  }

  res.json({
    account: account,
    accountLink: accountLink,
  });
};

// exports.createStAccount = createStAccount;
// exports.createStAccountCustom = createStAccountCustom;
// exports.onBoardedStripe = onBoardedStripe;
// exports.getStripeAccountByAccountId = getStripeAccountByAccountId;
// exports.getStripeBalanceAccountId = getStripeBalanceAccountId;

// ============================================
// CONNECTED ACCOUNT MANAGEMENT (For Recipients)
// ============================================

/**
 * Create Stripe Connected Account for receiving investment gifts
 * POST /api/stripe/create-connected-account
 */
const createConnectedAccount = async (req, res, next) => {
  const { country, accountType, businessType } = req.body;
  const userId = req.userData.userId;

  try {
    // Check if user already has a connected account
    let existingAccount = await StripeConnectedAccount.findOne({ user: userId });

    if (existingAccount) {
      // Retrieve latest status from Stripe
      const stripeAccount = await stripe.accounts.retrieve(
        existingAccount.stripeAccountId
      );

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
      }

      return res.json({
        account: stripeAccount,
        accountLink: accountLink,
        message: "Account already exists",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return next(new HttpError("User not found", 404));
    }

    // Prepare account data
    const accountData = {
      type: accountType || "express", // express, standard, or custom
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

    // Create Account Link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: stripeAccount.id,
      refresh_url: `${process.env.CLIENT_URL}/stripe/refresh`,
      return_url: `${process.env.CLIENT_URL}/stripe/onboarded`,
      type: "account_onboarding",
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

    // Update user with connected account reference
    user.stripeConnectedAccountId = stripeAccount.id;
    await user.save();

    res.status(201).json({
      account: stripeAccount,
      accountLink: accountLink,
      message: "Connected account created successfully",
    });
  } catch (error) {
    console.error("Create connected account error:", error);
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
  const { accountId } = req.params;
  const userId = req.userData.userId;

  try {
    // Find account in our database
    const connectedAccount = await StripeConnectedAccount.findOne({
      user: userId,
      _id: accountId,
    });

    if (!connectedAccount) {
      return next(new HttpError("Connected account not found", 404));
    }

    // Get latest status from Stripe
    const stripeAccount = await stripe.accounts.retrieve(
      connectedAccount.stripeAccountId
    );

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

    res.json({
      account: connectedAccount,
      stripeAccount: stripeAccount,
    });
  } catch (error) {
    console.error("Get account status error:", error);
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
  const { accountId } = req.body;
  const userId = req.userData.userId;

  try {
    const connectedAccount = await StripeConnectedAccount.findOne({
      user: userId,
      _id: accountId,
    });

    if (!connectedAccount) {
      return next(new HttpError("Connected account not found", 404));
    }

    // Create new account link
    const accountLink = await stripe.accountLinks.create({
      account: connectedAccount.stripeAccountId,
      refresh_url: `${process.env.CLIENT_URL}/stripe/refresh`,
      return_url: `${process.env.CLIENT_URL}/stripe/onboarded`,
      type: "account_onboarding",
    });

    // Update database
    connectedAccount.lastAccountLinkUrl = accountLink.url;
    connectedAccount.accountLinkExpiresAt = new Date(
      accountLink.expires_at * 1000
    );
    await connectedAccount.save();

    res.json({
      accountLink: accountLink,
    });
  } catch (error) {
    console.error("Refresh account link error:", error);
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
  const { accountId } = req.params;
  const userId = req.userData.userId;

  try {
    const connectedAccount = await StripeConnectedAccount.findOne({
      user: userId,
      _id: accountId,
    });

    if (!connectedAccount) {
      return next(new HttpError("Connected account not found", 404));
    }

    // Get balance from Stripe
    const balance = await stripe.balance.retrieve({
      stripeAccount: connectedAccount.stripeAccountId,
    });

    // Update our database
    connectedAccount.balance = {
      available: balance.available[0]?.amount || 0,
      pending: balance.pending[0]?.amount || 0,
      currency: balance.available[0]?.currency || "usd",
      lastUpdated: new Date(),
    };

    await connectedAccount.save();

    res.json({
      balance: balance,
    });
  } catch (error) {
    console.error("Get balance error:", error);
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
  const userId = req.userData.userId;

  try {
    // Check if customer already exists
    let customer = await StripeCustomer.findOne({ user: userId });

    if (customer) {
      // Retrieve latest from Stripe
      const stripeCustomer = await stripe.customers.retrieve(
        customer.stripeCustomerId
      );

      return res.json({
        customer: stripeCustomer,
        message: "Customer already exists",
      });
    }

    // Get user details
    const user = await User.findById(userId);
    if (!user) {
      return next(new HttpError("User not found", 404));
    }

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

    // Update user
    user.stripeCustomerId = stripeCustomer.id;
    await user.save();

    res.status(201).json({
      customer: stripeCustomer,
      message: "Customer created successfully",
    });
  } catch (error) {
    console.error("Get/Create customer error:", error);
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
  const { paymentMethodId } = req.body;
  const userId = req.userData.userId;

  try {
    const customer = await StripeCustomer.findOne({ user: userId });

    if (!customer) {
      return next(new HttpError("Customer not found", 404));
    }

    // Attach payment method to customer
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customer.stripeCustomerId,
    });

    // Set as default if this is the first payment method
    if (!customer.defaultPaymentMethod) {
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

    res.json({
      paymentMethod: paymentMethod,
      message: "Payment method added successfully",
    });
  } catch (error) {
    console.error("Add payment method error:", error);
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
  const { eventId, amount, message, isAnonymous } = req.body;
  const userId = req.userData.userId;

  try {
    // Validate amount
    if (!amount || amount < 1) {
      return next(new HttpError("Invalid contribution amount", 400));
    }

    // Get or create customer
    let customer = await StripeCustomer.findOne({ user: userId });
    if (!customer) {
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
    }

    // Get event details
    const event = await InvestmentEvent.findById(eventId);
    if (!event) {
      return next(new HttpError("Investment event not found", 404));
    }

    // Calculate fees
    const stripeFee = amount * 0.029 + 0.3; // 2.9% + $0.30
    const applicationFee = 0; // Platform fee (if any)
    const netAmount = amount - stripeFee - applicationFee;

    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
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

    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      contributionId: contribution._id,
    });
  } catch (error) {
    console.error("Create payment intent error:", error);
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
  const { paymentIntentId } = req.body;

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
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
      return next(new HttpError("Payment record not found", 404));
    }

    // Update contribution
    const contribution = await Contribution.findByIdAndUpdate(
      paymentRecord.contribution,
      {
        "paymentDetails.status": "succeeded",
      },
      { new: true }
    );

    // Update event
    const event = await InvestmentEvent.findById(contribution.event);
    event.currentAmount += contribution.amount;
    event.contributors.push({
      user: contribution.contributor,
      amount: contribution.amount,
      contributedAt: new Date(),
      stripePaymentId: paymentIntentId,
      message: contribution.message,
      isAnonymous: contribution.isAnonymous,
    });

    // Check if event is fully funded
    if (event.currentAmount >= event.targetAmount && event.status === "active") {
      event.status = "funded";
      // TODO: Trigger stock purchase workflow
    }

    await event.save();

    // Update user statistics
    const user = await User.findById(contribution.contributor);
    await user.updateContributionStats(contribution.amount);

    res.json({
      success: true,
      contribution,
      event,
      message: "Payment confirmed successfully",
    });
  } catch (error) {
    console.error("Confirm payment error:", error);
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
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
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

  // Handle different event types
  try {
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;

      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;

      case "account.updated":
        await handleAccountUpdated(event.data.object);
        break;

      case "payout.paid":
        await handlePayoutPaid(event.data.object);
        break;

      case "payout.failed":
        await handlePayoutFailed(event.data.object);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Mark webhook as processed
    webhookEvent.processed = true;
    webhookEvent.processedAt = new Date();
    await webhookEvent.save();
  } catch (error) {
    console.error("Webhook processing error:", error);
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
  console.log("Payment succeeded:", paymentIntent.id);

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
  }
}

async function handlePaymentIntentFailed(paymentIntent) {
  console.log("Payment failed:", paymentIntent.id);

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
  }
}

async function handleAccountUpdated(account) {
  console.log("Account updated:", account.id);

  await StripeConnectedAccount.findOneAndUpdate(
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
}

async function handlePayoutPaid(payout) {
  console.log("Payout paid:", payout.id);

  await StripePayout.findOneAndUpdate(
    { payoutId: payout.id },
    {
      status: "paid",
      paidAt: new Date(payout.arrival_date * 1000),
    }
  );
}

async function handlePayoutFailed(payout) {
  console.log("Payout failed:", payout.id);

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
  res.json({
    message:
      "Account created successfully! Close the browser and return to the app. Thanks!",
  });
};

module.exports = {
  //Old
  createStAccount,
  createStAccountCustom,
  getStripeAccountByAccountId,
  getStripeBalanceAccountId,

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
