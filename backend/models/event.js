// backend/models/event.js
// CLEAN MERGE: investment-event.js + NEW Evite features
// EventParticipant stays as separate model

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
  
  // ========================================
  // BASIC EVENT INFO (from investment-event.js)
  // ========================================
  eventType: { 
    type: String, 
    enum: ['birthday', 'wedding', 'graduation', 'baby', 'baby_shower', 'anniversary', 'housewarming', 'retirement', 'custom', 'other'], 
    required: true 
  },
  
  eventTitle: { 
    type: String, 
    required: true 
  },
  
  eventDescription: { 
    type: String 
  },
  
  eventDate: { 
    type: Date, 
    required: true 
  },
  
  // ⭐ NEW: Separate time field
  eventTime: { 
    type: String // e.g., "6:00 PM"
  },
  
  eventImage: { 
    type: String 
  },
  
  // ⭐ NEW: Additional details
  specialInstructions: String,
  dressCode: String,
  giftNote: String, // Custom message about gifts
  
  // ========================================
  // USER RELATIONS (from investment-event.js)
  // ========================================
  createdBy: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  recipientUser: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // ⭐ NEW: Co-hosts (can help manage event)
  coHosts: [{
    type: mongoose.Types.ObjectId,
    ref: 'User'
  }],
  
  // Simple invited users list (just IDs - full data in EventParticipant)
  invitedUsers: [{ 
    type: mongoose.Types.ObjectId, 
    ref: 'User' 
  }],
  
  // ========================================
  // ⭐ NEW: DESIGN/INVITATION
  // ========================================
  design: {
    type: {
      type: String,
      enum: ['template', 'custom', 'none'],
      default: 'none',
    },
    templateId: String, // Reference to DesignTemplate
    customImageUrl: String, // URL if custom upload
    primaryColor: {
      type: String,
      default: '#FF6B6B',
    },
    secondaryColor: {
      type: String,
      default: '#4ECDC4',
    },
    textColor: {
      type: String,
      default: '#333333',
    },
  },
  
  // ========================================
  // ⭐ NEW: LOCATION
  // ========================================
  location: {
    venueName: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    latitude: Number,
    longitude: Number,
    parkingInfo: String,
    additionalDirections: String,
  },
  
  // ========================================
  // FINANCIAL (from investment-event.js)
  // ========================================
  targetAmount: { 
    type: Number, 
    required: true 
  },
  
  currentAmount: { 
    type: Number, 
    default: 0 
  },
  
  contributionDeadline: { 
    type: Date, 
    required: true 
  },
  
  // ⭐ NEW: RSVP deadline (separate from contribution)
  rsvpDeadline: Date,
  
  // ========================================
  // CONTRIBUTIONS (from investment-event.js)
  // ========================================
  contributors: [{
    user: { 
      type: mongoose.Types.ObjectId, 
      ref: 'User' 
    },
    amount: { 
      type: Number 
    },
    contributedAt: { 
      type: Date,
      default: Date.now,
    },
    stripePaymentId: { 
      type: String 
    },
    message: { 
      type: String 
    },
    isAnonymous: { 
      type: Boolean, 
      default: false 
    },
  }],
  
  // ========================================
  // REGISTRY TYPE & OPTIONS
  // ========================================
  
  // ⭐ NEW: Registry type selector
  registryType: {
    type: String,
    enum: ['stock', 'amazon', 'target', 'cash_fund', 'none'],
    default: 'stock',
  },
  
  // Stock Registry (from investment-event.js)
  selectedInvestments: [{
    symbol: { 
      type: String, 
      required: true 
    },
    name: { 
      type: String 
    },
    type: { 
      type: String, 
      enum: ['stock', 'etf'] 
    },
    targetShares: { 
      type: Number 
    },
    allocatedAmount: { 
      type: Number 
    },
    purchasePrice: { 
      type: Number 
    },
    purchaseDate: { 
      type: Date 
    },
    currentPrice: { 
      type: Number 
    },
    broker: { 
      type: String 
    },
    transactionId: { 
      type: String 
    },
  }],
  
  // Purchase details (from investment-event.js)
  purchaseDetails: {
    broker: { 
      type: String 
    },
    accountId: { 
      type: String 
    },
    transactionIds: [String],
    completedAt: { 
      type: Date 
    },
    totalShares: { 
      type: Number 
    },
    averagePrice: { 
      type: Number 
    },
  },
  
  // ⭐ NEW: External Registry (Amazon/Target)
  externalRegistry: {
    platform: String, // 'amazon' or 'target'
    registryUrl: String,
    registryId: String,
  },
  
  // ⭐ NEW: Cash Fund
  cashFund: {
    fundName: String,
    fundDescription: String,
    fundImageUrl: String,
  },

  // Enhanced Guest List (with RSVP tracking)
  guestList: [{
    // Reference to user (if registered)
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // Manual entry (if not registered)
    name: String,
    email: String,
    phone: String,
    
    // RSVP
    rsvpStatus: {
      type: String,
      enum: ['pending', 'going', 'maybe', 'not_going'],
      default: 'pending',
    },
    plusOnes: {
      type: Number,
      default: 0,
    },
    dietaryRestrictions: String,
    specialRequests: String,
    
    // Tracking
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    respondedAt: Date,
    inviteMethod: {
      type: String,
      enum: ['email', 'sms', 'in_app'],
    },
  }],
  
  // ========================================
  // STATUS & PRIVACY (from investment-event.js)
  // ========================================
  status: { 
    type: String, 
    enum: [
      'draft',           // Being created
      'active',          // Collecting contributions/RSVPs
      'funded',          // Goal reached, ready to invest
      'purchasing',      // Host is buying stocks
      'invested',        // Stocks purchased
      'completed',       // Event completed/gift delivered
      'cancelled',       // Event cancelled
    ],
    default: 'draft'
  },
  
  privacyLevel: { 
    type: String, 
    enum: ['public', 'private', 'friends'], 
    default: 'friends' 
  },
  
  // ⭐ NEW: Settings
  allowGuestMessages: {
    type: Boolean,
    default: true,
  },
  
  allowPlusOnes: {
    type: Boolean,
    default: false,
  },
  
  maxPlusOnes: {
    type: Number,
    default: 1,
  },
  
  // ========================================
  // NOTIFICATIONS (from investment-event.js - enhanced)
  // ========================================
  notifications: {
    // Milestones (existing)
    milestones: [{ 
      amount: Number, 
      reachedAt: Date 
    }],
    lastUpdateSent: { 
      type: Date 
    },
    
    // ⭐ NEW: RSVP & reminder settings
    sendReminders: {
      type: Boolean,
      default: true,
    },
    reminderDaysBefore: {
      type: Number,
      default: 7,
    },
    notifyOnRSVP: {
      type: Boolean,
      default: true,
    },
    notifyOnContribution: {
      type: Boolean,
      default: true,
    },
  },
  
  // ========================================
  // ⭐ NEW: SHAREABLE LINK
  // ========================================
  shareableSlug: {
    type: String,
    unique: true,
    sparse: true, // Only unique if not null
  },
  
  // ========================================
  // ⭐ NEW: ANALYTICS
  // ========================================
  analytics: {
    views: {
      type: Number,
      default: 0,
    },
    shares: {
      type: Number,
      default: 0,
    },
  },
  
}, { 
  timestamps: true // Creates createdAt and updatedAt
});

// ========================================
// INDEXES
// ========================================
eventSchema.index({ createdBy: 1, status: 1 });
eventSchema.index({ recipientUser: 1, status: 1 });
//eventSchema.index({ shareableSlug: 1 });
eventSchema.index({ eventDate: 1 });
eventSchema.index({ status: 1, privacyLevel: 1 });

// ========================================
// VIRTUAL FIELDS
// ========================================

// Progress percentage
eventSchema.virtual('progressPercentage').get(function() {
  if (!this.targetAmount) return 0;
  return Math.min((this.currentAmount / this.targetAmount) * 100, 100);
});

// Days until event
eventSchema.virtual('daysUntilEvent').get(function() {
  if (!this.eventDate) return null;
  const now = new Date();
  const diffTime = this.eventDate - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

// ========================================
// INSTANCE METHODS
// ========================================

// Calculate RSVP statistics
eventSchema.methods.calculateRSVPStats = function() {
    const total = this.guestList.length;
    const going = this.guestList.filter(g => g.rsvpStatus === 'going').length;
    const maybe = this.guestList.filter(g => g.rsvpStatus === 'maybe').length;
    const notGoing = this.guestList.filter(g => g.rsvpStatus === 'not_going').length;
    const pending = this.guestList.filter(g => g.rsvpStatus === 'pending').length;
    
    return {
      total,
      going,
      maybe,
      notGoing,
      pending,
      responseRate: total > 0 ? ((going + maybe + notGoing) / total * 100).toFixed(1) : 0,
    };
  };

/**
 * Generate shareable slug
 */
eventSchema.methods.generateShareableSlug = function() {
  const randomString = Math.random().toString(36).substring(2, 10);
  this.shareableSlug = `${this._id}-${randomString}`;
  return this.shareableSlug;
};

/**
 * Check if user is host or co-host
 */
eventSchema.methods.isHost = function(userId) {
  const userIdString = userId.toString();
  const isCreator = this.createdBy.toString() === userIdString;
  const isCoHost = this.coHosts && this.coHosts.some(coHost => coHost.toString() === userIdString);
  return isCreator || isCoHost;
};

/**
 * Add contribution and update amount
 */
eventSchema.methods.addContribution = function(userId, amount, paymentId, message) {
  this.contributors.push({
    user: userId,
    amount,
    contributedAt: new Date(),
    stripePaymentId: paymentId,
    message,
  });
  
  this.currentAmount += amount;
  
  // Check if goal reached
  if (this.currentAmount >= this.targetAmount && this.status === 'active') {
    this.status = 'funded';
  }
  
  return this.save();
};

/**
 * Check if event is fully funded
 */
eventSchema.methods.isFunded = function() {
  return this.currentAmount >= this.targetAmount;
};

/**
 * Get funding progress
 */
eventSchema.methods.getFundingStatus = function() {
  return {
    target: this.targetAmount,
    current: this.currentAmount,
    remaining: Math.max(0, this.targetAmount - this.currentAmount),
    percentage: this.progressPercentage,
    isFunded: this.isFunded(),
  };
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find events by user (created, invited, or contributed)
 */
eventSchema.statics.findByUser = function(userId) {
  return this.find({
    $or: [
      { createdBy: userId },
      { recipientUser: userId },
      { invitedUsers: userId },
      { 'contributors.user': userId },
      { coHosts: userId },
    ],
  })
  .sort({ eventDate: -1 })
  .populate('createdBy', 'fname lname email profileImage')
  .populate('recipientUser', 'fname lname email profileImage')
  .populate('invitedUsers', 'fname lname email profileImage')
  .populate('contributors.user', 'fname lname email profileImage');
};

/**
 * Find active events
 */
eventSchema.statics.findActive = function() {
  return this.find({
    status: 'active',
    eventDate: { $gte: new Date() },
  })
  .sort({ eventDate: 1 });
};

/**
 * Find by shareable slug
 */
eventSchema.statics.findBySlug = function(slug) {
  return this.findOne({ shareableSlug: slug })
    .populate('createdBy', 'fname lname email profileImage')
    .populate('recipientUser', 'fname lname email profileImage');
};

/**
 * Find upcoming events
 */
eventSchema.statics.findUpcoming = function(days = 30) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    status: { $in: ['active', 'funded'] },
    eventDate: { 
      $gte: new Date(),
      $lte: futureDate 
    },
  })
  .sort({ eventDate: 1 });
};

// ========================================
// MIDDLEWARE
// ========================================

// Auto-generate shareable slug before save
eventSchema.pre('save', function(next) {
  if (this.isNew && !this.shareableSlug) {
    this.generateShareableSlug();
  }
  next();
});

// ========================================
// EXPORT
// ========================================

// Ensure virtuals are included in JSON
eventSchema.set('toJSON', { virtuals: true });
eventSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Event', eventSchema);