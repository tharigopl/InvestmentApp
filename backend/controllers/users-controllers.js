const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const HttpError = require('../models/http-error');
const User = require('../models/user');

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

  try {
    await createdUser.save();
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.' + err,
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      'supersecret_dont_share',
      { expiresIn: '1h' }
    );
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
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
    token: token
  });
};

const findSingleUserById = async (req, res, next) => {
  let users;

  let existingUser;
  try {
    existingUser = await User.findById(req.params.id);
  } catch (err) {
    const error = new HttpError(
      'Signing up failed, please try again later.',
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

exports.findSingleUserById = findSingleUserById;
exports.addFriendsByFriendIds = addFriendsByFriendIds;
exports.addFriendsByFriendEmail = addFriendsByFriendEmail;
exports.getFriendsByUserId = getFriendsByUserId;
exports.updateUser = updateUser;
exports.getUsers = getUsers;
exports.signup = signup;
exports.login = login;
