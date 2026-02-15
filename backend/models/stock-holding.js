const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const stockHoldingSchema = new Schema({
  user: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true },
  shares: { type: Number, required: true },
  averageCost: { type: Number, required: true },
  
  giftEvents: [{
    eventId: { type: mongoose.Types.ObjectId, ref: 'InvestmentEvent' },
    sharesFromEvent: { type: Number },
    costBasis: { type: Number },
    acquiredDate: { type: Date }
  }],
  
  brokerageDetails: {
    provider: { type: String },
    accountId: { type: String },
    positionId: { type: String }
  },
  
  currentValue: { type: Number },
  lastUpdated: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('StockHolding', stockHoldingSchema);