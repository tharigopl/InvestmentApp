// @ts-nocheck

const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const messageSchema = new Schema({
  // Core Message Info
  event: { 
    type: mongoose.Types.ObjectId, 
    ref: 'InvestmentEvent', 
    required: true,
    index: true // Faster queries by event
  },
  
  sender: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User',
    required: function() {
      return this.messageType !== 'system';
    }
  },
  
  // Message Types
  messageType: {
    type: String,
    enum: [
      'text',           // Regular chat message
      'contribution',   // "John contributed $100!"
      'stockUpdate',    // "AAPL is now $180.50 (+2.3%)"
      'milestone',      // "🎉 50% funded!"
      'eventUpdate',    // "Event deadline extended"
      'purchaseComplete', // "Stocks purchased successfully"
      'system',         // Automated system messages
      'announcement'    // Creator announcements
    ],
    required: true,
    default: 'text'
  },
  
  // Message Content
  content: {
    text: { type: String, required: true },
    
    // Optional formatted content for rich display
    formatted: { type: String },
    
    // Mentions in the message
    mentions: [{
      user: { type: mongoose.Types.ObjectId, ref: 'User' },
      username: String
    }]
  },
  
  // Metadata (context-specific data)
  metadata: {
    // For contribution messages
    contribution: {
      amount: Number,
      contributionId: { type: mongoose.Types.ObjectId, ref: 'Contribution' },
      isFirstContribution: Boolean,
      newTotal: Number,
      percentageOfGoal: Number
    },
    
    // For stock update messages
    stockUpdate: {
      symbol: String,
      previousPrice: Number,
      currentPrice: Number,
      priceChange: Number,
      percentChange: Number,
      timestamp: Date
    },
    
    // For milestone messages
    milestone: {
      milestoneType: {
        type: String,
        enum: ['25_percent', '50_percent', '75_percent', '100_percent', 'deadline_near', 'first_contribution']
      },
      currentAmount: Number,
      targetAmount: Number,
      percentageReached: Number
    },
    
    // For purchase complete messages
    purchase: {
      totalShares: Number,
      averagePrice: Number,
      symbols: [String],
      transactionIds: [String],
      completedAt: Date
    },
    
    // For event updates
    eventUpdate: {
      updateType: {
        type: String,
        enum: ['deadline_extended', 'goal_increased', 'stocks_changed', 'cancelled']
      },
      oldValue: mongoose.Schema.Types.Mixed,
      newValue: mongoose.Schema.Types.Mixed
    }
  },
  
  // Attachments (images, documents)
  attachments: [{
    type: {
      type: String,
      enum: ['image', 'document', 'video']
    },
    url: String,
    filename: String,
    size: Number,
    mimeType: String
  }],
  
  // Reactions/Engagement
  reactions: [{
    user: { type: mongoose.Types.ObjectId, ref: 'User' },
    emoji: String,
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Message Status
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read', 'failed'],
    default: 'sent'
  },
  
  // Read Receipts
  readBy: [{
    user: { type: mongoose.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now }
  }],
  
  // Moderation
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  
  // System flags
  isPinned: { type: Boolean, default: false },
  pinnedBy: { type: mongoose.Types.ObjectId, ref: 'User' },
  pinnedAt: Date,
  
  // Reply threading
  replyTo: { type: mongoose.Types.ObjectId, ref: 'Message' },
  replyCount: { type: Number, default: 0 }
  
}, { 
  timestamps: true // Adds createdAt and updatedAt
});

// Indexes for performance
messageSchema.index({ event: 1, createdAt: -1 }); // Get messages by event, newest first
messageSchema.index({ sender: 1, createdAt: -1 }); // Get messages by user
messageSchema.index({ messageType: 1, event: 1 }); // Filter by type
messageSchema.index({ 'readBy.user': 1 }); // Check read status

// Virtual for reply messages
messageSchema.virtual('replies', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'replyTo'
});

module.exports = mongoose.model('Message', messageSchema);