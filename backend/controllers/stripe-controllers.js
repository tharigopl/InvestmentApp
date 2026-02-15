const fs = require("fs");

const { validationResult } = require("express-validator");
const mongoose = require("mongoose");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const stripeService = require("../util/stripeservice");
//const onBoardStripe = require('../util/stripeservice');
const StripeUser = require("../models/stripeuser");
const StripeUserAccountLink = require("../models/stripeaccountlink");

const createStAccount = async (req, res, next) => {
  console.log("CreaTE Stripe Account1", req.query.country);
  let accountLink;
  let account;
  let stripeuserdata = {};
  let userCountry = "";
  userCountry = req.query.country;
  let existingStripeUser;
  try {
    existingStripeUser = await StripeUser.findOne({
      email: req.userData.userId.email,
    });
  } catch (err) {
    const error = new HttpError("Stripe User Not Found", 500);
    //return next(error);
  }

  if (existingStripeUser) {
    const exStUser = await stripeService.retrieveStripeAccountByAccountId(
      existingStripeUser.id
    );
    console.log("Existing Struoe ", exStUser);
    account = exStUser;
  } else {
    try {
      console.log("CreaTE Stripe Account2");
      stripeuserdata["email"] = req.userData.userId.email;

      if(userCountry == "US"){
        stripeuserdata["country"] = "US";
        stripeuserdata["type"] = "express";
        stripeuserdata["requested_capabilities"] = ['card_payments', 'transfers'];
        stripeuserdata["business_type"] = "individual";
      }else{
        stripeuserdata["country"] = "IN";
        stripeuserdata["type"] = "standard";        
        stripeuserdata["business_type"] = "individual";
      }



      account = await stripeService.createStripeAccount(stripeuserdata);
      console.log("CreaTE Stripe Account5", account);
    } catch (err) {
      console.log("CreaTE Stripe Account3", err);
      const error = new HttpError(
        "Linking stripe account failed, please try again later.",
        500
      );
      return next(error);
    }

    try {
      console.log("CreaTE Stripe Account2= Link", account.id);
      accountLink = await stripeService.createStripeAccountLink(account.id);
      console.log("CreaTE Stripe Account Link 2");

      const newAccLink = new StripeUserAccountLink(accountLink);
      await newAccLink.save();
      console.log("CreaTE Stripe Account Link 3", newAccLink);
      account["accountlink"] = newAccLink._id;

      const newAcc = new StripeUser(account);
      const savedAcc = await newAcc.save();

      let existingUser;
      try {
        existingUser = await User.findOne({ email: account.email });
        console.log("CreaTE Stripe Account Link 3", existingUser);
        existingUser["stripeuser"] = savedAcc._id;

        await existingUser.save();

        console.log("CreaTE Stripe Account99");
      } catch (err) {
        const error = new HttpError(
          "Signing up failed, please try again later.",
          500
        );
        return next(error);
      }

      console.log("CreaTE Stripe Account3");
    } catch (err) {
      const error = new HttpError(
        "Linking stripe account failed, please try again later." + err,
        500
      );
      return next(error);
    }
  }

  res.json({
    account: account,
    accountLink: accountLink,
  });
};

const onBoardedStripe = async (req, res, next) => {
  console.log("Onboarded stripe");
  let accountLink;
  try {
    accountLink = await stripeService.onBoardStripe();
  } catch (err) {
    const error = new HttpError(
      "Linking stripe account failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    accountLink:
      "Account created successfully! Close the browser and return to the app. Thanks!",
  });
};

const getStripeAccountByAccountId = async (req, res, next) => {
  console.log(
    "Get Stripe Account by account id stripe",
    req.params.stripeaccountid
  );
  let accountLink;
  try {
    //const stripeUser = await StripeUser.findById(req.params.stripeaccountid);
    let existingStripeUser;
    console.log("Stripe user");
    try {
      existingStripeUser = await StripeUser.findOne({
        _id: req.params.stripeaccountid,
      });
      console.log("Stripe user ret ", existingStripeUser);
    } catch (err) {
      const error = new HttpError("Stripe User Not Found", 500);
      //return next(error);
    }
    console.log("Existing stripe user ", existingStripeUser)
    accountLink = await stripeService.retrieveStripeAccountByAccountId(
      existingStripeUser.id
    );
  } catch (err) {
    const error = new HttpError(
      "Linking stripe account failed, please try again later." + err,
      500
    );
    return next(error);
  }

  res.json({
    accountLink: accountLink,
  });
};

const getStripeBalanceAccountId = async (req, res, next) => {
  console.log(
    "Get Stripe Account balance stripe id",
    req.params.stripeaccountid
  );
  let balance;
  try {
    //const stripeUser = await StripeUser.findById(req.params.stripeaccountid);
    let existingStripeUser;
    console.log("Stripe user");
    try {
      existingStripeUser = await StripeUser.findOne({
        _id: req.params.stripeaccountid,
      });
      console.log("Stripe user ret ", existingStripeUser.id);
    } catch (err) {
      const error = new HttpError("Stripe User Not Found", 500);
      //return next(error);
    }

    balance = await stripeService.retrieveStripeBalanceByAccountId(
      existingStripeUser.id
    );
  } catch (err) {
    const error = new HttpError(
      "Linking stripe account failed, please try again later." + err,
      500
    );
    return next(error);
  }

  res.json({
    balance: balance,
  });
};

const createStAccountCustom = async (req, res, next) => {
  console.log("CreaTE Stripe Custom Account1",req.body.email);
  let accountLink;
  let account;
  
  try {

    account = await stripeService.createStripeCustomAccount(req.body);

  } catch (err) {
    const error = new HttpError(
      "Linking custom stripe account failed, please try again later." + err,
      500
    );
  }

  try {
    console.log("CreaTE Stripe Account2= Link", account.id);
    accountLink = await stripeService.createStripeCustomAccountLink(account.id);
    console.log("CreaTE Stripe Account Link 2");

    const newAccLink = new StripeUserAccountLink(accountLink);
    await newAccLink.save();
    console.log("CreaTE Stripe Account Link 3", newAccLink);
    account["accountlink"] = newAccLink._id;

    const newAcc = new StripeUser(account);
    const savedAcc = await newAcc.save();

    let existingUser;
    try {
      existingUser = await User.findOne({ email: account.email });
      console.log("CreaTE Stripe Account Link 3", existingUser);
      existingUser["stripeuser"] = savedAcc._id;

      await existingUser.save();

      console.log("CreaTE Stripe Account99");
    } catch (err) {
      const error = new HttpError(
        "Signing up failed, please try again later.",
        500
      );
      return next(error);
    }

    console.log("CreaTE Stripe Account3");
  } catch (err) {
    const error = new HttpError(
      "Linking stripe account failed, please try again later." + err,
      500
    );
    return next(error);
  }

  res.json({
    account: account,
    accountLink: accountLink,
  });
};

exports.createStAccount = createStAccount;
exports.createStAccountCustom = createStAccountCustom;
exports.onBoardedStripe = onBoardedStripe;
exports.getStripeAccountByAccountId = getStripeAccountByAccountId;
exports.getStripeBalanceAccountId = getStripeBalanceAccountId;
