const express = require("express");
const { check } = require("express-validator");
const contributionController = require('../controllers/contribution-controllers');
const stripeController = require("../controllers/stripe-controllers");
const checkAuth = require("../middleware/check-auth");

const router = express.Router();

//router.use(checkAuth);

router.get("/link", checkAuth, stripeController.createStAccount);
//router.get("/link", stripeControllers.createStAccount);
router.get("/linkcustom", stripeController.createStAccountCustom);

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

router.get("/onboarded", stripeController.onBoardedStripe);

router.get(
  "/account/:stripeaccountid",
  stripeController.getStripeAccountByAccountId
);
router.get(
  "/balance/:stripeaccountid",
  stripeController.getStripeBalanceAccountId
);

// Connected Account routes (for recipients)
router.post('/create-connected-account', checkAuth, stripeController.createConnectedAccount);
router.get('/account-status/:accountId', checkAuth, stripeController.getAccountStatus);
router.post('/refresh-account-link', checkAuth, stripeController.refreshAccountLink);
router.post('/create-payment-intent', checkAuth, stripeController.createPaymentIntent);

// Contribution routes (for contributors)
router.post('/create-contribution', checkAuth, contributionController.createContribution);
router.post('/confirm-contribution', checkAuth, contributionController.confirmContribution);

// Webhook endpoint (no auth needed)
router.post('/webhook', stripeController.handleWebhook);

module.exports = router;
