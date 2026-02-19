const express = require('express');
const { check } = require('express-validator');

const friendsControllers = require('../controllers/friends-controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

// ============================================
// PUBLIC ROUTES (No auth required)
// ============================================

/**
 * Get all friends for a user
 * GET /api/friends/user/:userid
 */
router.get('/user/:userid', friendsControllers.getFriendsByUserId);

/**
 * Get friend by ID
 * GET /api/friends/:friendid
 * NOTE: This MUST come after /user/:userid or "user" will be treated as a friendid
 */
router.get('/:friendid', friendsControllers.getFriendById);

// ============================================
// PROTECTED ROUTES (Auth required)
// ============================================
router.use(checkAuth);

/**
 * ✅ NEW: Add user as friend (User-to-User)
 * POST /api/friends/add-user
 * Body: { friendId: "user123" }
 */
router.post(
  '/add-user',
  [
    check('friendId')
      .notEmpty()
      .withMessage('Friend ID is required')
  ],
  friendsControllers.addUserFriend
);

/**
 * Create external friend/contact (Old system - still useful)
 * POST /api/friends
 * Body: { email, firstname, lastname, uid }
 */
router.post(
  '/',
  [
    check('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    check('firstname')
      .trim()
      .notEmpty()
      .withMessage('First name is required'),
    check('lastname')
      .trim()
      .notEmpty()
      .withMessage('Last name is required')
  ],
  friendsControllers.createFriend
);

/**
 * Update friend
 * PATCH /api/friends/:friendid
 */
router.patch(
  '/:pid',
  [
    check('firstname')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty'),
    check('lastname')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty')
  ],
  friendsControllers.updateFriend
);

/**
 * ✅ Remove a registered user friend (mutual friendship removal)
 * DELETE /api/friends/user/:friendUserId
 * NOTE: This MUST come before /:friendid or "user" will be treated as a friendid
 */
router.delete('/user/:friendUserId', friendsControllers.removeUserFriend);

/**
 * Delete friend document (old system - for Friend model)
 * DELETE /api/friends/:friendid
 */
router.delete('/:friendid', friendsControllers.deleteFriend);

module.exports = router;