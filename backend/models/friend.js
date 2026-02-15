const mongoose = require("mongoose");
const Schema = mongoose.Schema;
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SK, {
  apiVersion: process.env.STRIPE_API_VERSION || "2022-08-01",
});

// Use native promises.
mongoose.Promise = global.Promise;

// Define the Friend schema.
const FriendSchema = new Schema({
  email: { type: String, required: true, unique: true },
  firstName: String,
  lastName: String,
  created: { type: Date, default: Date.now },
  createdUser: { type: mongoose.Types.ObjectId, ref: "User" },

  // Stripe customer ID storing the payment sources.
  stripeCustomerId: String,
});

// Return a friend name for display.
FriendSchema.methods.displayName = function () {
  return `${this.firstName} ${this.lastName.charAt(0)}.`;
};

// Get the latest friend.
FriendSchema.statics.getLatest = async function () {
  try {
    // Count all the friends.
    const count = await Friend.countDocuments().exec();
    if (count === 0) {
      // Create default friends.
      await Friend.insertDefaultFriends();
    }
    // Return latest friend.
    return Friend.findOne().sort({ created: -1 }).exec();
  } catch (err) {
    console.log(err);
  }
};

// Find a random friend.
FriendSchema.statics.getRandom = async function () {
  try {
    // Count all the friends.
    const count = await Friend.countDocuments().exec();
    if (count === 0) {
      // Create default friends.
      await Friend.insertDefaultFriends();
    }
    // Returns a document after skipping a random amount.
    const random = Math.floor(Math.random() * count);
    return Friend.findOne().skip(random).exec();
  } catch (err) {
    console.log(err);
  }
};

// Create a few default friends for the platform to simulate rides.
FriendSchema.statics.insertDefaultFriends = async function () {
  try {
    const data = [
      {
        firstName: "Jenny",
        lastName: "Rosen",
        email: "jenny.rosen@example.com",
      },
      {
        firstName: "Kathleen",
        lastName: "Banks",
        email: "kathleen.banks@example.com",
      },
      {
        firstName: "Victoria",
        lastName: "Thompson",
        email: "victoria.thompson@example.com",
      },
      {
        firstName: "Ruth",
        lastName: "Hamilton",
        email: "ruth.hamilton@example.com",
      },
      {
        firstName: "Emma",
        lastName: "Lane",
        email: "emma.lane@example.com",
      },
    ];
    for (let object of data) {
      const friend = new Friend(object);
      // Create a Stripe account for each of the friends.
      const customer = await stripe.customers.create({
        email: friend.email,
        description: friend.displayName(),
      });
      friend.stripeCustomerId = customer.id;
      await friend.save();
    }
  } catch (err) {
    console.log(err);
  }
};

const Friend = mongoose.model("Friend", FriendSchema);

module.exports = Friend;
