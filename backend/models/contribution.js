const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const contributionSchema = new Schema({
    event: { type: mongoose.Types.ObjectId, ref: 'InvestmentEvent', required: true },
    contributor: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    amount: { type: Number, required: true },
    
    paymentDetails: {
      stripePaymentIntentId: { type: String, required: true },
      status: { type: String, enum: ['pending', 'succeeded', 'failed', 'refunded'] },
      fees: { type: Number },
      netAmount: { type: Number },
      currency: { type: String, default: 'USD' }
    },
    
    message: { type: String },
    isAnonymous: { type: Boolean, default: false },
    
    refundDetails: {
      refunded: { type: Boolean, default: false },
      refundAmount: { type: Number },
      refundedAt: { type: Date },
      reason: { type: String }
    }
  }, { timestamps: true });

  module.exports = mongoose.model('Contribution', contributionSchema);