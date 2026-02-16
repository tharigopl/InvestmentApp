const express = require('express');
const router = express.Router();

// Import controller
const eventController = require('../controllers/event-controllers');

// Import middleware
const checkAuth = require('../middleware/check-auth');

// ============================================
// EVENT ROUTES
// ============================================

// Get all events (with optional filters)
// Query params: ?status=active&limit=20&skip=0
router.get('/', checkAuth, eventController.getEvents);

// Get events created by authenticated user
router.get('/my-events', checkAuth, eventController.getMyEvents);

// Get events where authenticated user is recipient
router.get('/for-me', checkAuth, eventController.getEventsForMe);

// Get events user has contributed to
router.get('/contributed', checkAuth, eventController.getContributedEvents);

// Get single event by ID
router.get('/:eventId', checkAuth, eventController.getEventById);

// Create new event
router.post('/', checkAuth, eventController.createEvent);

// Update event
router.patch('/:eventId', checkAuth, eventController.updateEvent);

// Delete event
router.delete('/:eventId', checkAuth, eventController.deleteEvent);

// Invite participants to event
router.post('/:eventId/invite', checkAuth, eventController.inviteParticipants);

// Get event participants
router.get('/:eventId/participants', checkAuth, eventController.getEventParticipants);

// Cancel event
router.post('/:eventId/cancel', checkAuth, eventController.cancelEvent);

// Complete event
router.post('/:eventId/complete', checkAuth, eventController.completeEvent);

module.exports = router;