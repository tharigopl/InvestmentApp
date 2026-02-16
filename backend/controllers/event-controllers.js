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

    // Validate recipient exists
    const recipient = await User.findById(recipientUserId);
    if (!recipient) {
      return next(new HttpError('Recipient user not found', 404));
    }

    // Validate creator exists
    const creator = await User.findById(userId);
    if (!creator) {
      return next(new HttpError('Creator user not found', 404));
    }

    // Validate and enrich stock investments
    let enrichedInvestments = [];
    if (selectedInvestments && selectedInvestments.length > 0) {
      for (let investment of selectedInvestments) {
        try {
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
        } catch (error) {
          logger.warn('Failed to enrich stock data', {
            symbol: investment.symbol,
            error: error.message,
          });
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

    // Create event
    const event = new InvestmentEvent({
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
      status: 'active', // Start as active
      currentAmount: 0,
      contributors: [],
    });

    await event.save();

    // Populate references before returning
    await event.populate('recipientUser', 'fname lname email image');
    await event.populate('createdBy', 'fname lname email');

    const duration = Date.now() - startTime;
    logger.info('createEvent - SUCCESS', {
      eventId: event._id,
      eventTitle: event.eventTitle,
      duration: `${duration}ms`,
    });

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
};