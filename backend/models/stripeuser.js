const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stripeUserSchema = new Schema({
  // Link to main User
  user: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true 
  },
  
  // Stripe Customer (for making payments/contributions)
  stripeCustomer: {
    customerId: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    email: { type: String },
    created: { type: Date },
    defaultPaymentMethod: { type: String }, // Payment method ID
    
    // Customer details
    name: { type: String },
    phone: { type: String },
    address: {
      line1: String,
      line2: String,
      city: String,
      state: String,
      postal_code: String,
      country: String
    },
    
    // Billing information
    billingDetails: {
      name: String,
      email: String,
      phone: String
    }
  },
  
  // Stripe Connect Account (for receiving funds)
  stripeConnectAccount: {
    accountId: { 
      type: String, 
      unique: true, 
      sparse: true 
    },
    
    // Account type
    accountType: {
      type: String,
      enum: ['standard', 'express', 'custom'],
      default: 'express'
    },
    
    // Account status
    detailsSubmitted: { type: Boolean, default: false },
    chargesEnabled: { type: Boolean, default: false },
    payoutsEnabled: { type: Boolean, default: false },
    
    // Verification status
    requirements: {
      currentlyDue: [String],
      eventuallyDue: [String],
      pastDue: [String],
      pendingVerification: [String],
      disabled: { type: Boolean, default: false },
      disabledReason: String
    },
    
    // Business information
    businessType: {
      type: String,
      enum: ['individual', 'company', 'non_profit', 'government_entity']
    },
    
    businessProfile: {
      name: String,
      url: String,
      mcc: String, // Merchant Category Code
      productDescription: String
    },
    
    // Individual (person) information
    individual: {
      firstName: String,
      lastName: String,
      email: String,
      phone: String,
      dob: {
        day: Number,
        month: Number,
        year: Number
      },
      ssnLast4: String,
      idNumberProvided: { type: Boolean, default: false },
      address: {
        line1: String,
        line2: String,
        city: String,
        state: String,
        postal_code: String,
        country: String
      }
    },
    
    // Bank account for payouts
    externalAccounts: [{
      id: String,
      object: String, // 'bank_account' or 'card'
      accountHolderName: String,
      accountHolderType: String,
      bankName: String,
      country: String,
      currency: String,
      fingerprint: String,
      last4: String,
      routingNumber: String,
      status: String,
      defaultForCurrency: Boolean
    }],
    
    // Account capabilities
    capabilities: {
      cardPayments: {
        type: String,
        enum: ['active', 'inactive', 'pending']
      },
      transfers: {
        type: String,
        enum: ['active', 'inactive', 'pending']
      }
    },
    
    // Onboarding
    onboardingComplete: { type: Boolean, default: false },
    onboardingLink: { type: String }, // Temporary onboarding URL
    onboardingLinkExpires: { type: Date },
    
    // Account created date
    createdAt: { type: Date }
  },
  
  // Payment Methods
  paymentMethods: [{
    paymentMethodId: { type: String, required: true },
    type: {
      type: String,
      enum: ['card', 'bank_account', 'us_bank_account'],
      required: true
    },
    
    // Card details
    card: {
      brand: String, // 'visa', 'mastercard', etc.
      last4: String,
      expMonth: Number,
      expYear: Number,
      funding: String, // 'credit', 'debit', 'prepaid'
      country: String
    },
    
    // Bank account details
    bankAccount: {
      bankName: String,
      last4: String,
      accountHolderType: String,
      routingNumber: String
    },
    
    billingDetails: {
      name: String,
      email: String,
      phone: String,
      address: {
        line1: String,
        city: String,
        state: String,
        postal_code: String,
        country: String
      }
    },
    
    isDefault: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Transaction History
  contributionHistory: [{
    paymentIntentId: String,
    eventId: { type: mongoose.Types.ObjectId, ref: 'InvestmentEvent' },
    amount: Number,
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['succeeded', 'pending', 'failed', 'canceled', 'refunded']
    },
    createdAt: Date,
    metadata: mongoose.Schema.Types.Mixed
  }],
  
  // Payout History (for Connect accounts)
  payoutHistory: [{
    payoutId: String,
    amount: Number,
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['paid', 'pending', 'in_transit', 'canceled', 'failed']
    },
    arrivalDate: Date,
    createdAt: Date,
    description: String
  }],
  
  // Refund History
  refundHistory: [{
    refundId: String,
    paymentIntentId: String,
    amount: Number,
    currency: { type: String, default: 'usd' },
    status: {
      type: String,
      enum: ['succeeded', 'pending', 'failed', 'canceled']
    },
    reason: String,
    createdAt: Date
  }],
  
  // Balance (for Connect accounts)
  balance: {
    available: [{
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'usd' }
    }],
    pending: [{
      amount: { type: Number, default: 0 },
      currency: { type: String, default: 'usd' }
    }],
    lastUpdated: Date
  },
  
  // Statistics
  statistics: {
    totalContributed: { type: Number, default: 0 },
    totalReceived: { type: Number, default: 0 },
    totalRefunded: { type: Number, default: 0 },
    totalFees: { type: Number, default: 0 },
    
    contributionCount: { type: Number, default: 0 },
    receivedCount: { type: Number, default: 0 },
    
    averageContribution: { type: Number, default: 0 },
    largestContribution: { type: Number, default: 0 },
    smallestContribution: { type: Number, default: 0 }
  },
  
  // Tax Documents
  taxDocuments: [{
    year: Number,
    type: {
      type: String,
      enum: ['1099-K', '1099-DIV', '1099-INT', 'W-9']
    },
    fileUrl: String,
    generatedAt: Date,
    downloaded: { type: Boolean, default: false },
    downloadedAt: Date
  }],
  
  // Compliance & Verification
  verification: {
    status: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'failed'],
      default: 'unverified'
    },
    
    // Identity verification
    identityVerified: { type: Boolean, default: false },
    identityVerifiedAt: Date,
    identityDocuments: [{
      type: String,
      url: String,
      uploadedAt: Date
    }],
    
    // Address verification
    addressVerified: { type: Boolean, default: false },
    addressVerifiedAt: Date,
    
    // Bank account verification
    bankAccountVerified: { type: Boolean, default: false },
    bankAccountVerifiedAt: Date,
    
    // Tax ID verification
    taxIdVerified: { type: Boolean, default: false },
    taxIdVerifiedAt: Date
  },
  
  // Account limits and restrictions
  limits: {
    maxDailyContribution: { type: Number, default: 10000 }, // $10,000
    maxMonthlyContribution: { type: Number, default: 50000 }, // $50,000
    maxSingleContribution: { type: Number, default: 5000 }, // $5,000
    
    dailyContributionUsed: { type: Number, default: 0 },
    monthlyContributionUsed: { type: Number, default: 0 },
    
    lastResetDate: Date
  },
  
  // Fraud prevention
  riskAssessment: {
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high', 'blocked'],
      default: 'low'
    },
    lastReviewed: Date,
    reviewNotes: String,
    flaggedTransactions: [{
      transactionId: String,
      reason: String,
      reviewedAt: Date,
      resolution: String
    }]
  },
  
  // Webhooks received from Stripe
  webhookEvents: [{
    eventId: String,
    eventType: String,
    receivedAt: { type: Date, default: Date.now },
    processed: { type: Boolean, default: false },
    data: mongoose.Schema.Types.Mixed
  }],
  
  // Account status
  accountStatus: {
    type: String,
    enum: ['active', 'restricted', 'suspended', 'closed'],
    default: 'active'
  },
  
  // Suspension details
  suspension: {
    isSuspended: { type: Boolean, default: false },
    suspendedAt: Date,
    reason: String,
    suspendedBy: String,
    canAppeal: { type: Boolean, default: true }
  },
  
  // Preferences
  preferences: {
    instantPayouts: { type: Boolean, default: false },
    emailReceipts: { type: Boolean, default: true },
    monthlyStatements: { type: Boolean, default: true },
    
    payoutSchedule: {
      interval: {
        type: String,
        enum: ['daily', 'weekly', 'monthly', 'manual'],
        default: 'weekly'
      },
      weeklyAnchor: String, // 'monday', 'tuesday', etc.
      monthlyAnchor: Number // Day of month (1-31)
    }
  },
  
  // Metadata for custom fields
  metadata: {
    type: Map,
    of: String
  },
  
  // Audit trail
  auditLog: [{
    action: String,
    performedBy: String,
    timestamp: { type: Date, default: Date.now },
    details: mongoose.Schema.Types.Mixed
  }]
  
}, { 
  timestamps: true 
});

// Indexes
stripeUserSchema.index({ user: 1 });
stripeUserSchema.index({ 'stripeCustomer.customerId': 1 });
stripeUserSchema.index({ 'stripeConnectAccount.accountId': 1 });
stripeUserSchema.index({ accountStatus: 1 });
stripeUserSchema.index({ 'verification.status': 1 });

// Methods

// Update contribution statistics
stripeUserSchema.methods.updateContributionStats = function(amount) {
  this.statistics.totalContributed += amount;
  this.statistics.contributionCount += 1;
  this.statistics.averageContribution = 
    this.statistics.totalContributed / this.statistics.contributionCount;
  
  if (amount > this.statistics.largestContribution) {
    this.statistics.largestContribution = amount;
  }
  
  if (this.statistics.smallestContribution === 0 || amount < this.statistics.smallestContribution) {
    this.statistics.smallestContribution = amount;
  }
  
  return this.save();
};

// Update received statistics
stripeUserSchema.methods.updateReceivedStats = function(amount) {
  this.statistics.totalReceived += amount;
  this.statistics.receivedCount += 1;
  return this.save();
};

// Check if user can make a contribution (not over limits)
stripeUserSchema.methods.canContribute = function(amount) {
  const now = new Date();
  const lastReset = new Date(this.limits.lastResetDate);
  
  // Reset daily limit if new day
  if (now.getDate() !== lastReset.getDate()) {
    this.limits.dailyContributionUsed = 0;
    this.limits.lastResetDate = now;
  }
  
  // Reset monthly limit if new month
  if (now.getMonth() !== lastReset.getMonth()) {
    this.limits.monthlyContributionUsed = 0;
    this.limits.lastResetDate = now;
  }
  
  // Check limits
  if (amount > this.limits.maxSingleContribution) {
    return { allowed: false, reason: 'Exceeds single contribution limit' };
  }
  
  if (this.limits.dailyContributionUsed + amount > this.limits.maxDailyContribution) {
    return { allowed: false, reason: 'Exceeds daily limit' };
  }
  
  if (this.limits.monthlyContributionUsed + amount > this.limits.maxMonthlyContribution) {
    return { allowed: false, reason: 'Exceeds monthly limit' };
  }
  
  return { allowed: true };
};

// Record contribution against limits
stripeUserSchema.methods.recordContribution = function(amount) {
  this.limits.dailyContributionUsed += amount;
  this.limits.monthlyContributionUsed += amount;
  return this.save();
};

// Check if Connect account is fully set up
stripeUserSchema.methods.isConnectAccountReady = function() {
  return (
    this.stripeConnectAccount.accountId &&
    this.stripeConnectAccount.detailsSubmitted &&
    this.stripeConnectAccount.chargesEnabled &&
    this.stripeConnectAccount.payoutsEnabled &&
    !this.stripeConnectAccount.requirements.disabled
  );
};

// Get default payment method
stripeUserSchema.methods.getDefaultPaymentMethod = function() {
  return this.paymentMethods.find(pm => pm.isDefault);
};

// Static methods

// Find by Stripe customer ID
stripeUserSchema.statics.findByCustomerId = function(customerId) {
  return this.findOne({ 'stripeCustomer.customerId': customerId });
};

// Find by Stripe Connect account ID
stripeUserSchema.statics.findByAccountId = function(accountId) {
  return this.findOne({ 'stripeConnectAccount.accountId': accountId });
};

// Pre-save middleware
stripeUserSchema.pre('save', function(next) {
  // Ensure only one default payment method
  const defaultMethods = this.paymentMethods.filter(pm => pm.isDefault);
  if (defaultMethods.length > 1) {
    // Keep only the first default, set others to false
    this.paymentMethods.forEach((pm, index) => {
      if (index > 0 && pm.isDefault) {
        pm.isDefault = false;
      }
    });
  }
  
  next();
});

// Don't return sensitive data in JSON
stripeUserSchema.set('toJSON', {
  transform: function(doc, ret) {
    // Remove sensitive webhook data
    if (ret.webhookEvents) {
      ret.webhookEvents = ret.webhookEvents.map(event => ({
        eventType: event.eventType,
        receivedAt: event.receivedAt,
        processed: event.processed
      }));
    }
    
    // Remove full card/bank details, keep only last4
    if (ret.paymentMethods) {
      ret.paymentMethods = ret.paymentMethods.map(pm => ({
        paymentMethodId: pm.paymentMethodId,
        type: pm.type,
        last4: pm.card?.last4 || pm.bankAccount?.last4,
        isDefault: pm.isDefault
      }));
    }
    
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model('StripeUser', stripeUserSchema);