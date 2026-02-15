const axios = require("axios");

const HttpError = require("../models/http-error");
require("dotenv").config();

const API_KEY = "AIzaSyDgLmMpKCzveJf1_yuA0fUzzhy0WRChvZA";
//const config = require('../config');

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY, {
  apiVersion: process.env.STRIPE_API_VERSION || "2022-08-01",
});

async function createStripeCustomAccount(body) {  

  const data = body;

  function now(){
    return Math.round((new Date()).getTime() / 1000 );
  }

  console.log("Inside create struipe cstom accouint 1", data.email)
  let stripeUserData = {};
  stripeUserData["email"] = data.email;
  stripeUserData["country"] = "US";
  stripeUserData["business_type"] = "individual";
  stripeUserData["type"] = "custom";
  stripeUserData["business_profile"]["mcc"] = "7623";
  stripeUserData["business_profile"]["url"] =  data.url
  stripeUserData["requested_capabilities"] = ['card_payments', 'transfers'];
  stripeUserData["external_account"] = data.external_account;
  stripeUserData["company"]["name"] = data.companyname;
  stripeUserData["company"]["phone"] = data.phone;
  stripeUserData["company"]["tax_id"] = data.tax_id;
  stripeUserData["company"]["address"]["line1"] = data.addressline1;
  stripeUserData["company"]["address"]["city"] = data.city;
  stripeUserData["company"]["address"]["state"] = data.state;
  stripeUserData["company"]["address"]["postalcode"] = data.postalcode;

  console.log("Inside create struipe cstom accouint ", stripeUserData);
  var account = await stripe.accounts.create(stripeUserData);
  console.log(account);
  var accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: process.env.STRIPE_PUBLIC_DOMAIN + '/api/stripe/authorize',
      return_url: process.env.STRIPE_PUBLIC_DOMAIN + '/api/stripe/onboarded',
      type: 'custom_account_verification',
      collect:'eventually_due'
    });

    console.log(accountLink);
  // console.log("Account link ", accountLink);
  account['accountLink'] = accountLink;

  
  return account;
}

async function createStripeAccount(stripeUserData) {
  //const stripeUserData = {};
  //stripeUserData['business_type'] = 'individual';
  //stripeUserData['email'] = 'tori@gmail.com';
  // stripeUserData["country"] = "US";
  // stripeUserData["type"] = "express";
  // stripeUserData["requested_capabilities"] = ['card_payments', 'transfers'];
  // stripeUserData["business_type"] = "individual";
  // stripeUserData["business_profile"]["mcc"] = "7623";
  // stripeUserData["business_profile"]["url"] =  data.url

  // stripeUserData['individual'] = {
  //   'last_name' : 'DDDDDE',
  //   'first_name' : 'SSSSSSSDD',
  //   'email': 'tori@gmail.com'
  // };

  const account = await stripe.accounts.create(stripeUserData);
  //console.log("SSSSS",account);
  // Create an account link for the user's Stripe account
  // const accountLink = await stripe.accountLinks.create({
  //   account: account.id,
  //   refresh_url: process.env.STRIPE_PUBLIC_DOMAIN + '/api/stripe/authorize',
  //   return_url: process.env.STRIPE_PUBLIC_DOMAIN + '/api/stripe/onboarded',
  //   type: 'account_onboarding'
  // });
  // console.log("Account link ", accountLink);
  // account['accountLink'] = accountLink;
  return account;
}

async function createStripeAccountLink(accountid) {
  console.log("SSSSS", accountid);
  // Create an account link for the user's Stripe account
  const accountLink = await stripe.accountLinks.create({
    account: accountid,
    refresh_url: process.env.STRIPE_PUBLIC_DOMAIN + "/api/stripe/authorize",
    return_url: process.env.STRIPE_PUBLIC_DOMAIN + "/api/stripe/onboarded",
    type: "account_onboarding"
  });
  console.log("Account link ", accountLink);
  return accountLink;
}

async function createStripeCustomAccountLink(accountid) {
  console.log("SSSSS", accountid);
  // Create an account link for the user's Stripe account
  const accountLink = await stripe.accountLinks.create({
    account: accountid,
    refresh_url: process.env.STRIPE_PUBLIC_DOMAIN + "/api/stripe/authorize",
    return_url: process.env.STRIPE_PUBLIC_DOMAIN + "/api/stripe/onboarded",
    type: "custom_account_verification",
    collect:'eventually_due'

  });
  console.log("Account link ", accountLink);
  return accountLink;
}

async function onBoardStripe() {
  try {
    // Retrieve the user's Stripe account and check if they have finished onboarding
    console.log("On Boarded Stripe call");
    const account = await stripe.account.retrieve("acct_1NVmOcIquM8Jbwqu");
    //console.log("On Boarded Stripe call1", account);
    if (account.details_submitted) {
      // Redirect to the Rocket Rides dashboard
      //res.redirect('/hosts/dashboard');
    } else {
      console.log("The onboarding process was not completed.");
      //res.redirect('/hosts/signup');
    }
    //console.log(account);
    return account;
  } catch (err) {
    console.log("Failed to retrieve Stripe account information.");
    console.log(err);
  }
}

async function retrieveStripeAccountByAccountId(accountid) {
  try {
    // Retrieve the user's Stripe account and check if they have finished onboarding
    console.log("retrieve Stripe call");
    const account = await stripe.account.retrieve(accountid);
    //console.log("On Boarded Stripe call1", account);

    return account;
  } catch (err) {
    console.log("Failed to retrieve Stripe account information.");
    console.log(err);
  }
}

async function retrieveStripeBalanceByAccountId(accountid) {
  try {
    // Retrieve the user's Stripe account and check if they have finished onboarding
    console.log("retrieve Stripe balance");
    const account = await stripe.account.retrieve(accountid);
    //console.log("On Boarded Stripe call1", account);
    const balance = await stripe.balance.retrieve({
      stripeAccount: accountid,
    });
    return balance;
  } catch (err) {
    console.log("Failed to retrieve Stripe account information.");
    console.log(err);
  }
}

module.exports = {
  createStripeAccount,
  createStripeCustomAccount,
  onBoardStripe,
  createStripeAccountLink,
  createStripeCustomAccountLink,
  retrieveStripeAccountByAccountId,
  retrieveStripeBalanceByAccountId,
};
