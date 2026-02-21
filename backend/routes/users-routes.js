const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');

const usersControllers = require('../controllers/users-controllers');
const friendsController = require('../controllers/friends-controllers');
const User = require('../models/user');
const { 
  uploadProfilePicture, 
  deleteFile,
  handleMulterError 
} = require('../middleware/file-upload');

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

// ============================================
// PROFILE PICTURE UPLOAD
// ============================================
/**
 * POST /api/users/:userId/profile-picture
 * Upload or update user profile picture
 */
router.post(
  '/:userId/profile-picture',
  checkAuth,
  uploadProfilePicture.single('profileImage'),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Verify user is updating their own profile
      if (req.userData.userId !== userId) {
        // Delete uploaded file if unauthorized
        if (req.file) {
          deleteFile(req.file.path);
        }
        return res.status(403).json({ 
          message: 'You can only update your own profile picture' 
        });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ 
          message: 'No file uploaded' 
        });
      }

      // Get user from database
      const user = await User.findById(userId);
      if (!user) {
        // Delete uploaded file if user not found
        deleteFile(req.file.path);
        return res.status(404).json({ 
          message: 'User not found' 
        });
      }

      // Delete old profile picture if it exists
      if (user.profileImage) {
        deleteFile(user.profileImage);
      }

      // Construct the URL for the uploaded image
      const profileImageUrl = `/uploads/profile-pictures/${req.file.filename}`;

      // Update user in database
      user.profileImage = profileImageUrl;
      await user.save();

      res.status(200).json({
        message: 'Profile picture updated successfully',
        profileImageUrl: profileImageUrl,
        user: {
          id: user._id,
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          profileImage: profileImageUrl,
        }
      });
    } catch (error) {
      console.error('Profile picture upload error:', error);
      
      // Delete uploaded file on error
      if (req.file) {
        deleteFile(req.file.path);
      }
      
      res.status(500).json({ 
        message: 'Failed to upload profile picture',
        error: error.message 
      });
    }
  }
);

// ============================================
// DELETE PROFILE PICTURE
// ============================================
/**
 * DELETE /api/users/:userId/profile-picture
 * Remove user's profile picture
 */
router.delete(
  '/:userId/profile-picture',
  checkAuth,
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      
      // Verify user is deleting their own profile picture
      if (req.userData.userId !== userId) {
        return res.status(403).json({ 
          message: 'You can only delete your own profile picture' 
        });
      }

      // Get user from database
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ 
          message: 'User not found' 
        });
      }

      if (!user.profileImage) {
        return res.status(400).json({ 
          message: 'No profile picture to delete' 
        });
      }

      // Delete the file
      deleteFile(user.profileImage);

      // Update user in database
      user.profileImage = null;
      await user.save();

      res.status(200).json({
        message: 'Profile picture deleted successfully',
        user: {
          id: user._id,
          fname: user.fname,
          lname: user.lname,
          email: user.email,
          profileImage: null,
        }
      });
    } catch (error) {
      console.error('Profile picture deletion error:', error);
      res.status(500).json({ 
        message: 'Failed to delete profile picture',
        error: error.message 
      });
    }
  }
);

// ============================================
// OTHER EXAMPLE ROUTES (OPTIONAL)
// ============================================

/*
// Multiple file upload example
const { uploadEventImage } = require('../middleware/file-upload');

router.post(
  '/events/:eventId/images',
  checkAuth,
  uploadEventImage.array('eventImages', 5), // Max 5 images
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
      
      const imageUrls = req.files.map(file => 
        `/uploads/event-images/${file.filename}`
      );
      
      // Save to database...
      
      res.status(200).json({
        message: 'Images uploaded successfully',
        images: imageUrls
      });
    } catch (error) {
      // Clean up uploaded files on error
      if (req.files) {
        req.files.forEach(file => deleteFile(file.path));
      }
      res.status(500).json({ error: error.message });
    }
  }
);

// Document upload example
const { uploadDocument } = require('../middleware/file-upload');

router.post(
  '/documents',
  checkAuth,
  uploadDocument.single('document'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }
      
      const documentUrl = `/uploads/documents/${req.file.filename}`;
      
      // Save to database...
      
      res.status(200).json({
        message: 'Document uploaded successfully',
        documentUrl: documentUrl
      });
    } catch (error) {
      if (req.file) {
        deleteFile(req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }
);
*/

// Apply multer error handler to all upload routes
router.use(handleMulterError);

module.exports = router;