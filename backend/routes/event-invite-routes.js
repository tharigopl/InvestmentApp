const express = require('express');
const router = express.Router();
const checkAuth = require('../middleware/check-auth');
const inviteController = require('../controllers/event-invite-controllers');

// All routes require authentication
router.use(checkAuth);

// Send invitations
router.post('/:eventId/invite', inviteController.sendInvitations);

// Get guest list
router.get('/:eventId/guests', inviteController.getGuestList);

// Update RSVP (can also be public with token)
router.patch('/:eventId/rsvp', inviteController.updateRSVP);

// Remove guest
router.delete('/:eventId/guests/:guestId', checkAuth, inviteController.removeGuest);

// Resend invitation
router.post('/:eventId/resend-invite', checkAuth, inviteController.resendInvite);

// Send all invitations
router.post('/:eventId/send-all-invites', checkAuth, inviteController.sendAllInvites);

// Send reminder
router.post('/:eventId/remind', inviteController.sendReminder);

// Bulk import
router.post('/:eventId/guests/import', inviteController.bulkImportGuests);

module.exports = router;