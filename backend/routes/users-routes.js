const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');

const usersControllers = require('../controllers/users-controllers');
const friendsController = require('../controllers/friends-controllers');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

/**
 * @route   GET /api/users
 * @desc    Get all users
 * @access  Private
 */
router.get('/', checkAuth, usersControllers.getUsers);

router.get('/me', checkAuth, usersControllers.getCurrentUser);

// IMPORTANT: Specific routes MUST come BEFORE parameterized routes
// Otherwise /search would match /:id and treat "search" as an ID

/**
 * @route   GET /api/users/search?q=query
 * @desc    Search users by name or email
 * @access  Private
 */
router.get('/search', checkAuth, usersControllers.searchUsers);

// ============================================
// PUBLIC ROUTES (No Auth)
// ============================================

router.post(
  '/signup',
  [
    check('email')
      .normalizeEmail()
      .isEmail(),
    check('password').isLength({ min: 6 })
  ],
  usersControllers.signup
);

router.post('/login', usersControllers.login);

// ============================================
// PROTECTED ROUTES (Auth Required)
// ============================================



/**
 * @route   PATCH /api/users/:uid
 * @desc    Update user
 * @access  Private
 */
router.patch('/:uid', checkAuth, usersControllers.updateUser);

// ============================================
// FRIEND MANAGEMENT (User-to-User)
// ============================================

/**
 * @route   GET /api/users/:userId/friends
 * @desc    Get user's friends (registered users only)
 * @access  Private
 */
router.get('/:userId/friends', checkAuth, usersControllers.getFriends);

/**
 * @route   GET /api/users/:userId/all-friends
 * @desc    Get combined list of friends (users + contacts)
 * @access  Private
 */
router.get('/:userId/all-friends', checkAuth, usersControllers.getAllFriends);

/**
 * @route   GET /api/users/:userId/friend-suggestions
 * @desc    Get friend suggestions based on mutual friends
 * @access  Private
 */
router.get('/:userId/friend-suggestions', checkAuth, usersControllers.getFriendSuggestions);

/**
 * @route   POST /api/users/:userId/friends
 * @desc    Add a user as friend (mutual friendship)
 * @access  Private
 */
router.post('/:userId/friends', checkAuth, usersControllers.addFriend);

/**
 * @route   DELETE /api/users/:userId/friends/:friendId
 * @desc    Remove friend (mutual removal)
 * @access  Private
 */
router.delete('/:userId/friends/:friendId', checkAuth, usersControllers.removeFriend);

// ============================================
// LEGACY FRIEND ROUTES (Keep for backward compatibility)
// ============================================

/**
 * @route   GET /api/users/:uid/friends (LEGACY)
 * @desc    Get friends by user ID (old method)
 * @access  Private
 */
router.get('/:uid/friends', usersControllers.getFriendsByUserId);

/**
 * @route   PATCH /api/users/:uid/friendsid
 * @desc    Add friends by friend IDs
 * @access  Private
 */
router.patch('/:uid/friendsid', 
  [
    check('friendids')
      .not()
      .isEmpty()
  ],
  usersControllers.addFriendsByFriendIds
);

/**
 * @route   PATCH /api/users/:uid/friendsemail
 * @desc    Add friends by email
 * @access  Private
 */
router.patch('/:uid/friendsemail', 
  [
    check('emailids')
      .not()
      .isEmpty()
  ],
  usersControllers.addFriendsByFriendEmail
);

/**
 * @route   GET /api/users/:id
 * @desc    Get single user by ID
 * @access  Public (or add checkAuth if you want it protected)
 */
router.get('/:id', usersControllers.findSingleUserById);

/**
 * @route   POST /api/users/:id/friend
 * @desc    Create friend (contact)
 * @access  Private
 */
router.post(
  '/:id/friend',
  [
    check('firstname')
      .not()
      .isEmpty(),
    check('email')
      .normalizeEmail()
      .isEmail(),
    check('lastname')
      .not()
      .isEmpty()
  ],
  friendsController.createFriend
);

module.exports = router;