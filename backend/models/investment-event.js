const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const investmentEventSchema = new Schema({
    eventType: { type: String, enum: ['birthday', 'wedding', 'graduation', 'baby', 'anniversary', 'custom'], required: true },
    recipientUser: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    eventDate: { type: Date, required: true },
    eventTitle: { type: String, required: true },
    eventDescription: { type: String },
    eventImage: { type: String },
    
    targetAmount: { type: Number, required: true },
    currentAmount: { type: Number, default: 0 },
    contributionDeadline: { type: Date, required: true },
    
    selectedInvestments: [{
      symbol: { type: String, required: true },
      name: { type: String },
      type: { type: String, enum: ['stock', 'etf'] },
      targetShares: { type: Number },
      allocatedAmount: { type: Number },
      purchasePrice: { type: Number },
      purchaseDate: { type: Date },
      currentPrice: { type: Number },
      broker: { type: String },
      transactionId: { type: String }
    }],
    
    contributors: [{
      user: { type: mongoose.Types.ObjectId, ref: 'User' },
      amount: { type: Number },
      contributedAt: { type: Date },
      stripePaymentId: { type: String },
      message: { type: String },
      isAnonymous: { type: Boolean, default: false }
    }],
    
    invitedUsers: [{ type: mongoose.Types.ObjectId, ref: 'User' }],
    
    status: { 
      type: String, 
      enum: [
        'draft',     
        'active',           // Collecting contributions
        'funded',           // ✅ NEW: Goal reached, ready to invest
        'purchasing',       // ✅ NEW: Host is buying stocks
        'invested',         // ✅ NEW: Stocks purchased
        'completed',        // Gift delivered
        'cancelled'         // Event cancelled
      ],
      default: 'draft'
    },
    
    privacyLevel: { type: String, enum: ['public', 'private', 'friends'], default: 'friends' },
    
    purchaseDetails: {
      broker: { type: String },
      accountId: { type: String },
      transactionIds: [String],
      completedAt: { type: Date },
      totalShares: { type: Number },
      averagePrice: { type: Number }
    },
    
    notifications: {
      milestones: [{ amount: Number, reachedAt: Date }],
      lastUpdateSent: { type: Date }
    }
  }, { timestamps: true });

  module.exports = mongoose.model('InvestmentEvent', investmentEventSchema);  