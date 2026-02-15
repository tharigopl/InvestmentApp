const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');
const getCoordsForAddress = require('../util/location');
const Friend = require('../models/friend');
const User = require('../models/user');

const getAllFriendsForUser = async (req, res, next) => {
    const uid = req.params.id;
    console.log("Get All Friends For User", req.params);
    let friend;
    let user;
    let tempfriends;
    try {
       user = await User.findOne({ _id: req.params.id });
       //console.log(user)
       tempfriends = await User.findById(req.params.id).populate('friends');
       //console.log("tempfriends ",tempfriends)
      friend = await Friend.find({ _id: user.friends });
    } catch (err) {
      const error = new HttpError(
        'Something went wrong, could not find a friend.',
        500
      );
      return next(error);
    }
  
    if (!friend) {
      const error = new HttpError(
        'Could not find friend for the provided id.',
        404
      );
      return next(error);
    }
  
    //res.json({ friend: friend.toObject({ getters: true }) });
    res.json({ friend: friend});
  };

const getFriendById = async (req, res, next) => {
  console.log("Get All Friends getFriendById", req.params);
  const friendId = req.params.friendid;

  let friend;
  try {
    friend = await Friend.findById(friendId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not find a friend.',
      500
    );
    return next(error);
  }

  if (!friend) {
    const error = new HttpError(
      'Could not find friend for the provided id.',
      404
    );
    return next(error);
  }

  res.json({ friend: friend.toObject({ getters: true }) });
};

const getFriendsByUserId = async (req, res, next) => {
  const userId = req.params.uid;
  console.log("Get All Friends getFriendsByUserId", req.params);
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

  // if (!friends || friends.length === 0) {
  if (!userWithFriends || userWithFriends.friends.length === 0) {
    return next(
      new HttpError('Could not find friends for the provided user id.', 404)
    );
  }

  res.json({
    friends: userWithFriends.friends.map(friend =>
      friend.toObject({ getters: true })
    )
  });
};

const createFriend = async (req, res, next) => {
  console.log("friedns controllers createFriend", req.params);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { email, firstname, lastname, uid } = req.body;

//   let coordinates;
//   try {
//     coordinates = await getCoordsForAddress(address);
//   } catch (error) {
//     return next(error);
//   }
  console.log("Create Friend ", req.body);
  const createdFriend = new Friend({
    email,
    firstname,
    lastname, 
    uid
  });

  let user;
  try {
    user = await User.findOne({_id : uid});
  } catch (err) {
    const error = new HttpError(
      'Creating friend failed, please try again.', err,
      500
    );
    return next(error);
  }

  if (!user) {
    const error = new HttpError('Could not find user for provided id.', 404);
    return next(error);
  }

 

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    console.log("Before friends controller creafte friend save friend", user);
    await createdFriend.save({ session: sess });
    console.log("Before friends controller creafte friend save friend1", user);
    user.friends.push(createdFriend);
    console.log("Before friends controller creafte friend save friend2", user);
    await user.save({ session: sess });
    console.log("Before friends controller creafte friend save frien3", user);
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Creating friend failed, please try again.',
      500
    );
    return next(error);
  }

  res.status(201).json({ friend: createdFriend });
};

const updateFriend = async (req, res, next) => {
  console.log("friedns controllers updateFriend", req.params);
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError('Invalid inputs passed, please check your data.', 422)
    );
  }

  const { firstname, lastname } = req.body;
  const friendId = req.params.friendid;

  let friend;
  try {
    friend = await Friend.findById(friendId);
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update friend.',
      500
    );
    return next(error);
  }

  if (friend.creator.toString() !== req.userData.userId) {
    const error = new HttpError('You are not allowed to edit this friend.', 401);
    return next(error);
  }

  friend.firstname = firstname;
  friend.lastname = lastname;

  try {
    await friend.save();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not update friend.',
      500
    );
    return next(error);
  }

  res.status(200).json({ friend: friend.toObject({ getters: true }) });
};

const deleteFriend = async (req, res, next) => {
  const friendId = req.params.friendid;

  let friend;
  try {
    friend = await Friend.findById(friendId).populate('creator');
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete friend.',
      500
    );
    return next(error);
  }

  if (!friend) {
    const error = new HttpError('Could not find friend for this id.', 404);
    return next(error);
  }

//   if (friend.creator.id !== req.userData.userId) {
//     const error = new HttpError(
//       'You are not allowed to delete this friend.',
//       401
//     );
//     return next(error);
//   }

//   const imagePath = friend.image;

  try {
    const sess = await mongoose.startSession();
    sess.startTransaction();
    await friend.remove({ session: sess });
    friend.creator.friends.pull(friend);
    await friend.creator.save({ session: sess });
    await sess.commitTransaction();
  } catch (err) {
    const error = new HttpError(
      'Something went wrong, could not delete friend.',
      500
    );
    return next(error);
  }

//   fs.unlink(imagePath, err => {
//     console.log(err);
//   });

  res.status(200).json({ message: 'Deleted friend.' });
};

exports.getFriendById = getFriendById;
exports.getFriendsByUserId = getFriendsByUserId;
exports.createFriend = createFriend;
exports.updateFriend = updateFriend;
exports.deleteFriend = deleteFriend;
exports.getAllFriendsForUser = getAllFriendsForUser;
