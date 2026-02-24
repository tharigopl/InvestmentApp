const { StripeCustomer, StripePaymentIntent } = require('../models/stripe-models');
const Contribution = require('../models/contribution');
//const InvestmentEvent = require('../models/investment-event');
const InvestmentEvent = require('../models/event');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Create contribution payment
exports.createContribution = async (req, res) => {
  const { eventId, amount, message, isAnonymous } = req.body;
  const userId = req.userData.userId;
  
  try {
    // Get or create Stripe Customer
    let stripeCustomer = await StripeCustomer.findOne({ user: userId });
    
    if (!stripeCustomer) {
      const user = await User.findById(userId);
      
      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.fname} ${user.lname}`,
        metadata: { userId: userId.toString() }
      });
      
      stripeCustomer = new StripeCustomer({
        user: userId,
        stripeCustomerId: customer.id,
        email: user.email,
        name: `${user.fname} ${user.lname}`
      });
      
      await stripeCustomer.save();
      
      // Update user
      user.stripeCustomerId = customer.id;
      await user.save();
    }
    
    // Create Payment Intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert to cents
      currency: 'usd',
      customer: stripeCustomer.stripeCustomerId,
      metadata: {
        eventId,
        userId: userId.toString(),
        type: 'investment_contribution'
      }
    });
    
    // Create contribution record
    const contribution = new Contribution({
      event: eventId,
      contributor: userId,
      amount,
      paymentIntentId: paymentIntent.id,
      message,
      status: 'pending',
      isAnonymous
    });
    
    await contribution.save();
    
    // Create payment intent record
    const paymentIntentRecord = new StripePaymentIntent({
      contribution: contribution._id,
      event: eventId,
      contributor: userId,
      paymentIntentId: paymentIntent.id,
      amount: amount * 100,
      currency: 'usd',
      status: paymentIntent.status,
      clientSecret: paymentIntent.client_secret,
      fees: {
        stripeFee: (amount * 0.029 + 0.30) * 100,
        applicationFee: 0,
        netAmount: (amount - (amount * 0.029 + 0.30)) * 100
      }
    });
    
    await paymentIntentRecord.save();
    
    res.json({
      clientSecret: paymentIntent.client_secret,
      contributionId: contribution._id,
      paymentIntentId: paymentIntent.id
    });
    
  } catch (error) {
    console.error('Contribution error:', error);
    res.status(500).json({ message: 'Failed to create contribution' });
  }
};

// Confirm contribution
exports.confirmContribution = async (req, res) => {
  const { paymentIntentId } = req.body;
  
  try {
    // Verify with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status === 'succeeded') {
      // Update payment intent record
      await StripePaymentIntent.findOneAndUpdate(
        { paymentIntentId },
        { 
          status: 'succeeded',
          succeededAt: new Date(),
          amountReceived: paymentIntent.amount_received
        }
      );
      
      // Update contribution
      const paymentRecord = await StripePaymentIntent.findOne({ paymentIntentId });
      const contribution = await Contribution.findByIdAndUpdate(
        paymentRecord.contribution,
        { status: 'succeeded' },
        { new: true }
      );
      
      // Update event total
      const event = await InvestmentEvent.findById(contribution.event);
      event.currentAmount += contribution.amount;
      event.contributors.push({
        user: contribution.contributor,
        amount: contribution.amount,
        contributedAt: new Date(),
        stripePaymentId: paymentIntentId,
        message: contribution.message,
		isAnonymous: contribution.isAnonymous
      });
      
      // Check if fully funded
      if (event.currentAmount >= event.targetAmount && event.status === 'active') {
        event.status = 'funded';
        // Trigger stock purchase workflow
        // await initiateStockPurchase(event._id);
      }
      
      await event.save();
      
      res.json({ 
        success: true, 
        contribution,
        event 
      });
    } else {
      res.status(400).json({ message: 'Payment not completed' });
    }
    
  } catch (error) {
    console.error('Confirmation error:', error);
    res.status(500).json({ message: 'Failed to confirm contribution' });
  }
};

module.exports = exports;