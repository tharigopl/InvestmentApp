const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose'); 
const HttpError = require('../models/http-error');
const User = require('../models/user');
const Contact = require('../models/contact');
const { getUserId } = require('../util/auth-helper');

const getUsers = async (req, res, next) => {
  let users;

  console.log("Request Header ", req.headers.authorization);
  const token = req.headers.authorization.split(' ')[1]; // Authorization: 'Bearer TOKEN'
    
  if (!token) {
    throw new Error('Authentication failed1!');
  }
  const decodedToken = jwt.verify(token, 'supersecret_dont_share');  
  console.log("Decoded Token ", decodedToken.userId);

  try {
    users = await User.find( { _id: { $nin: decodedToken.userId } } );
  } catch (err) {
    const error = new HttpError(
      'Fetching users failed, please try again later.',
      500
    );
    return next(error);
  }
  res.json({ users: users.map(user => user.toObject({ getters: true })) });
};

/**
 * Get current authenticated user's info
 * GET /api/users/me
 */
const getCurrentUser = async (req, res, next) => {
  console.log('GET /api/users/me called');
  console.log('req.userData:', req.userData);
  
  try {
    // Get user ID from auth token
    const userId = getUserId(req.userData);
    
    if (!userId) {
      console.log('❌ No user ID in request');
      return res.status(401).json({ 
        message: 'Authentication failed - no user ID' 
      });
    }
    
    console.log('Looking up user:', userId);
    
    // Find user by ID
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      console.log('❌ User not found:', userId);
      return res.status(404).json({ 
        message: 'User not found' 
      });
    }
    
    console.log('✅ User found:', user.email);
    
    res.json({ 
      user: {
        id: user._id,
        _id: user._id,
        email: user.email,
        fname: user.fname,
        lname: user.lname,
        profileImage: user.profileImage,
        accountStatus: user.accountStatus
      }
    });
  } catch (error) {
    console.error('getCurrentUser error:', error);
    return res.status(500).json({ 
      message: 'Failed to get user info',
      error: error.message 
    });
  }
};

const getFriendsByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  console.log("usser id ", userId);
  // let friends;
  let userWithFriends;
  try {
    userWithFriends = await User.findById(userId).populate('friends');
  } catch (err) {
    const error = new HttpError(
      'Fetching friends failed, please try again later.',
      500
    );
    return next(error);
  }
  console.log("usser id 1", userWithFriends);
  // if (!friends || friends.length === 0) {
  // if (!userWithFriends || userWithFriends.friends.length === 0) {
  //   return next(
  //     new HttpError('Could not find friends for the provided user id.', 404)
  //   );
  // }

  res.json({
    friends: userWithFriends.friends.map(friend =>
      friend.toObject({ getters: true })
    )
  });
};

const addFriendsByFriendIds = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { friendids } = req.body;
  const uid = req.params.uid;
  console.log("UpdateFriends uid ", uid);
  console.log("UpdateFriends friend ids", friendids);
  console.log("UpdateFriends ", friendids.split(','));
  let user;
  let friends;
  try {
    user = await User.findById(uid);
    console.log("UpdateFriends user ", user);
    friends = await User.find({ '_id': { $in: friendids.split(',') } });
    console.log("UpdateFriends friends ", friends);
    user.friends = friends;
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }




  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ friends: user.friends.toObject({ getters: true }) });
};

const addFriendsByFriendEmail = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { emailids } = req.body;
  const uid = req.params.uid;
  console.log("UpdateFriends uid ", uid);
  console.log("UpdateFriends friend ids", emailids);
  console.log("UpdateFriends ", emailids.split(','));
  let user;
  let friends;
  try {
    user = await User.findById(uid);
    console.log("UpdateFriends user ", user);
    friends = await User.find({ 'email': { $in: emailids.split(',') } });
    console.log("UpdateFriends friends 111 ", user.friends);
    console.log("UpdateFriends friends ", friends);
    for (const val of friends) {
      console.log("Value ", val._id)
      user.friends.push(val._id);
    }


  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }


  console.log("User Friends ", user.friends);

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ friends: user.friends.toObject({ getters: true }) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { name, email, password } = req.body;
  console.log("TEst1");
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      'User exists already, please login instead.',
      422
    );
    return next(error);
  }

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new HttpError(
      'Could not create user, please try again.',
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    // image: req.file.path,
    password: hashedPassword,
    places: []
  });
  console.log("TEst2");
  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Create user failed, please try again later.' + err,
      500
    );
    return next(error);
  }
  console.log("TEst3");
  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Create user failed1, please try again later.',
      500
    );
    return next(error);
  }

  res
    .status(201)
    .json({ userId: createdUser.id, email: createdUser.email, token: token });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let isValidPassword = false;
  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (err) {
    const error = new HttpError(
      'Could not log you in, please check your credentials and try again.',
      500
    );
    return next(error);
  }

  if (!isValidPassword) {
    const error = new HttpError(
      'Invalid credentials, could not log you in.',
      403
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Logging in failed, please try again later.',
      500
    );
    return next(error);
  }

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    stripeuser: existingUser.stripeuser,
    token: token,
    fname: existingUser.fname,
    lname: existingUser.lname,
    phone: existingUser.phoneno,
    profileImage: existingUser.profileImage,
  });
};

const findSingleUserById = async (req, res, next) => {
  let users;
  console.log("TEst4",req.params.id);
  let existingUser;
  try {
    existingUser = await User.findById(req.params.id);
  } catch (err) {
    const error = new HttpError(
      'findSingleUserById, please try again later.',
      500
    );
    return next(error);
  }

  // try {
  //   users = await User.find({}, '-password');
  // } catch (err) {
  //   const error = new HttpError(
  //     'Fetching users failed, please try again later.',
  //     500
  //   );
  //   return next(error);
  // }
  res.json({ user: existingUser });
};


const updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { params } = req.body;
  const uid = req.params.uid;
  console.log("UpdateFriends uid ", uid, req.body);
  let user;
  let doc;
  const filter = { _id: uid };
  const update = { lname:  req.body};
  
  try {
      
    // `doc` is the document _before_ `update` was applied
    doc = await User.findOneAndUpdate(filter, req.body);    
    
    doc = await User.findOne(filter);
    
    
  } catch (err) {
    console.log(err);
    const error = new HttpError(
      'Something went wrong, could not update place.',
      500
    );
    return next(error);
  }

  res.status(200).json({ user: doc.toObject({ getters: true }) });
};

/**
 * Search users by name or email
 * GET /api/users/search?q=query
 */
const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    
    console.log('🔍 Search request received');
    console.log('Query:', q);
    console.log('User data:', req.userData);
    
    // Validate query
    if (!q || q.trim().length === 0) {
      return next(new HttpError('Search query is required', 400));
    }
    
    if (q.trim().length < 2) {
      return next(new HttpError('Search query must be at least 2 characters', 400));
    }
    
    // Create case-insensitive regex
    const searchRegex = new RegExp(q, 'i');
    
    // Build search filter
    const searchFilter = {
      $or: [
        { fname: searchRegex },
        { lname: searchRegex },
        { name: searchRegex },
        { email: searchRegex }
      ]
    };
    
    // ✅ FIX: Safely handle currentUserId with proper ObjectId validation
    if (req.userData && req.userData.userId) {
      const currentUserId = req.userData.userId;
      
      // Only add exclusion if it's a valid ObjectId
      if (mongoose.Types.ObjectId.isValid(currentUserId)) {
        searchFilter._id = { $ne: new mongoose.Types.ObjectId(currentUserId) };
        console.log('Excluding current user:', currentUserId);
      } else {
        console.warn('Invalid userId format, not excluding:', currentUserId);
      }
    }
    
    console.log('Search filter:', JSON.stringify(searchFilter, null, 2));
    
    // Search for users
    const users = await User.find(searchFilter)
      .select('fname lname name email image profileImage')
      .limit(20);
    
    console.log(`✅ Found ${users.length} users`);
    
    // Format results
    const formattedUsers = users.map(user => ({
      id: user._id.toString(),
      fname: user.fname || '',
      lname: user.lname || '',
      name: user.name || `${user.fname || ''} ${user.lname || ''}`.trim() || user.email,
      email: user.email,
      image: user.profileImage || user.image || null
    }));
    
    res.json({ 
      users: formattedUsers,
      count: formattedUsers.length,
      query: q
    });
    
  } catch (error) {
    console.error('❌ Search users error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Stack trace:', error.stack);
    
    return next(new HttpError(
      `Failed to search users: ${error.message}`,
      500
    ));
  }
};


/**
 * Add friend (user-to-user)
 * POST /api/users/:userId/friends
 */
const addFriend = async (req, res, next) => {
  try {
    const { friendId } = req.body;
    const userId = req.params.userId;
    
    // Verify authorization
    if (req.userData.userId !== userId) {
      return next(new HttpError('Unauthorized', 401));
    }
    
    // Validate friend ID
    if (!friendId) {
      return next(new HttpError('Friend ID is required', 400));
    }
    
    // Can't add yourself
    if (userId === friendId) {
      return next(new HttpError('You cannot add yourself as a friend', 400));
    }
    
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    
    if (!friend) {
      return next(new HttpError('User not found', 404));
    }
    
    if (friend.accountStatus !== 'active' || friend.isDeleted) {
      return next(new HttpError('This user account is not active', 400));
    }
    
    // Check if already friends
    if (user.friends.includes(friendId)) {
      return next(new HttpError('You are already friends with this user', 400));
    }
    
    // Add mutual friendship
    user.friends.push(friendId);
    friend.friends.push(userId);
    
    await user.save();
    await friend.save();
    
    res.json({ 
      message: 'Friend added successfully',
      friend: {
        id: friend._id,
        name: `${friend.fname} ${friend.lname}`,
        email: friend.email,
        profileImage: friend.profileImage
      }
    });
  } catch (error) {
    console.error('Add friend error:', error);
    return next(new HttpError('Failed to add friend', 500));
  }
};

/**
 * Remove friend
 * DELETE /api/users/:userId/friends/:friendId
 */
const removeFriend = async (req, res, next) => {
  try {
    const { userId, friendId } = req.params;
    
    // Verify authorization
    if (req.userData.userId !== userId) {
      return next(new HttpError('Unauthorized', 401));
    }
    
    const user = await User.findById(userId);
    const friend = await User.findById(friendId);
    
    if (!friend) {
      return next(new HttpError('User not found', 404));
    }
    
    // Remove from both users' friends lists
    user.friends = user.friends.filter(id => id.toString() !== friendId);
    friend.friends = friend.friends.filter(id => id.toString() !== userId);
    
    await user.save();
    await friend.save();
    
    res.json({ 
      message: 'Friend removed successfully' 
    });
  } catch (error) {
    console.error('Remove friend error:', error);
    return next(new HttpError('Failed to remove friend', 500));
  }
};

/**
 * Get user's friends (only registered users)
 * GET /api/users/:userId/friends
 */
const getFriends = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('friends', 'fname lname email profileImage accountStatus');
    
    if (!user) {
      return next(new HttpError('User not found', 404));
    }
    
    // Filter out deleted or inactive users
    const activeFriends = user.friends.filter(
      friend => friend.accountStatus === 'active' && !friend.isDeleted
    );
    
    res.json({ 
      friends: activeFriends.map(f => ({
        id: f._id,
        name: `${f.fname} ${f.lname}`,
        email: f.email,
        profileImage: f.profileImage,
        type: 'user'
      }))
    });
  } catch (error) {
    console.error('Get friends error:', error);
    return next(new HttpError('Failed to fetch friends', 500));
  }
};

/**
 * Get combined friends list (users + contacts)
 * GET /api/users/:userId/all-friends
 */
const getAllFriends = async (req, res, next) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findById(userId)
      .populate('friends', 'fname lname email profileImage accountStatus')
      .populate('externalContacts');
    
    if (!user) {
      return next(new HttpError('User not found', 404));
    }
    
    // Registered users (friends)
    const userFriends = user.friends
      .filter(f => f.accountStatus === 'active' && !f.isDeleted)
      .map(f => ({
        id: f._id,
        name: `${f.fname} ${f.lname}`,
        firstName: f.fname,
        lastName: f.lname,
        email: f.email,
        profileImage: f.profileImage,
        type: 'user',
        canContribute: true,
        canReceiveGifts: true,
        isRegistered: true
      }));
    
    // External contacts (not yet users)
    const contactFriends = user.externalContacts
      .filter(c => !c.linkedUserId) // Only unlinked contacts
      .map(c => ({
        id: c._id,
        name: c.displayName,
        firstName: c.firstName,
        lastName: c.lastName,
        email: c.email,
        phoneNumber: c.phoneNumber,
        profileImage: null,
        type: 'contact',
        canContribute: true, // Can contribute as guest
        canReceiveGifts: true,
        isRegistered: false,
        invitedToJoin: c.invitedToJoin,
        tags: c.tags
      }));
    
    // Combine and sort by name
    const allFriends = [...userFriends, ...contactFriends].sort((a, b) => 
      a.name.localeCompare(b.name)
    );
    
    res.json({ 
      friends: allFriends,
      summary: {
        total: allFriends.length,
        registered: userFriends.length,
        contacts: contactFriends.length
      }
    });
  } catch (error) {
    console.error('Get all friends error:', error);
    return next(new HttpError('Failed to fetch friends', 500));
  }
};

/**
 * Get friend suggestions based on mutual friends
 * GET /api/users/:userId/friend-suggestions
 */
const getFriendSuggestions = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const user = await User.findById(userId).populate('friends');
    
    if (!user) {
      return next(new HttpError('User not found', 404));
    }
    
    // Find users who are friends with your friends but not with you
    const friendIds = user.friends.map(f => f._id);
    
    const suggestions = await User.find({
      _id: { 
        $nin: [...friendIds, userId] // Not already friends, not self
      },
      friends: { 
        $in: friendIds // Has mutual friends
      },
      accountStatus: 'active',
      isDeleted: false
    })
    .select('fname lname email profileImage friends')
    .limit(limit);
    
    // Calculate mutual friend count
    const suggestionsWithMutuals = suggestions.map(suggestion => {
      const mutualFriends = suggestion.friends.filter(
        friendId => friendIds.includes(friendId.toString())
      );
      
      return {
        id: suggestion._id,
        name: `${suggestion.fname} ${suggestion.lname}`,
        email: suggestion.email,
        profileImage: suggestion.profileImage,
        mutualFriendCount: mutualFriends.length
      };
    });
    
    // Sort by mutual friend count
    suggestionsWithMutuals.sort((a, b) => b.mutualFriendCount - a.mutualFriendCount);
    
    res.json({ suggestions: suggestionsWithMutuals });
  } catch (error) {
    console.error('Get friend suggestions error:', error);
    return next(new HttpError('Failed to fetch suggestions', 500));
  }
};

exports.findSingleUserById = findSingleUserById;
exports.addFriendsByFriendIds = addFriendsByFriendIds;
exports.addFriendsByFriendEmail = addFriendsByFriendEmail;
exports.getFriendsByUserId = getFriendsByUserId;
exports.updateUser = updateUser;
exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
exports.searchUsers = searchUsers;
exports.addFriend = addFriend;
exports.removeFriend = removeFriend;
exports.getFriends = getFriends;
exports.getAllFriends = getAllFriends;
exports.getFriendSuggestions = getFriendSuggestions;
exports.getCurrentUser = getCurrentUser;
