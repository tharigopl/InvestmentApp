const express = require('express');
const { check } = require('express-validator');
const messageController = require('../controllers/message-controllers');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// All routes require authentication
router.use(checkAuth);

// Get messages for an event
router.get('/event/:eventId', messageController.getEventMessages);

// Send a message
router.post(
  '/send',
  [
    check('eventId').notEmpty(),
    check('content').notEmpty().trim()
  ],
  messageController.sendMessage
);

// Add/remove reaction
router.post('/:messageId/reaction', messageController.addReaction);

// Mark messages as read
router.patch('/event/:eventId/read', messageController.markAsRead);

// Delete message
router.delete('/:messageId', messageController.deleteMessage);

// Edit message
router.patch('/:messageId', messageController.editMessage);

// Pin/unpin message
router.patch('/:messageId/pin', messageController.togglePin);

module.exports = router;
