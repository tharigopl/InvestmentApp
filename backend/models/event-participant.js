// backend/models/event-participant.js
// ENHANCED: Original + RSVP tracking for Evite features

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventParticipantSchema = new Schema({
  event: { 
    type: mongoose.Types.ObjectId, 
    ref: 'Event', 
    required: true 
  },
  
  user: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  
  // ========================================
  // PARTICIPANT ROLE
  // ========================================
  role: {
    type: String,
    enum: ['creator', 'recipient', 'contributor', 'invited', 'co_host'],
    required: true
  },
  
  // ========================================
  // ⭐ NEW: RSVP TRACKING (for Evite features)
  // ========================================
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
  
  respondedAt: Date,
  
  // ⭐ NEW: How they were invited
  inviteMethod: {
    type: String,
    enum: ['email', 'sms', 'in_app', 'manual'],
  },
  
  invitedAt: Date,
  
  // ========================================
  // CHAT/MESSAGING (existing)
  // ========================================
  chatSettings: {
    isMuted: { 
      type: Boolean, 
      default: false 
    },
    mutedUntil: Date,
    
    notificationPreferences: {
      newMessages: { 
        type: Boolean, 
        default: true 
      },
      contributions: { 
        type: Boolean, 
        default: true 
      },
      stockUpdates: { 
        type: Boolean, 
        default: true 
      },
      milestones: { 
        type: Boolean, 
        default: true 
      },
      mentions: { 
        type: Boolean, 
        default: true 
      },
      
      // ⭐ NEW: RSVP notifications
      rsvpReminders: {
        type: Boolean,
        default: true,
      },
    }
  },
  
  // ========================================
  // MESSAGE TRACKING (existing)
  // ========================================
  lastReadMessageId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'Message' 
  },
  
  lastReadAt: Date,
  
  unreadCount: { 
    type: Number, 
    default: 0 
  },
  
  // ========================================
  // PARTICIPANT STATUS (existing)
  // ========================================
  joinedAt: { 
    type: Date, 
    default: Date.now 
  },
  
  leftAt: Date,
  
  isActive: { 
    type: Boolean, 
    default: true 
  },
  
}, { 
  timestamps: true 
});

// ========================================
// INDEXES
// ========================================

// Compound index for unique participant per event
eventParticipantSchema.index({ event: 1, user: 1 }, { unique: true });

// Index for finding participants by event
eventParticipantSchema.index({ event: 1, role: 1 });

// Index for finding events by user
eventParticipantSchema.index({ user: 1, isActive: 1 });

// Index for RSVP queries
eventParticipantSchema.index({ event: 1, rsvpStatus: 1 });

// ========================================
// VIRTUAL FIELDS
// ========================================

// Has responded to RSVP
eventParticipantSchema.virtual('hasResponded').get(function() {
  return this.rsvpStatus !== 'pending';
});

// Is attending (going or maybe)
eventParticipantSchema.virtual('isAttending').get(function() {
  return ['going', 'maybe'].includes(this.rsvpStatus);
});

// Has unread messages
eventParticipantSchema.virtual('hasUnread').get(function() {
  return this.unreadCount > 0;
});

// ========================================
// INSTANCE METHODS
// ========================================

/**
 * Update RSVP status
 */
eventParticipantSchema.methods.updateRSVP = function(status, plusOnes = 0, dietaryRestrictions = null) {
  this.rsvpStatus = status;
  this.plusOnes = plusOnes;
  this.respondedAt = new Date();
  
  if (dietaryRestrictions) {
    this.dietaryRestrictions = dietaryRestrictions;
  }
  
  return this.save();
};

/**
 * Mark messages as read
 */
eventParticipantSchema.methods.markAsRead = function(messageId) {
  this.lastReadMessageId = messageId;
  this.lastReadAt = new Date();
  this.unreadCount = 0;
  return this.save();
};

/**
 * Increment unread count
 */
eventParticipantSchema.methods.incrementUnread = function() {
  this.unreadCount += 1;
  return this.save();
};

/**
 * Mute chat
 */
eventParticipantSchema.methods.muteChat = function(duration = null) {
  this.chatSettings.isMuted = true;
  
  if (duration) {
    const mutedUntil = new Date();
    mutedUntil.setHours(mutedUntil.getHours() + duration);
    this.chatSettings.mutedUntil = mutedUntil;
  }
  
  return this.save();
};

/**
 * Unmute chat
 */
eventParticipantSchema.methods.unmuteChat = function() {
  this.chatSettings.isMuted = false;
  this.chatSettings.mutedUntil = null;
  return this.save();
};

/**
 * Leave event
 */
eventParticipantSchema.methods.leave = function() {
  this.isActive = false;
  this.leftAt = new Date();
  return this.save();
};

// ========================================
// STATIC METHODS
// ========================================

/**
 * Find all participants for an event
 */
eventParticipantSchema.statics.findByEvent = function(eventId) {
  return this.find({ event: eventId, isActive: true })
    .populate('user', 'fname lname email profileImage')
    .sort({ joinedAt: 1 });
};

/**
 * Find all events for a user
 */
eventParticipantSchema.statics.findByUser = function(userId) {
  return this.find({ user: userId, isActive: true })
    .populate('event')
    .sort({ joinedAt: -1 });
};

/**
 * Get RSVP stats for an event
 */
eventParticipantSchema.statics.getRSVPStats = async function(eventId) {
  const participants = await this.find({ event: eventId, isActive: true });
  
  const stats = {
    total: participants.length,
    pending: 0,
    going: 0,
    maybe: 0,
    notGoing: 0,
    totalPlusOnes: 0,
  };
  
  participants.forEach(p => {
    stats[p.rsvpStatus]++;
    if (p.rsvpStatus === 'going') {
      stats.totalPlusOnes += p.plusOnes;
    }
  });
  
  stats.responseRate = stats.total > 0 
    ? ((stats.going + stats.maybe + stats.notGoing) / stats.total * 100).toFixed(1)
    : 0;
  
  stats.totalAttending = stats.going + stats.totalPlusOnes;
  
  return stats;
};

/**
 * Find pending RSVPs for an event
 */
eventParticipantSchema.statics.findPendingRSVPs = function(eventId) {
  return this.find({ 
    event: eventId, 
    isActive: true,
    rsvpStatus: 'pending' 
  })
  .populate('user', 'fname lname email phone');
};

/**
 * Get participant by event and user
 */
eventParticipantSchema.statics.findParticipant = function(eventId, userId) {
  return this.findOne({ 
    event: eventId, 
    user: userId 
  })
  .populate('user', 'fname lname email profileImage');
};

/**
 * Check if user is participant
 */
eventParticipantSchema.statics.isParticipant = async function(eventId, userId) {
  const participant = await this.findOne({ 
    event: eventId, 
    user: userId,
    isActive: true 
  });
  return !!participant;
};

/**
 * Get unread count across all events for a user
 */
eventParticipantSchema.statics.getTotalUnread = async function(userId) {
  const participants = await this.find({ 
    user: userId,
    isActive: true 
  });
  
  return participants.reduce((total, p) => total + p.unreadCount, 0);
};

// ========================================
// MIDDLEWARE
// ========================================

// Auto-set invitedAt if not set
eventParticipantSchema.pre('save', function(next) {
  if (this.isNew && !this.invitedAt) {
    this.invitedAt = new Date();
  }
  next();
});

// Check if mute has expired
eventParticipantSchema.pre('save', function(next) {
  if (this.chatSettings.isMuted && this.chatSettings.mutedUntil) {
    if (new Date() > this.chatSettings.mutedUntil) {
      this.chatSettings.isMuted = false;
      this.chatSettings.mutedUntil = null;
    }
  }
  next();
});

// ========================================
// EXPORT
// ========================================

// Ensure virtuals are included in JSON
eventParticipantSchema.set('toJSON', { virtuals: true });
eventParticipantSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('EventParticipant', eventParticipantSchema);