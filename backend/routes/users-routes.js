const express = require('express');
const { check } = require('express-validator');
const checkAuth = require('../middleware/check-auth');

const usersController = require('../controllers/users-controllers');
const friendsController = require('../controllers/friends-controllers');
const fileUpload = require('../middleware/file-upload');

const router = express.Router();

router.get('/', checkAuth, usersController.getUsers);

router.get('/:id',usersController.findSingleUserById);

router.post(
  '/signup',
  // fileUpload.single('image'),
  [
    check('email')
      .normalizeEmail()
      .isEmail(),
    check('password').isLength({ min: 6 })
  ],
  usersController.signup
);

router.post('/login', usersController.login);

router.patch(
  '/:uid',
  [
    
  ],
  usersController.updateUser
);

router.post(
  '/:id/friend',
  // fileUpload.single('image'),
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

router.get('/:uid/friends', usersController.getFriendsByUserId);

router.patch('/:uid/friendsid', 
  [
    check('friendids')
      .not()
      .isEmpty()
  ],
  usersController.addFriendsByFriendIds);

router.patch('/:uid/friendsemail', 
[
  check('emailids')
    .not()
    .isEmpty()
],
usersController.addFriendsByFriendEmail);

module.exports = router;
