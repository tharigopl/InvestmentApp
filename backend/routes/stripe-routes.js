const express = require("express");
const { check } = require("express-validator");

const stripeControllers = require("../controllers/stripe-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

//router.use(checkAuth);

router.get("/link", checkAuth, stripeControllers.createStAccount);
//router.get("/link", stripeControllers.createStAccount);
router.get("/linkcustom", stripeControllers.createStAccountCustom);

// router.post(
//   '/',
//   //fileUpload.single('image'),
//   [
//     check('title')
//       .not()
//       .isEmpty(),
//     check('description').isLength({ min: 5 }),
//     check('address')
//       .not()
//       .isEmpty()
//   ],
//   placesControllers.createPlace
// );

// router.patch(
//   '/:pid',
//   [
//     check('title')
//       .not()
//       .isEmpty(),
//     check('description').isLength({ min: 5 })
//   ],
//   placesControllers.updatePlace
// );

// router.delete('/:pid', placesControllers.deletePlace);

router.get("/onboarded", stripeControllers.onBoardedStripe);

router.get(
  "/account/:stripeaccountid",
  stripeControllers.getStripeAccountByAccountId
);
router.get(
  "/balance/:stripeaccountid",
  stripeControllers.getStripeBalanceAccountId
);

module.exports = router;
