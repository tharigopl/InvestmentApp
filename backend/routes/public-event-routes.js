const express = require('express');
const router = express.Router();
const Event = require('../models/event');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * GET /api/public/events/:shareId
 * Get public event details (no auth required)
 */
router.get('/events/:shareId', async (req, res) => {
  try {
    const { shareId } = req.params;
    
    // Find event by shareId
    const event = await Event.findOne({ shareId, isPublic: true })
      .populate('recipientUser', 'fname lname profileImage')
      .populate('createdBy', 'fname lname')
      .select('-invitedUsers -__v'); // Don't expose private data
    
    if (!event) {
      return res.status(404).json({ message: 'Event not found or not public' });
    }
    
    // Filter contributors based on privacy settings
    let contributors = event.contributors;
    if (!event.publicSettings?.showContributors) {
      contributors = [];
    } else {
      // Hide anonymous contributors' details
      contributors = contributors.map(c => ({
        amount: c.amount,
        message: c.message,
        name: c.isAnonymous ? 'Anonymous' : (c.guestName || c.user?.fname),
        createdAt: c.createdAt,
      }));
    }
    
    // Filter guest list based on privacy settings
    let guestList = [];
    if (event.publicSettings?.showGuestList) {
      guestList = event.guestList
        .filter(g => g.rsvpStatus === 'going')
        .map(g => ({
          name: g.name,
          rsvpStatus: g.rsvpStatus,
        }));
    }
    
    // Calculate RSVP stats
    const rsvpStats = event.calculateRSVPStats();
    
    // Return public event data
    res.json({
      event: {
        _id: event._id,
        shareId: event.shareId,
        eventType: event.eventType,
        eventTitle: event.eventTitle,
        eventDate: event.eventDate,
        eventTime: event.eventTime,
        eventDescription: event.eventDescription,
        
        // Location
        location: event.location,
        
        // Design
        design: event.design,
        
        // Registry info
        registryType: event.registryType,
        hasGoal: event.hasGoal,
        targetAmount: event.targetAmount,
        currentAmount: event.currentAmount,
        
        // Selected stocks (if stock registry)
        selectedInvestments: event.registryType === 'stock' ? event.selectedInvestments : undefined,
        
        // Cash fund info
        cashFund: event.registryType === 'cash_fund' ? event.cashFund : undefined,
        
        // Recipient
        recipientUser: event.recipientUser ? {
          name: `${event.recipientUser.fname} ${event.recipientUser.lname}`,
          profileImage: event.recipientUser.profileImage,
        } : null,
        
        // Host
        createdBy: event.createdBy ? {
          name: `${event.createdBy.fname} ${event.createdBy.lname}`,
        } : null,
        
        // Public settings
        publicSettings: event.publicSettings,
        
        // Stats
        rsvpStats,
        contributorCount: contributors.length,
        
        // Filtered data
        contributors,
        guestList,
      }
    });
    
  } catch (error) {
    console.error('Error fetching public event:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /api/public/events/:shareId/rsvp
 * RSVP to event (no auth required)
 */
router.post('/events/:shareId/rsvp', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { name, email, phone, rsvpStatus, plusOnes, dietaryRestrictions } = req.body;
    
    // Validation
    if (!name || !email || !rsvpStatus) {
      return res.status(400).json({ message: 'Name, email, and RSVP status are required' });
    }
    
    // Find event
    const event = await Event.findOne({ shareId, isPublic: true });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if guest RSVP is allowed
    if (!event.publicSettings?.allowGuestRSVP) {
      return res.status(403).json({ message: 'Guest RSVP is not allowed for this event' });
    }
    
    // Check if already RSVP'd
    const existingGuest = event.guestList.find(g => 
      g.email?.toLowerCase() === email.toLowerCase()
    );
    
    if (existingGuest) {
      // Update existing RSVP
      existingGuest.name = name;
      existingGuest.rsvpStatus = rsvpStatus;
      existingGuest.plusOnes = plusOnes || 0;
      existingGuest.dietaryRestrictions = dietaryRestrictions;
      existingGuest.respondedAt = new Date();
    } else {
      // Add new guest
      event.guestList.push({
        name,
        email,
        phone,
        rsvpStatus,
        plusOnes: plusOnes || 0,
        dietaryRestrictions,
        inviteMethod: 'email',
        invitedAt: new Date(),
        respondedAt: new Date(),
      });
    }
    
    await event.save();
    
    res.json({
      message: 'RSVP recorded successfully',
      rsvpStatus,
    });
    
  } catch (error) {
    console.error('Error saving RSVP:', error);
    res.status(500).json({ message: 'Failed to save RSVP' });
  }
});

/**
 * POST /api/public/events/:shareId/contribute
 * Record guest contribution (called after payment success)
 */
router.post('/events/:shareId/contribute', async (req, res) => {
  try {
    const { shareId } = req.params;
    const { 
      guestName, 
      guestEmail, 
      amount, 
      message, 
      isAnonymous,
      stripePaymentId,
    } = req.body;
    
    // Validation
    console.log(guestName);
    console.log(guestEmail);
    console.log(amount);
    console.log(stripePaymentId);

    if (!guestName || !guestEmail || !amount || !stripePaymentId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    // Find event
    const event = await Event.findOne({ shareId, isPublic: true });
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if guest contributions are allowed
    if (!event.publicSettings?.allowGuestContributions) {
      return res.status(403).json({ message: 'Guest contributions are not allowed' });
    }
    
    // Add contribution
    event.contributors.push({
      guestName,
      guestEmail,
      amount: parseFloat(amount),
      message,
      isAnonymous: isAnonymous || false,
      stripePaymentId,
      paymentStatus: 'completed',
      createdAt: new Date(),
    });
    
    // Update current amount
    event.currentAmount += parseFloat(amount);
    
    await event.save();
    
    // TODO: Send thank you email to contributor
    // TODO: Notify event creator
    
    res.json({
      message: 'Contribution recorded successfully',
      currentAmount: event.currentAmount,
      targetAmount: event.targetAmount,
    });
    
  } catch (error) {
    console.error('Error recording contribution:', error);
    res.status(500).json({ message: 'Failed to record contribution' });
  }
});

/**
 * POST /api/public/payments/create-payment-intent
 * Create Stripe payment intent for guest contributions (no auth required)
 */
router.post('/payments/create-payment-intent', async (req, res) => {
    try {
      const { amount, eventId, isGuest, guestEmail, guestName } = req.body;
      
      // Validation
      if (!amount || amount < 1) {
        return res.status(400).json({ message: 'Invalid amount' });
      }
      
      if (!eventId) {
        return res.status(400).json({ message: 'Event ID required' });
      }
      
      // Verify event exists
      const Event = require('../models/event');
      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Check if guest contributions are allowed
      if (!event.publicSettings?.allowGuestContributions) {
        return res.status(403).json({ message: 'Guest contributions not allowed for this event' });
      }
      
      // Create Stripe payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: 'usd',
        metadata: {
          eventId: eventId.toString(),
          eventTitle: event.eventTitle,
          isGuest: isGuest ? 'true' : 'false',
          guestEmail: guestEmail || '',
          guestName: guestName || '',
        },
        receipt_email: guestEmail,
        description: `Contribution to ${event.eventTitle}`,
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
      
    } catch (error) {
      console.error('Error creating payment intent:', error);
      res.status(500).json({ 
        message: 'Failed to create payment intent',
        error: error.message 
      });
    }
  });

module.exports = router;