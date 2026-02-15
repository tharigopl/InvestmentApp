const express = require('express');
const { check } = require('express-validator');

const friendsControllers = require('../controllers/friends-controllers');
const fileUpload = require('../middleware/file-upload');
const checkAuth = require('../middleware/check-auth');

const router = express.Router();

router.get('/:friendid', friendsControllers.getFriendById);

//router.get('/:userid', friendsControllers.getFriendsByUid);

router.get('/user/:userid', friendsControllers.getFriendsByUserId);

router.use(checkAuth);

router.post(
  '/',
  //fileUpload.single('image'),
  [
    check('email')
      .not()
      .isEmpty(),
    check('firstname')
      .not()
      .isEmpty(),
    check('lastname')
      .not()
      .isEmpty()
  ],
  friendsControllers.createFriend
);

router.patch(
  '/:pid',
  [
    check('lastname')
      .not()
      .isEmpty(),
    check('firstname').isLength({ min: 5 })
  ],
  friendsControllers.updateFriend
);

router.delete('/:friendid', friendsControllers.deleteFriend);

module.exports = router;
