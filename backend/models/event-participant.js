const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventParticipantSchema = new Schema({
    event: { 
      type: mongoose.Types.ObjectId, 
      ref: 'InvestmentEvent', 
      required: true 
    },
    
    user: { 
      type: mongoose.Types.ObjectId, 
      ref: 'User', 
      required: true 
    },
    
    // Participant role in event
    role: {
      type: String,
      enum: ['creator', 'recipient', 'contributor', 'invited'],
      required: true
    },
    
    // Chat-specific settings
    chatSettings: {
      isMuted: { type: Boolean, default: false },
      mutedUntil: Date,
      
      notificationPreferences: {
        newMessages: { type: Boolean, default: true },
        contributions: { type: Boolean, default: true },
        stockUpdates: { type: Boolean, default: true },
        milestones: { type: Boolean, default: true },
        mentions: { type: Boolean, default: true }
      }
    },
    
    // Track unread messages
    lastReadMessageId: { type: mongoose.Types.ObjectId, ref: 'Message' },
    lastReadAt: Date,
    unreadCount: { type: Number, default: 0 },
    
    // Participant status
    joinedAt: { type: Date, default: Date.now },
    leftAt: Date,
    isActive: { type: Boolean, default: true }
    
  }, { timestamps: true });
  
  // Compound index for unique participant per event
  eventParticipantSchema.index({ event: 1, user: 1 }, { unique: true });
  
  module.exports = mongoose.model('EventParticipant', eventParticipantSchema);