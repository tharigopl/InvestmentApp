const mongoose = require('mongoose');
const logger = require('../util/logger');
const HttpError = require('../models/http-error');

// Models
const InvestmentEvent = require('../models/investment-event');
const User = require('../models/user');
const Contribution = require('../models/contribution');

// Services
const stockService = require('../util/stock-service');

// ============================================
// GET ALL EVENTS (with filters)
// ============================================

/**
 * Get all events with optional filters
 * GET /api/events?status=active&limit=20
 */
const getEvents = async (req, res, next) => {
  const startTime = Date.now();
  const { status, userId, recipient, limit = 50, skip = 0 } = req.query;

  logger.info('getEvents - START', {
    status,
    userId,
    recipient,
    limit,
    requestId: req.id,
  });

  try {
    // Build filter object
    const filter = {};

    if (status) {
      filter.status = status;
    }

    if (userId) {
      filter.createdBy = userId;
    }

    if (recipient) {
      filter.recipientUser = recipient;
    }

    // Get events with populated references
    const events = await InvestmentEvent.find(filter)
      .populate('recipientUser', 'fname lname email image')
      .populate('createdBy', 'fname lname email')
      .populate('contributors.user', 'fname lname image')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    // Get fresh stock prices for events with investments
    const eventsWithPrices = await Promise.all(
      events.map(async (event) => {
        const eventObj = event.toObject();
        
        if (eventObj.selectedInvestments && eventObj.selectedInvestments.length > 0) {
          // Update current prices
          for (let investment of eventObj.selectedInvestments) {
            try {
              const quote = await stockService.getStockQuote(investment.symbol);
              investment.currentPrice = quote.price;
            } catch (error) {
              logger.warn('Failed to get stock price', {
                symbol: investment.symbol,
                error: error.message,
              });
            }
          }
        }

        return eventObj;
      })
    );

    const duration = Date.now() - startTime;
    logger.info('getEvents - SUCCESS', {
      count: events.length,
      duration: `${duration}ms`,
    });

    res.json({
      events: eventsWithPrices,
      count: eventsWithPrices.length,
      total: await InvestmentEvent.countDocuments(filter),
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getEvents - ERROR', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch events: ' + error.message, 500)
    );
  }
};

// ============================================
// GET SINGLE EVENT
// ============================================

/**
 * Get event by ID
 * GET /api/events/:eventId
 */
const getEventById = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId } = req.params;

  logger.info('getEventById - START', { eventId, requestId: req.id });

  try {
    const event = await InvestmentEvent.findById(eventId)
      .populate('recipientUser', 'fname lname email image investmentProfile')
      .populate('createdBy', 'fname lname email image')
      .populate('contributors.user', 'fname lname image')
      .populate('invitedUsers', 'fname lname email image');

    if (!event) {
      logger.warn('Event not found', { eventId });
      return next(new HttpError('Event not found', 404));
    }

    // Update stock prices
    const eventObj = event.toObject();
    if (eventObj.selectedInvestments && eventObj.selectedInvestments.length > 0) {
      for (let investment of eventObj.selectedInvestments) {
        try {
          const quote = await stockService.getStockQuote(investment.symbol);
          investment.currentPrice = quote.price;
        } catch (error) {
          logger.warn('Failed to get stock price', {
            symbol: investment.symbol,
            error: error.message,
          });
        }
      }
    }

    // Get contribution details
    const contributions = await Contribution.find({ event: eventId })
      .populate('contributor', 'fname lname image')
      .sort({ createdAt: -1 });

    const duration = Date.now() - startTime;
    logger.info('getEventById - SUCCESS', {
      eventId,
      eventTitle: event.eventTitle,
      duration: `${duration}ms`,
    });

    res.json({
      event: eventObj,
      contributions,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getEventById - ERROR', {
      eventId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch event: ' + error.message, 500)
    );
  }
};

// ============================================
// CREATE EVENT
// ============================================

/**
 * Create new investment event
 * POST /api/events
 */
const createEvent = async (req, res, next) => {
  const startTime = Date.now();
  const userId = req.userData.userId;
  const {
    eventType,
    recipientUserId,
    eventDate,
    eventTitle,
    eventDescription,
    eventImage,
    targetAmount,
    contributionDeadline,
    selectedInvestments,
    invitedUsers,
    privacyLevel,
  } = req.body;

  logger.info('createEvent - START', {
    userId,
    eventTitle,
    targetAmount,
    recipientUserId,
    requestId: req.id,
  });

  try {
    // Validate required fields
    if (!eventType || !recipientUserId || !eventDate || !eventTitle || !targetAmount || !contributionDeadline) {
      return next(
        new HttpError('Missing required fields', 400)
      );
    }

    console.log('✅ Step 1: Required fields validated');

    // Validate recipient exists
    console.log('🔍 Step 2: Looking for recipient user:', recipientUserId);
    const recipient = await User.findById(recipientUserId);
    if (!recipient) {
      console.log('❌ Recipient user not found in database');
      return next(new HttpError('Recipient user not found', 404));
    }
    console.log('✅ Step 2: Recipient user found:', recipient.email);

    // Validate creator exists
    console.log('🔍 Step 3: Looking for creator user:', userId);
    const creator = await User.findById(userId);
    if (!creator) {
      console.log('❌ Creator user not found in database');
      return next(new HttpError('Creator user not found', 404));
    }
    console.log('✅ Step 3: Creator user found:', creator.email);

    // Validate and enrich stock investments
    let enrichedInvestments = [];
    console.log('📊 Step 4: Processing', selectedInvestments?.length || 0, 'investments');
    if (selectedInvestments && selectedInvestments.length > 0) {
      for (let investment of selectedInvestments) {
        try {
          console.log('  🔍 Fetching stock data for:', investment.symbol);
          // Get stock info
          const stockInfo = await stockService.getStockInfo(investment.symbol);
          const quote = await stockService.getStockQuote(investment.symbol);

          enrichedInvestments.push({
            symbol: investment.symbol,
            name: stockInfo.name,
            type: investment.type || 'stock',
            allocatedAmount: investment.allocatedAmount || 0,
            currentPrice: quote.price,
            targetShares: investment.allocatedAmount
              ? stockService.calculateShares(investment.allocatedAmount, quote.price)
              : 0,
          });
          console.log('  ✅ Enriched:', investment.symbol);
        } catch (error) {
          logger.warn('Failed to enrich stock data', {
            symbol: investment.symbol,
            error: error.message,
          });
          console.log('  ⚠️ Using basic data for:', investment.symbol);
          // Continue with basic info
          enrichedInvestments.push({
            symbol: investment.symbol,
            name: investment.symbol,
            type: investment.type || 'stock',
            allocatedAmount: investment.allocatedAmount || 0,
          });
        }
      }
    }
    console.log('✅ Step 4: Investments processed');

    // Create event
    console.log('📝 Step 5: Creating event object');
    const eventData = {
      eventType,
      recipientUser: recipientUserId,
      createdBy: userId,
      eventDate,
      eventTitle,
      eventDescription: eventDescription || '',
      eventImage: eventImage || '',
      targetAmount,
      contributionDeadline,
      selectedInvestments: enrichedInvestments,
      invitedUsers: invitedUsers || [],
      privacyLevel: privacyLevel || 'friends',
      status: 'active',
      currentAmount: 0,
      contributors: [],
    };
    console.log('✅ Step 5: Event object created');

    console.log('💾 Step 6: Creating mongoose document');
    const event = new InvestmentEvent(eventData);
    console.log('✅ Step 6: Mongoose document created');

    console.log('💾 Step 7: Saving to database...');
    await event.save();
    console.log('✅ Step 7: Event saved to database');

    // Populate references before returning
    console.log('🔗 Step 8: Populating references...');
    try {
      await event.populate('recipientUser', 'fname lname email image');
      console.log('  ✅ Populated recipientUser');
      await event.populate('createdBy', 'fname lname email');
      console.log('  ✅ Populated createdBy');
    } catch (populateError) {
      console.log('  ⚠️ Populate failed (non-critical):', populateError.message);
      // Continue without populated fields
    }
    console.log('✅ Step 8: Populate complete');

    const duration = Date.now() - startTime;
    logger.info('createEvent - SUCCESS', {
      eventId: event._id,
      eventTitle: event.eventTitle,
      duration: `${duration}ms`,
    });

    console.log('✅ SUCCESS: Event created with ID:', event._id);

    res.status(201).json({
      event,
      message: 'Event created successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('createEvent - ERROR', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to create event: ' + error.message, 500)
    );
  }
};

// ============================================
// UPDATE EVENT
// ============================================

/**
 * Update event
 * PATCH /api/events/:eventId
 */
const updateEvent = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId } = req.params;
  const userId = req.userData.userId;
  const updates = req.body;

  logger.info('updateEvent - START', {
    eventId,
    userId,
    updates: Object.keys(updates),
    requestId: req.id,
  });

  try {
    const event = await InvestmentEvent.findById(eventId);

    if (!event) {
      return next(new HttpError('Event not found', 404));
    }

    // Check if user is creator
    if (event.createdBy.toString() !== userId) {
      return next(
        new HttpError('Not authorized to update this event', 403)
      );
    }

    // Don't allow updates to completed/cancelled events
    if (event.status === 'completed' || event.status === 'cancelled') {
      return next(
        new HttpError(
          `Cannot update event with status: ${event.status}`,
          400
        )
      );
    }

    // Update allowed fields
    const allowedUpdates = [
      'eventTitle',
      'eventDescription',
      'eventImage',
      'eventDate',
      'targetAmount',
      'contributionDeadline',
      'selectedInvestments',
      'invitedUsers',
      'privacyLevel',
    ];

    for (let key of allowedUpdates) {
      if (updates[key] !== undefined) {
        event[key] = updates[key];
      }
    }

    await event.save();

    await event.populate('recipientUser', 'fname lname email image');
    await event.populate('createdBy', 'fname lname email');

    const duration = Date.now() - startTime;
    logger.info('updateEvent - SUCCESS', {
      eventId,
      duration: `${duration}ms`,
    });

    res.json({
      event,
      message: 'Event updated successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('updateEvent - ERROR', {
      eventId,
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to update event: ' + error.message, 500)
    );
  }
};

// ============================================
// DELETE EVENT
// ============================================

/**
 * Delete event
 * DELETE /api/events/:eventId
 */
const deleteEvent = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId } = req.params;
  const userId = req.userData.userId;

  logger.info('deleteEvent - START', { eventId, userId, requestId: req.id });

  try {
    const event = await InvestmentEvent.findById(eventId);

    if (!event) {
      return next(new HttpError('Event not found', 404));
    }

    // Check if user is creator
    if (event.createdBy.toString() !== userId) {
      return next(
        new HttpError('Not authorized to delete this event', 403)
      );
    }

    // Don't allow deleting events with contributions
    if (event.currentAmount > 0) {
      return next(
        new HttpError(
          'Cannot delete event with contributions. Cancel it instead.',
          400
        )
      );
    }

    await InvestmentEvent.findByIdAndDelete(eventId);

    const duration = Date.now() - startTime;
    logger.info('deleteEvent - SUCCESS', {
      eventId,
      duration: `${duration}ms`,
    });

    res.json({
      success: true,
      message: 'Event deleted successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('deleteEvent - ERROR', {
      eventId,
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to delete event: ' + error.message, 500)
    );
  }
};

// ============================================
// GET USER'S CREATED EVENTS
// ============================================

/**
 * Get events created by authenticated user
 * GET /api/events/my-events
 */
const getMyEvents = async (req, res, next) => {
  const startTime = Date.now();
  const userId = req.userData.userId;

  logger.info('getMyEvents - START', { userId, requestId: req.id });

  try {
    const events = await InvestmentEvent.find({ createdBy: userId })
      .populate('recipientUser', 'fname lname email image')
      .populate('contributors.user', 'fname lname image')
      .sort({ createdAt: -1 });

    const duration = Date.now() - startTime;
    logger.info('getMyEvents - SUCCESS', {
      userId,
      count: events.length,
      duration: `${duration}ms`,
    });

    res.json({
      events,
      count: events.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getMyEvents - ERROR', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch your events: ' + error.message, 500)
    );
  }
};

// ============================================
// GET EVENTS FOR ME (as recipient)
// ============================================

/**
 * Get events where authenticated user is the recipient
 * GET /api/events/for-me
 */
const getEventsForMe = async (req, res, next) => {
  const startTime = Date.now();
  const userId = req.userData.userId;

  logger.info('getEventsForMe - START', { userId, requestId: req.id });

  try {
    const events = await InvestmentEvent.find({ recipientUser: userId })
      .populate('createdBy', 'fname lname email image')
      .populate('contributors.user', 'fname lname image')
      .sort({ createdAt: -1 });

    const duration = Date.now() - startTime;
    logger.info('getEventsForMe - SUCCESS', {
      userId,
      count: events.length,
      duration: `${duration}ms`,
    });

    res.json({
      events,
      count: events.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getEventsForMe - ERROR', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch events for you: ' + error.message, 500)
    );
  }
};

// ============================================
// GET CONTRIBUTED EVENTS
// ============================================

/**
 * Get events user has contributed to
 * GET /api/events/contributed
 */
const getContributedEvents = async (req, res, next) => {
  const startTime = Date.now();
  const userId = req.userData.userId;

  logger.info('getContributedEvents - START', { userId, requestId: req.id });

  try {
    // Find all contributions by this user
    const contributions = await Contribution.find({ contributor: userId })
      .populate({
        path: 'event',
        populate: [
          { path: 'recipientUser', select: 'fname lname email image' },
          { path: 'createdBy', select: 'fname lname email' },
        ],
      })
      .sort({ createdAt: -1 });

    // Extract unique events
    const events = contributions
      .map((c) => c.event)
      .filter((event) => event !== null);

    const duration = Date.now() - startTime;
    logger.info('getContributedEvents - SUCCESS', {
      userId,
      count: events.length,
      duration: `${duration}ms`,
    });

    res.json({
      events,
      contributions,
      count: events.length,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getContributedEvents - ERROR', {
      userId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError(
        'Failed to fetch contributed events: ' + error.message,
        500
      )
    );
  }
};

// ============================================
// INVITE PARTICIPANTS
// ============================================

/**
 * Invite users to event
 * POST /api/events/:eventId/invite
 */
const inviteParticipants = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId } = req.params;
  const { userIds } = req.body;
  const userId = req.userData.userId;

  logger.info('inviteParticipants - START', {
    eventId,
    userIds,
    requestId: req.id,
  });

  try {
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return next(new HttpError('Invalid userIds array', 400));
    }

    const event = await InvestmentEvent.findById(eventId);

    if (!event) {
      return next(new HttpError('Event not found', 404));
    }

    // Check if user is creator
    if (event.createdBy.toString() !== userId) {
      return next(
        new HttpError('Not authorized to invite to this event', 403)
      );
    }

    // Add new invites (avoid duplicates)
    const existingInvites = event.invitedUsers.map((id) => id.toString());
    const newInvites = userIds.filter(
      (id) => !existingInvites.includes(id.toString())
    );

    event.invitedUsers.push(...newInvites);
    await event.save();

    await event.populate('invitedUsers', 'fname lname email image');

    const duration = Date.now() - startTime;
    logger.info('inviteParticipants - SUCCESS', {
      eventId,
      newInvites: newInvites.length,
      duration: `${duration}ms`,
    });

    res.json({
      event,
      newInvites: newInvites.length,
      message: `${newInvites.length} user(s) invited successfully`,
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('inviteParticipants - ERROR', {
      eventId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to invite participants: ' + error.message, 500)
    );
  }
};

// ============================================
// GET EVENT PARTICIPANTS
// ============================================

/**
 * Get event participants (invited users and contributors)
 * GET /api/events/:eventId/participants
 */
const getEventParticipants = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId } = req.params;

  logger.info('getEventParticipants - START', { eventId, requestId: req.id });

  try {
    const event = await InvestmentEvent.findById(eventId)
      .populate('invitedUsers', 'fname lname email image')
      .populate('contributors.user', 'fname lname email image');

    if (!event) {
      return next(new HttpError('Event not found', 404));
    }

    const participants = {
      invited: event.invitedUsers,
      contributors: event.contributors,
      totalInvited: event.invitedUsers.length,
      totalContributors: event.contributors.length,
    };

    const duration = Date.now() - startTime;
    logger.info('getEventParticipants - SUCCESS', {
      eventId,
      totalInvited: participants.totalInvited,
      totalContributors: participants.totalContributors,
      duration: `${duration}ms`,
    });

    res.json(participants);
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('getEventParticipants - ERROR', {
      eventId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to fetch participants: ' + error.message, 500)
    );
  }
};

// ============================================
// CANCEL EVENT
// ============================================

/**
 * Cancel event
 * POST /api/events/:eventId/cancel
 */
const cancelEvent = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId } = req.params;
  const { reason } = req.body;
  const userId = req.userData.userId;

  logger.info('cancelEvent - START', { eventId, reason, requestId: req.id });

  try {
    const event = await InvestmentEvent.findById(eventId);

    if (!event) {
      return next(new HttpError('Event not found', 404));
    }

    // Check if user is creator
    if (event.createdBy.toString() !== userId) {
      return next(
        new HttpError('Not authorized to cancel this event', 403)
      );
    }

    // Can't cancel already completed events
    if (event.status === 'completed') {
      return next(new HttpError('Cannot cancel completed event', 400));
    }

    event.status = 'cancelled';
    event.eventDescription = `${event.eventDescription}\n\nCancellation Reason: ${reason || 'Not provided'}`;

    await event.save();

    // TODO: Trigger refunds for all contributions

    const duration = Date.now() - startTime;
    logger.info('cancelEvent - SUCCESS', {
      eventId,
      duration: `${duration}ms`,
    });

    res.json({
      event,
      message: 'Event cancelled successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('cancelEvent - ERROR', {
      eventId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to cancel event: ' + error.message, 500)
    );
  }
};

// ============================================
// COMPLETE EVENT
// ============================================

/**
 * Mark event as completed
 * POST /api/events/:eventId/complete
 */
const completeEvent = async (req, res, next) => {
  const startTime = Date.now();
  const { eventId } = req.params;
  const userId = req.userData.userId;

  logger.info('completeEvent - START', { eventId, requestId: req.id });

  try {
    const event = await InvestmentEvent.findById(eventId);

    if (!event) {
      return next(new HttpError('Event not found', 404));
    }

    // Check if user is creator
    if (event.createdBy.toString() !== userId) {
      return next(
        new HttpError('Not authorized to complete this event', 403)
      );
    }

    // Must be purchased first
    if (event.status !== 'purchased') {
      return next(
        new HttpError('Event must be purchased before completing', 400)
      );
    }

    event.status = 'completed';
    await event.save();

    const duration = Date.now() - startTime;
    logger.info('completeEvent - SUCCESS', {
      eventId,
      duration: `${duration}ms`,
    });

    res.json({
      event,
      message: 'Event completed successfully',
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('completeEvent - ERROR', {
      eventId,
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`,
    });

    return next(
      new HttpError('Failed to complete event: ' + error.message, 500)
    );
  }
};

getFundsSummary = async (req, res, next) => {
  const { eventId } = req.params;
  const userId = req.userData.userId;

  try {
    const event = await InvestmentEvent.findById(eventId)
      .populate('contributors.user', 'fname lname')
      .populate('createdBy', 'fname lname');

    // Check if user is event creator
    if (event.createdBy._id.toString() !== userId.toString()) {
      return next(new HttpError('Unauthorized', 403));
    }

    // Calculate fees
    const totalFees = event.contributors.reduce((sum, c) => {
      return sum + (c.amount * 0.029 + 0.30);
    }, 0);

    const netAmount = event.currentAmount - totalFees;

    res.json({
      totalRaised: event.currentAmount,
      stripeFees: totalFees,
      netAmount: netAmount,
      contributors: event.contributors,
      status: event.status,
      selectedInvestments: event.selectedInvestments,
    });
  } catch (error) {
    return next(new HttpError('Failed to get funds summary', 500));
  }
};

initiateWithdrawal = async (req, res, next) => {
  const { eventId } = req.params;
  const userId = req.userData.userId;

  try {
    const event = await InvestmentEvent.findById(eventId)
      .populate('createdBy');

    // Verify user is event creator
    if (event.createdBy._id.toString() !== userId.toString()) {
      return next(new HttpError('Unauthorized', 403));
    }

    // Verify event is funded
    if (event.status !== 'funded') {
      return next(new HttpError('Event must be funded to withdraw', 400));
    }

    // Get user's Stripe connected account
    const user = await User.findById(userId);
    
    if (!user.stripeAccountId) {
      return next(new HttpError('No Stripe account connected', 400));
    }

    // Calculate net amount (after Stripe fees)
    const totalFees = event.contributors.reduce((sum, c) => {
      return sum + (c.amount * 0.029 + 0.30);
    }, 0);
    const netAmount = event.currentAmount - totalFees;

    // Create Stripe transfer/payout
    const transfer = await stripe.transfers.create({
      amount: Math.round(netAmount * 100), // Convert to cents
      currency: 'usd',
      destination: user.stripeAccountId,
      description: `Withdrawal for event: ${event.eventTitle}`,
      metadata: {
        eventId: event._id.toString(),
        userId: userId.toString(),
      }
    });

    // Update event status
    event.status = 'purchasing';
    await event.save();

    res.json({
      success: true,
      transferId: transfer.id,
      amount: netAmount,
      message: 'Withdrawal initiated. Funds will arrive in 2-3 business days.',
    });
  } catch (error) {
    console.error('Withdrawal error:', error);
    return next(new HttpError('Failed to initiate withdrawal', 500));
  }
};

markStocksPurchased = async (req, res, next) => {
  const { eventId } = req.params;
  const userId = req.userData.userId;
  const { purchaseDetails } = req.body; // Optional: proof of purchase

  try {
    const event = await InvestmentEvent.findById(eventId)
      .populate('createdBy')
      .populate('recipientUser', 'fname lname email');

    // Verify user is event creator
    if (event.createdBy._id.toString() !== userId.toString()) {
      return next(new HttpError('Unauthorized', 403));
    }

    // Verify event is in purchasing state
    if (event.status !== 'purchasing' && event.status !== 'funded') {
      return next(new HttpError('Event must be in purchasing state', 400));
    }

    // Update event
    event.status = 'invested';
    event.purchasedAt = new Date();
    if (purchaseDetails) {
      event.purchaseDetails = purchaseDetails;
    }
    
    await event.save();

    // TODO: Send notification to recipient
    // await sendGiftNotification(event.recipientUser.email, event);

    res.json({
      success: true,
      event: event,
      message: 'Stocks marked as purchased! Recipient will be notified.',
    });
  } catch (error) {
    console.error('Mark purchased error:', error);
    return next(new HttpError('Failed to mark as purchased', 500));
  }
};

/**
 * GET /api/events/user/:userId
 * Get all events for a specific user (created by or contributed to)
 */
const getUserEvents = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    console.log(`[getUserEvents] Fetching events for user: ${userId}`);
    
    // Find events where user is creator OR has contributed
    const events = await InvestmentEvent.find({
      $or: [
        { createdBy: userId },          // ✅ Not "creator"
        { recipientUser: userId },       
        { 'contributors.user': userId }, // ✅ Not "contributions.contributor"
        { invitedUsers: userId }         
      ]
    })
    .populate('createdBy', 'fname lname email profileImage')
    .populate('recipientUser', 'fname lname email profileImage')
    .populate('contributors.user', 'fname lname email profileImage')
    .populate('invitedUsers', 'fname lname email profileImage')
    .sort({ createdAt: -1 });
    
    console.log(`[getUserEvents] Found ${events.length} events`);
    
    res.status(200).json({
      events: events,
      count: events.length
    });
  } catch (error) {
    console.error('[getUserEvents] Error:', error);
    res.status(500).json({
      message: 'Failed to fetch user events',
      error: error.message
    });
  }
};

// const getUserEvents = async (req, res, next) => {
//   try {
//     const { userId } = req.params;
    
//     console.log('='.repeat(60));
//     console.log(`[getUserEvents] DEBUGGING - Fetching events for user: ${userId}`);
//     console.log('='.repeat(60));
    
//     const Event = require('../models/investment-event');
    
//     // Step 1: Check total events in database
//     const totalEvents = await Event.countDocuments();
//     console.log(`📊 Total events in database: ${totalEvents}`);
    
//     // Step 2: Check if any events have this user as creator
//     const eventsAsCreator = await Event.find({ createdBy: userId });
//     console.log(`👤 Events where user is creator: ${eventsAsCreator.length}`);
//     if (eventsAsCreator.length > 0) {
//       console.log('Creator events:', eventsAsCreator.map(e => ({
//         id: e._id,
//         title: e.title || e.eventTitle,
//         creator: e.creator
//       })));
//     }
    
//     // Step 3: Check if any events have contributions from this user
//     const eventsWithContributions = await Event.find({
//       'contributions.contributor': userId
//     });
//     console.log(`💰 Events where user contributed: ${eventsWithContributions.length}`);
//     if (eventsWithContributions.length > 0) {
//       console.log('Contribution events:', eventsWithContributions.map(e => ({
//         id: e._id,
//         title: e.title || e.eventTitle,
//         contributions: e.contributions
//       })));
//     }
    
//     // Step 4: Get a sample event to check structure
//     const sampleEvent = await Event.findOne();
//     if (sampleEvent) {
//       console.log('\n📝 Sample event structure:');
//       console.log({
//         _id: sampleEvent._id,
//         title: sampleEvent.title || sampleEvent.eventTitle,
//         creator: sampleEvent.creator,
//         creatorType: typeof sampleEvent.creator,
//         hasContributions: !!sampleEvent.contributions,
//         contributionsLength: sampleEvent.contributions?.length || 0,
//         sampleContribution: sampleEvent.contributions?.[0] || null
//       });
//     }
    
//     // Step 5: Try the actual query
//     console.log('\n🔍 Running actual query with $or...');
//     const events = await Event.find({
//       $or: [
//         { creator: userId },
//         { 'contributions.contributor': userId }
//       ]
//     })
//     .populate('creator', 'fname lname email profileImage')
//     .populate('recipientUser', 'fname lname email profileImage')
//     .populate('contributions.contributor', 'fname lname email profileImage')
//     .sort({ createdAt: -1 });
    
//     console.log(`\n✅ Query result: Found ${events.length} events`);
    
//     if (events.length === 0) {
//       console.log('\n⚠️ NO EVENTS FOUND - Possible reasons:');
//       console.log('1. User ID might not match exactly (check ObjectId vs String)');
//       console.log('2. Events might use different field names (recipientUserId instead of creator)');
//       console.log('3. Contributions might have different structure');
//       console.log('\nTrying alternative queries...\n');
      
//       // Try with string conversion
//       const eventsWithString = await Event.find({
//         $or: [
//           { creator: userId.toString() },
//           { 'contributions.contributor': userId.toString() }
//         ]
//       });
//       console.log(`📌 With .toString(): ${eventsWithString.length} events`);
      
//       // Try checking recipientUserId field
//       const eventsWithRecipient = await Event.find({ recipientUserId: userId });
//       console.log(`📌 With recipientUserId: ${eventsWithRecipient.length} events`);
      
//       // Try checking recipientUser field
//       const eventsWithRecipientUser = await Event.find({ recipientUser: userId });
//       console.log(`📌 With recipientUser: ${eventsWithRecipientUser.length} events`);
//     }
    
//     console.log('='.repeat(60));
    
//     res.status(200).json({
//       events: events,
//       count: events.length,
//       debug: {
//         userId: userId,
//         totalEventsInDB: totalEvents,
//         eventsAsCreator: eventsAsCreator.length,
//         eventsWithContributions: eventsWithContributions.length
//       }
//     });
//   } catch (error) {
//     console.error('[getUserEvents] Error:', error);
//     res.status(500).json({
//       message: 'Failed to fetch user events',
//       error: error.message
//     });
//   }
// };

// ============================================
// EXPORTS
// ============================================

module.exports = {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  getEventsForMe,
  getContributedEvents,
  inviteParticipants,
  getEventParticipants,
  cancelEvent,
  completeEvent,
  getFundsSummary,
  initiateWithdrawal,
  markStocksPurchased,
  getUserEvents,
};