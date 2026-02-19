// backend/controllers/friends-controllers.js - FINAL FIX for nested userId

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const Friend = require('../models/friend');
const User = require('../models/user');

// ============================================
// HELPER: Extract User ID (handles nested structure)
// ============================================
function extractUserId(userData) {
  if (!userData) return null;
  
  // Check if userId is nested (your case)
  if (userData.userId && typeof userData.userId === 'object' && userData.userId.userId) {
    return userData.userId.userId;  // ✅ Handle nested: req.userData.userId.userId
  }
  
  // Standard cases
  return userData.userId       // Standard: req.userData.userId
    || userData.user?.id       // Alternative: req.userData.user.id
    || userData.user?._id      // Alternative: req.userData.user._id
    || userData.user           // Alternative: req.userData.user
    || userData.id             // Alternative: req.userData.id
    || userData._id;           // Alternative: req.userData._id
}

// ============================================
// ADD USER AS FRIEND
// ============================================
const addUserAsFriend = async (req, res, next) => {
  console.log('=== ADD USER AS FRIEND ===');
  console.log('req.userData:', JSON.stringify(req.userData, null, 2));
  console.log('req.body:', req.body);
  
  try {
    // 1. Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation failed:', errors.array());
      return res.status(422).json({ 
        message: 'Friend ID is required',
        errors: errors.array() 
      });
    }

    const { friendId } = req.body;
    
    // 2. Extract current user ID
    const currentUserId = extractUserId(req.userData);
    
    console.log('Extracted current user ID:', currentUserId);
    console.log('Friend ID:', friendId);

    // 3. Check if we got a user ID
    if (!currentUserId) {
      console.log('❌ No user ID found');
      return res.status(401).json({ 
        message: 'Authentication failed - no user ID'
      });
    }

    // 4. Validate ID formats
    if (!mongoose.Types.ObjectId.isValid(currentUserId)) {
      console.log('❌ Invalid current user ID format:', currentUserId);
      return res.status(400).json({ 
        message: 'Invalid current user ID format',
        receivedId: currentUserId
      });
    }

    if (!mongoose.Types.ObjectId.isValid(friendId)) {
      console.log('❌ Invalid friend ID format:', friendId);
      return res.status(400).json({ 
        message: 'Invalid friend ID format',
        receivedId: friendId
      });
    }

    // 5. Can't add yourself
    if (currentUserId.toString() === friendId.toString()) {
      console.log('❌ User trying to add themselves');
      return res.status(400).json({ message: 'You cannot add yourself as a friend' });
    }

    // 6. Get current user
    console.log('Finding current user:', currentUserId);
    const currentUser = await User.findById(currentUserId);
    if (!currentUser) {
      console.log('❌ Current user not found');
      return res.status(404).json({ message: 'Your account was not found' });
    }
    console.log('✅ Current user:', currentUser.email);

    // 7. Get friend user
    console.log('Finding friend user:', friendId);
    const friendUser = await User.findById(friendId);
    if (!friendUser) {
      console.log('❌ Friend user not found');
      return res.status(404).json({ message: 'User not found' });
    }
    console.log('✅ Friend user:', friendUser.email);

    // 8. Check account status
    if (friendUser.accountStatus && friendUser.accountStatus !== 'active') {
      console.log('❌ Friend account not active:', friendUser.accountStatus);
      return res.status(400).json({ message: 'This user account is not active' });
    }

    if (friendUser.isDeleted === true) {
      console.log('❌ Friend account deleted');
      return res.status(400).json({ message: 'This user account has been deleted' });
    }

    // 9. Check if already friends
    const friendsArray = currentUser.friends || [];
    const isAlreadyFriend = friendsArray.some(
      fId => fId.toString() === friendId.toString()
    );
    
    if (isAlreadyFriend) {
      console.log('❌ Already friends');
      return res.status(400).json({ message: 'You are already friends with this user' });
    }

    // 10. Add mutual friendship
    console.log('➕ Adding friendship...');
    
    if (!currentUser.friends) {
      currentUser.friends = [];
    }
    if (!friendUser.friends) {
      friendUser.friends = [];
    }
    
    currentUser.friends.push(friendId);
    friendUser.friends.push(currentUserId);

    console.log('💾 Saving users...');
    await currentUser.save();
    await friendUser.save();

    console.log('✅ Success! Friend added');

    return res.status(201).json({
      message: 'Friend added successfully',
      friend: {
        id: friendUser._id,
        name: `${friendUser.fname} ${friendUser.lname}`,
        email: friendUser.email,
        profileImage: friendUser.profileImage || null
      }
    });

  } catch (error) {
    console.error('=== ERROR ===');
    console.error('Name:', error.name);
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ message: 'User data validation failed: ' + error.message });
    }

    if (error.name === 'MongoError' || error.name === 'MongoServerError') {
      return res.status(500).json({ message: 'Database error: ' + error.message });
    }
    
    return res.status(500).json({ 
      message: 'Failed to add friend',
      error: error.message 
    });
  }
};

// ============================================
// GET FRIENDS BY USER ID
// ============================================
const getFriendsByUserId = async (req, res, next) => {
  const userId = req.params.userid;
  console.log("Get Friends By User ID:", userId);
  
  try {
    const userWithFriends = await User.findById(userId).populate('friends');
    
    if (!userWithFriends) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!userWithFriends.friends || userWithFriends.friends.length === 0) {
      return res.json({ friends: [] });
    }

    const friends = userWithFriends.friends.map(friend => ({
      id: friend._id,
      fname: friend.fname,
      lname: friend.lname,
      email: friend.email,
      profileImage: friend.profileImage
    }));

    res.json({ friends });
  } catch (err) {
    console.error('Get friends error:', err);
    return res.status(500).json({ message: 'Failed to fetch friends' });
  }
};

// ============================================
// GET FRIEND BY ID
// ============================================
const getFriendById = async (req, res, next) => {
  console.log("Get Friend By ID:", req.params.friendid);
  const friendId = req.params.friendid;

  try {
    const friend = await Friend.findById(friendId);
    
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    res.json({ friend: friend.toObject({ getters: true }) });
  } catch (err) {
    console.error('Get friend by ID error:', err);
    return res.status(500).json({ message: 'Failed to fetch friend' });
  }
};

// ============================================
// CREATE FRIEND (External Contact)
// ============================================
const createFriend = async (req, res, next) => {
  console.log("Create Friend:", req.body);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('Validation errors:', errors.array());
      return res.status(422).json({ 
        message: 'Invalid inputs passed, please check your data.',
        errors: errors.array() 
      });
    }

    const { email, firstname, lastname, uid } = req.body;
    const currentUserId = extractUserId(req.userData);

    const createdFriend = new Friend({
      email,
      firstname,
      lastname,
      uid: uid || currentUserId
    });

    const user = await User.findById(uid || currentUserId);
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await createdFriend.save({ session });
      
      if (!user.friends) {
        user.friends = [];
      }
      user.friends.push(createdFriend);
      
      await user.save({ session });
      await session.commitTransaction();
      
      res.status(201).json({ friend: createdFriend });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Create friend error:', error);
    return res.status(500).json({ message: 'Failed to create friend' });
  }
};

// ============================================
// UPDATE FRIEND
// ============================================
const updateFriend = async (req, res, next) => {
  console.log("Update Friend:", req.params.friendid);
  
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ 
        message: 'Invalid inputs',
        errors: errors.array() 
      });
    }

    const { firstname, lastname } = req.body;
    const friendId = req.params.friendid;

    const friend = await Friend.findById(friendId);
    
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    friend.firstname = firstname;
    friend.lastname = lastname;

    await friend.save();

    res.json({ friend: friend.toObject({ getters: true }) });
  } catch (err) {
    console.error('Update friend error:', err);
    return res.status(500).json({ message: 'Failed to update friend' });
  }
};

// ============================================
// DELETE FRIEND
// ============================================
const deleteFriend = async (req, res, next) => {
  const friendId = req.params.friendid;
  console.log("Delete Friend:", friendId);

  try {
    const friend = await Friend.findById(friendId);
    
    if (!friend) {
      return res.status(404).json({ message: 'Friend not found' });
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      await friend.deleteOne({ session });
      
      if (friend.uid) {
        const user = await User.findById(friend.uid);
        if (user && user.friends) {
          user.friends = user.friends.filter(
            fId => fId.toString() !== friend._id.toString()
          );
          await user.save({ session });
        }
      }
      
      await session.commitTransaction();
      res.json({ message: 'Friend deleted successfully' });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

  } catch (error) {
    console.error('Delete friend error:', error);
    return res.status(500).json({ message: 'Failed to delete friend' });
  }
};

// ============================================
// GET ALL FRIENDS FOR USER (Legacy)
// ============================================
const getAllFriendsForUser = async (req, res, next) => {
  const uid = req.params.id;
  console.log("Get All Friends For User:", uid);
  
  try {
    const user = await User.findById(uid).populate('friends');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const friends = await Friend.find({ _id: { $in: user.friends } });
    
    res.json({ friend: friends });
  } catch (err) {
    console.error('Get all friends error:', err);
    return res.status(500).json({ message: 'Failed to fetch friends' });
  }
};

// POST /api/friends/add-user  { friendId }
const addUserFriend = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { friendId } = req.body;

  // Extract the current user's ID from auth middleware
  let currentUserId;
  if (req.userData?.userId?.userId) {
    currentUserId = req.userData.userId.userId; // nested structure
  } else if (typeof req.userData?.userId === 'string') {
    currentUserId = req.userData.userId;        // flat structure
  } else {
    return next(new HttpError('Authentication failed.', 401));
  }

  if (currentUserId === friendId) {
    return next(new HttpError('You cannot add yourself as a friend.', 400));
  }

  let currentUser, friendUser;
  try {
    currentUser = await User.findById(currentUserId);
    friendUser  = await User.findById(friendId);
  } catch (err) {
    return next(new HttpError('Fetching users failed, please try again.', 500));
  }

  if (!currentUser) return next(new HttpError('Current user not found.', 404));
  if (!friendUser)  return next(new HttpError('User to add not found.', 404));

  // Check not already friends
  const alreadyFriends = currentUser.friends.some(
    id => id.toString() === friendId
  );
  if (alreadyFriends) {
    return next(new HttpError('You are already friends with this user.', 409));
  }

  try {
    // Mutual friendship — add each to the other's friends array
    currentUser.friends.push(friendUser._id);
    friendUser.friends.push(currentUser._id);
    await currentUser.save();
    await friendUser.save();
  } catch (err) {
    return next(new HttpError('Adding friend failed, please try again.', 500));
  }

  res.status(201).json({
    message: 'Friend added successfully.',
    friend: {
      id:    friendUser._id,
      name:  (friendUser.fname || '') + ' ' + (friendUser.lname || ''),
      email: friendUser.email,
      type:  'user'
    }
  });
};

// ─── NEW: Remove a registered user from mutual friends ───────────────────────
// DELETE /api/friends/user/:friendUserId
const removeUserFriend = async (req, res, next) => {
  const friendUserId = req.params.friendUserId;

  let currentUserId;
  if (req.userData?.userId?.userId) {
    currentUserId = req.userData.userId.userId;
  } else if (typeof req.userData?.userId === 'string') {
    currentUserId = req.userData.userId;
  } else {
    return next(new HttpError('Authentication failed.', 401));
  }

  try {
    // Remove each from the other's friends array
    await User.findByIdAndUpdate(currentUserId, { $pull: { friends: friendUserId } });
    await User.findByIdAndUpdate(friendUserId, { $pull: { friends: currentUserId } });
  } catch (err) {
    return next(new HttpError('Removing friend failed, please try again.', 500));
  }

  res.status(200).json({ message: 'Friend removed successfully.' });
};


// ============================================
// EXPORTS
// ============================================
module.exports = {
  addUserAsFriend,
  getFriendById,
  getFriendsByUserId,
  createFriend,
  updateFriend,
  deleteFriend,
  getAllFriendsForUser,
  removeUserFriend,
  addUserFriend
};