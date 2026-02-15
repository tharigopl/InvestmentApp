// ============================================
// STRIPE CUSTOMER MODEL
// ============================================

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const stripeCustomerSchema = new Schema({
  user: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  
  // Stripe Customer ID
  stripeCustomerId: { 
    type: String, 
    required: true,
    unique: true
  },
  
  // Customer Details
  email: { type: String, required: true },
  name: { type: String, required: true },
  
  // Payment Methods
  defaultPaymentMethod: { type: String }, // Stripe payment method ID
  paymentMethods: [{
    id: { type: String, required: true },
    type: { type: String, enum: ['card', 'bank_account', 'us_bank_account'] },
    brand: { type: String }, // visa, mastercard, etc.
    last4: { type: String },
    expMonth: { type: Number },
    expYear: { type: Number },
    isDefault: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Billing Address
  billingAddress: {
    line1: { type: String },
    line2: { type: String },
    city: { type: String },
    state: { type: String },
    postalCode: { type: String },
    country: { type: String, default: 'US' }
  },
  
  // Customer Status
  status: {
    type: String,
    enum: ['active', 'inactive', 'blocked'],
    default: 'active'
  },
  
  // Metadata
  metadata: {
    totalContributions: { type: Number, default: 0 },
    totalAmountSpent: { type: Number, default: 0 },
    lastContributionDate: { type: Date },
    preferredPaymentMethod: { type: String }
  },
  
  // Stripe Account Status
  delinquent: { type: Boolean, default: false },
  
  // Tax Information
  taxExempt: { type: String, enum: ['none', 'exempt', 'reverse'], default: 'none' },
  taxIds: [{
    type: { type: String }, // us_ein, eu_vat, etc.
    value: { type: String },
    verificationStatus: { type: String }
  }]
  
}, { timestamps: true });

// Indexes
stripeCustomerSchema.index({ user: 1 });
stripeCustomerSchema.index({ stripeCustomerId: 1 });
stripeCustomerSchema.index({ email: 1 });

const StripeCustomer = mongoose.model('StripeCustomer', stripeCustomerSchema);


// ============================================
// STRIPE CONNECTED ACCOUNT MODEL
// (For users receiving funds)
// ============================================

const stripeConnectedAccountSchema = new Schema({
  user: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true
  },
  
  // Stripe Connect Account ID
  stripeAccountId: { 
    type: String, 
    required: true,
    unique: true
  },
  
  // Account Type
  accountType: {
    type: String,
    enum: ['express', 'standard', 'custom'],
    default: 'express'
  },
  
  // Account Status
  chargesEnabled: { type: Boolean, default: false },
  payoutsEnabled: { type: Boolean, default: false },
  detailsSubmitted: { type: Boolean, default: false },
  
  // Onboarding Status
  onboardingStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'requires-action'],
    default: 'not-started'
  },
  
  // Requirements (things Stripe needs from the user)
  requirements: {
    currentlyDue: [{ type: String }], // Fields that must be collected now
    eventuallyDue: [{ type: String }], // Fields that will be needed later
    pastDue: [{ type: String }], // Fields that are overdue
    pendingVerification: [{ type: String }], // Fields awaiting verification
    errors: [{
      code: { type: String },
      reason: { type: String },
      requirement: { type: String }
    }]
  },
  
  // Business/Personal Info
  businessProfile: {
    name: { type: String },
    productDescription: { type: String },
    url: { type: String },
    supportEmail: { type: String },
    supportPhone: { type: String }
  },
  
  // Bank Account Information (for payouts)
  externalAccounts: [{
    id: { type: String },
    object: { type: String }, // 'bank_account' or 'card'
    bankName: { type: String },
    last4: { type: String },
    routingNumber: { type: String },
    accountHolderName: { type: String },
    accountHolderType: { type: String, enum: ['individual', 'company'] },
    currency: { type: String, default: 'usd' },
    country: { type: String, default: 'US' },
    isDefault: { type: Boolean, default: false }
  }],
  
  // Balance Information
  balance: {
    available: { type: Number, default: 0 }, // Available for payout
    pending: { type: Number, default: 0 },   // Pending settlement
    currency: { type: String, default: 'usd' },
    lastUpdated: { type: Date }
  },
  
  // Capabilities (what the account can do)
  capabilities: {
    cardPayments: { type: String, enum: ['active', 'inactive', 'pending'], default: 'inactive' },
    transfers: { type: String, enum: ['active', 'inactive', 'pending'], default: 'inactive' },
    usBankAccountAchPayments: { type: String, enum: ['active', 'inactive', 'pending'], default: 'inactive' }
  },
  
  // Settings
  settings: {
    payouts: {
      schedule: {
        interval: { type: String, enum: ['manual', 'daily', 'weekly', 'monthly'], default: 'daily' },
        weeklyAnchor: { type: String }, // monday, tuesday, etc.
        monthlyAnchor: { type: Number }, // 1-31
        delayDays: { type: Number, default: 2 } // Stripe default is 2 days
      }
    }
  },
  
  // Verification Status
  verification: {
    status: { 
      type: String, 
      enum: ['unverified', 'pending', 'verified', 'requires-action'],
      default: 'unverified'
    },
    disabledReason: { type: String },
    dueBy: { type: Date },
    fields: [{
      name: { type: String },
      status: { type: String }
    }]
  },
  
  // Metadata
  metadata: {
    totalReceived: { type: Number, default: 0 },
    totalPayouts: { type: Number, default: 0 },
    lastPayoutDate: { type: Date },
    eventsPurchased: { type: Number, default: 0 }
  },
  
  // Account Links (for onboarding)
  lastAccountLinkUrl: { type: String },
  accountLinkExpiresAt: { type: Date },
  
  // Risk Level (assigned by Stripe)
  riskLevel: {
    type: String,
    enum: ['normal', 'elevated', 'highest'],
    default: 'normal'
  }
  
}, { timestamps: true });

// Indexes
stripeConnectedAccountSchema.index({ user: 1 });
stripeConnectedAccountSchema.index({ stripeAccountId: 1 });
stripeConnectedAccountSchema.index({ onboardingStatus: 1 });

const StripeConnectedAccount = mongoose.model('StripeConnectedAccount', stripeConnectedAccountSchema);


// ============================================
// STRIPE PAYMENT INTENT MODEL
// (Track individual contributions)
// ============================================

const stripePaymentIntentSchema = new Schema({
  // Reference to contribution
  contribution: {
    type: mongoose.Types.ObjectId,
    ref: 'Contribution',
    required: true
  },
  
  // Reference to event
  event: {
    type: mongoose.Types.ObjectId,
    ref: 'InvestmentEvent',
    required: true
  },
  
  // User who is contributing
  contributor: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Stripe Payment Intent ID
  paymentIntentId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Amount Details
  amount: { type: Number, required: true }, // Amount in cents
  currency: { type: String, default: 'usd' },
  amountReceived: { type: Number, default: 0 }, // Actual amount received after fees
  
  // Stripe Fee Breakdown
  fees: {
    stripeFee: { type: Number, default: 0 },
    applicationFee: { type: Number, default: 0 }, // Our platform fee (if any)
    netAmount: { type: Number, default: 0 } // Amount after all fees
  },
  
  // Payment Status
  status: {
    type: String,
    enum: [
      'requires_payment_method',
      'requires_confirmation',
      'requires_action',
      'processing',
      'requires_capture',
      'canceled',
      'succeeded',
      'failed'
    ],
    required: true
  },
  
  // Payment Method Details
  paymentMethod: {
    id: { type: String },
    type: { type: String },
    card: {
      brand: { type: String },
      last4: { type: String },
      expMonth: { type: Number },
      expYear: { type: Number }
    }
  },
  
  // Client Secret (for frontend)
  clientSecret: { type: String },
  
  // Refund Information
  refunded: { type: Boolean, default: false },
  refunds: [{
    id: { type: String },
    amount: { type: Number },
    reason: { type: String },
    status: { type: String },
    createdAt: { type: Date }
  }],
  amountRefunded: { type: Number, default: 0 },
  
  // Dispute Information
  disputed: { type: Boolean, default: false },
  dispute: {
    id: { type: String },
    status: { type: String },
    reason: { type: String },
    amount: { type: Number },
    createdAt: { type: Date }
  },
  
  // Transfer Information (to connected account)
  transfer: {
    id: { type: String },
    destination: { type: String }, // Stripe Connected Account ID
    amount: { type: Number },
    status: { type: String },
    createdAt: { type: Date }
  },
  
  // Metadata
  metadata: {
    eventTitle: { type: String },
    recipientName: { type: String },
    contributorMessage: { type: String },
    isAnonymous: { type: Boolean, default: false }
  },
  
  // Error Details (if failed)
  lastPaymentError: {
    code: { type: String },
    message: { type: String },
    type: { type: String }
  },
  
  // Timestamps
  succeededAt: { type: Date },
  canceledAt: { type: Date },
  failedAt: { type: Date }
  
}, { timestamps: true });

// Indexes
stripePaymentIntentSchema.index({ paymentIntentId: 1 });
stripePaymentIntentSchema.index({ contributor: 1, createdAt: -1 });
stripePaymentIntentSchema.index({ event: 1 });
stripePaymentIntentSchema.index({ status: 1 });
stripePaymentIntentSchema.index({ contribution: 1 });

const StripePaymentIntent = mongoose.model('StripePaymentIntent', stripePaymentIntentSchema);


// ============================================
// STRIPE PAYOUT MODEL
// (Track payouts to recipients)
// ============================================

const stripePayoutSchema = new Schema({
  // User receiving payout
  user: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Connected Account
  stripeAccountId: { type: String, required: true },
  
  // Stripe Payout ID
  payoutId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Amount Details
  amount: { type: Number, required: true }, // Amount in cents
  currency: { type: String, default: 'usd' },
  
  // Payout Status
  status: {
    type: String,
    enum: ['paid', 'pending', 'in_transit', 'canceled', 'failed'],
    required: true
  },
  
  // Destination (bank account)
  destination: {
    id: { type: String },
    bankName: { type: String },
    last4: { type: String },
    accountHolderName: { type: String }
  },
  
  // Related Events
  events: [{
    type: mongoose.Types.ObjectId,
    ref: 'InvestmentEvent'
  }],
  
  // Timing
  arrivalDate: { type: Date }, // Expected arrival date
  paidAt: { type: Date },
  failedAt: { type: Date },
  
  // Failure Details
  failureCode: { type: String },
  failureMessage: { type: String },
  
  // Metadata
  description: { type: String },
  statementDescriptor: { type: String }
  
}, { timestamps: true });

// Indexes
stripePayoutSchema.index({ payoutId: 1 });
stripePayoutSchema.index({ user: 1, createdAt: -1 });
stripePayoutSchema.index({ stripeAccountId: 1 });
stripePayoutSchema.index({ status: 1 });

const StripePayout = mongoose.model('StripePayout', stripePayoutSchema);


// ============================================
// STRIPE WEBHOOK EVENT MODEL
// (Track all webhook events from Stripe)
// ============================================

const stripeWebhookEventSchema = new Schema({
  // Stripe Event ID
  eventId: {
    type: String,
    required: true,
    unique: true
  },
  
  // Event Type
  type: {
    type: String,
    required: true
  },
  
  // Event Object (full event data from Stripe)
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  
  // Processing Status
  processed: { type: Boolean, default: false },
  processedAt: { type: Date },
  
  // Error if processing failed
  processingError: {
    message: { type: String },
    stack: { type: String },
    attempts: { type: Number, default: 0 }
  },
  
  // Related Objects
  relatedUser: { type: mongoose.Types.ObjectId, ref: 'User' },
  relatedEvent: { type: mongoose.Types.ObjectId, ref: 'InvestmentEvent' },
  relatedPaymentIntent: { type: mongoose.Types.ObjectId, ref: 'StripePaymentIntent' },
  
  // API Version
  apiVersion: { type: String },
  
  // Livemode
  livemode: { type: Boolean, default: false }
  
}, { timestamps: true });

// Indexes
stripeWebhookEventSchema.index({ eventId: 1 });
stripeWebhookEventSchema.index({ type: 1 });
stripeWebhookEventSchema.index({ processed: 1 });
stripeWebhookEventSchema.index({ createdAt: -1 });

const StripeWebhookEvent = mongoose.model('StripeWebhookEvent', stripeWebhookEventSchema);


// ============================================
// EXPORTS
// ============================================

module.exports = {
  StripeCustomer,
  StripeConnectedAccount,
  StripePaymentIntent,
  StripePayout,
  StripeWebhookEvent
};
