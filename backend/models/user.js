const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
  // Basic User Information
  fname: { type: String, required: true },
  lname: { type: String, required: true },
  mname: { type: String, required: false },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  
  // Contact Information
  phoneno: { type: String, required: false },
  
  // Address Information
  address: {
    street: { type: String, required: false },
    unit: { type: String, required: false },
    city: { type: String, required: false },
    state: { type: String, required: false },
    country: { type: String, required: false, default: 'USA' },
    postalcode: { type: String, required: false, minlength: 5 }
  },
  
  // Personal Information
  dateofbirth: { type: Date, required: false },
  profileImage: { type: String, required: false }, // URL to profile picture
  
  // Investment Profile
  investmentProfile: {
    // Preferred stocks/ETFs for gift suggestions
    preferredStocks: [{ 
      type: String, 
      uppercase: true 
    }], // e.g., ['AAPL', 'MSFT', 'VOO']
    
    // Investment preferences
    riskTolerance: { 
      type: String, 
      enum: ['conservative', 'moderate', 'aggressive', 'very_aggressive'],
      default: 'moderate'
    },
    
    investmentGoals: [{
      type: String,
      enum: [
        'long_term_growth',
        'dividend_income',
        'wealth_preservation',
        'retirement',
        'education',
        'general_savings'
      ]
    }],
    
    // Statistics
    totalGiftsGiven: { type: Number, default: 0 },
    totalAmountGiven: { type: Number, default: 0 },
    averageContributionAmount: { type: Number, default: 0 },
    
    totalGiftsReceived: { type: Number, default: 0 },
    totalAmountReceived: { type: Number, default: 0 },
    
    totalEventsCreated: { type: Number, default: 0 },
    totalEventsParticipated: { type: Number, default: 0 },
    
    // Portfolio value (cached, updated periodically)
    currentPortfolioValue: { type: Number, default: 0 },
    portfolioLastUpdated: { type: Date }
  },
  
  // Brokerage Account Integration
  brokerageAccount: {
    isLinked: { type: Boolean, default: false },
    provider: { 
      type: String, 
      enum: ['alpaca', 'robinhood', 'fidelity', 'schwab', 'etrade', 'other'],
      required: false
    },
    accountId: { type: String, required: false }, // Encrypted
    accountStatus: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'closed'],
      default: 'pending'
    },
    linkedAt: { type: Date },
    lastSyncedAt: { type: Date }
  },
  
  // Stripe Information
  stripeCustomerId: { type: String, required: false }, // Stripe customer ID for receiving contributions
  stripeAccountId: { type: String, required: false }, // Stripe Connect account for receiving funds
  
  // Relationships
  friends: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // Events (cached for quick access)
  eventsCreated: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'InvestmentEvent' 
  }],
  
  eventsParticipating: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'InvestmentEvent' 
  }],
  
  // Stock Holdings
  stockHoldings: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'StockHolding' 
  }],
  
  // Notification Preferences
  notificationPreferences: {
    email: {
      eventInvites: { type: Boolean, default: true },
      contributionReceived: { type: Boolean, default: true },
      contributionReminders: { type: Boolean, default: true },
      eventFunded: { type: Boolean, default: true },
      stocksPurchased: { type: Boolean, default: true },
      portfolioUpdates: { type: Boolean, default: true },
      friendRequests: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false }
    },
    
    push: {
      eventInvites: { type: Boolean, default: true },
      contributionReceived: { type: Boolean, default: true },
      chatMessages: { type: Boolean, default: true },
      stockUpdates: { type: Boolean, default: false },
      milestones: { type: Boolean, default: true }
    },
    
    sms: {
      eventReminders: { type: Boolean, default: false },
      contributionReceived: { type: Boolean, default: false }
    }
  },
  
  // Privacy Settings
  privacySettings: {
    profileVisibility: {
      type: String,
      enum: ['public', 'friends', 'private'],
      default: 'friends'
    },
    showPortfolio: { type: Boolean, default: true },
    showContributionHistory: { type: Boolean, default: true },
    allowFriendRequests: { type: Boolean, default: true },
    showInSearch: { type: Boolean, default: true }
  },
  
  // Security
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: { type: String, required: false }, // Encrypted
  
  // Device tokens for push notifications
  deviceTokens: [{
    token: { type: String },
    platform: { 
      type: String, 
      enum: ['ios', 'android', 'web'] 
    },
    addedAt: { type: Date, default: Date.now }
  }],
  
  // Account Status
  accountStatus: {
    type: String,
    enum: ['active', 'suspended', 'deactivated', 'pending_verification'],
    default: 'active'
  },
  
  emailVerified: { type: Boolean, default: false },
  emailVerificationToken: { type: String },
  
  kycVerified: { type: Boolean, default: false }, // Know Your Customer verification
  kycVerifiedAt: { type: Date },
  
  // Tax Information (encrypted)
  taxInfo: {
    hasW9: { type: Boolean, default: false },
    ein: { type: String }, // Encrypted - Employer Identification Number
    ssn: { type: String }, // Encrypted - Last 4 digits only
    taxFilingStatus: {
      type: String,
      enum: ['single', 'married_filing_jointly', 'married_filing_separately', 'head_of_household']
    }
  },
  
  // Referral Program
  referralCode: { 
    type: String, 
    unique: true, 
    sparse: true 
  },
  referredBy: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User' 
  },
  referralCount: { type: Number, default: 0 },
  
  // Login tracking
  lastLoginAt: { type: Date },
  lastLoginIp: { type: String },
  loginCount: { type: Number, default: 0 },
  
  // Onboarding
  onboardingCompleted: { type: Boolean, default: false },
  onboardingStep: { 
    type: String,
    enum: ['profile', 'preferences', 'brokerage', 'friends', 'complete'],
    default: 'profile'
  },
  
  // Feature flags
  betaFeatures: [{
    type: String
  }],
  
  // Soft delete
  isDeleted: { type: Boolean, default: false },
  deletedAt: { type: Date }
  
}, { 
  timestamps: true // Adds createdAt and updatedAt automatically
});

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ referralCode: 1 });
userSchema.index({ 'investmentProfile.preferredStocks': 1 });
userSchema.index({ friends: 1 });
userSchema.index({ accountStatus: 1 });
userSchema.index({ isDeleted: 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  if (this.mname) {
    return `${this.fname} ${this.mname} ${this.lname}`;
  }
  return `${this.fname} ${this.lname}`;
});

// Virtual for initials
userSchema.virtual('initials').get(function() {
  return `${this.fname.charAt(0)}${this.lname.charAt(0)}`.toUpperCase();
});


/ Method to check if user can contribute
userSchema.methods.canContribute = function() {
  return this.accountStatus.isActive && 
         this.accountStatus.isVerified && 
         !this.accountStatus.isSuspended;
};

// Method to check if user can receive gifts
userSchema.methods.canReceiveGifts = function() {
  return this.accountStatus.isActive && 
         this.brokerageAccount.isLinked && 
         this.brokerageAccount.kycStatus === 'approved';
};

// Method to update contribution stats
userSchema.methods.updateContributionStats = function(amount) {
  this.investmentProfile.totalGiftsGiven += 1;
  this.investmentProfile.totalAmountGiven += amount;
  this.investmentProfile.averageContributionAmount = 
    this.investmentProfile.totalAmountGiven / this.investmentProfile.totalGiftsGiven;
  return this.save();
};

// Method to update received gift stats
userSchema.methods.updateReceivedGiftStats = function(amount) {
  this.investmentProfile.totalGiftsReceived += 1;
  this.investmentProfile.totalAmountReceived += amount;
  return this.save();
};

// Method to check if user can create more events (rate limiting)
userSchema.methods.canCreateEvent = function() {
  // Example: Max 10 events per month
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  
  // This would need to be implemented with an actual query
  // For now, just return true
  return true;
};

// Method to generate referral code
userSchema.methods.generateReferralCode = function() {
  if (!this.referralCode) {
    const code = `${this.fname.substring(0, 3).toUpperCase()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    this.referralCode = code;
  }
  return this.referralCode;
};

// Static method to find users by stock preference
userSchema.statics.findByStockPreference = function(symbol) {
  return this.find({ 
    'investmentProfile.preferredStocks': symbol,
    accountStatus: 'active',
    isDeleted: false
  });
};

// Pre-save hook to update timestamps
userSchema.pre('save', function(next) {
  // Generate referral code if not exists
  if (!this.referralCode) {
    this.generateReferralCode();
  }
  next();
});

// Don't return password and sensitive fields in JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.password;
    delete ret.twoFactorSecret;
    delete ret.emailVerificationToken;
    delete ret.taxInfo.ssn;
    delete ret.taxInfo.ein;
    delete ret.__v;
    return ret;
  }
});

userSchema.plugin(uniqueValidator);

module.exports = mongoose.model('User', userSchema);