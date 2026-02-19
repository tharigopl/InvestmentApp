// backend/models/contact.js
const mongoose = require('mongoose');
const crypto = require('crypto');
const Schema = mongoose.Schema;

/**
 * Contact Model
 * For external people who don't have accounts yet
 * They can receive gift links via email without needing to sign up
 */
const ContactSchema = new Schema({
  // Basic Info
  email: { 
    type: String, 
    required: true,
    lowercase: true,
    trim: true
  },
  firstName: { 
    type: String, 
    required: true,
    trim: true
  },
  lastName: { 
    type: String, 
    required: true,
    trim: true
  },
  phoneNumber: { 
    type: String,
    trim: true
  },
  
  // Who added this contact
  addedBy: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User',
    required: true
  },
  
  // Payment Integration (for Stripe)
  stripeCustomerId: { type: String },
  
  // Communication Preferences
  receiveNotifications: { 
    type: Boolean, 
    default: true 
  },
  
  // App Invitation Tracking
  invitedToJoin: { 
    type: Boolean, 
    default: false 
  },
  invitesSent: { 
    type: Number, 
    default: 0 
  },
  lastInviteSent: { type: Date },
  inviteToken: { type: String }, // For unique sign-up link
  
  // If they eventually create an account
  linkedUserId: { 
    type: mongoose.Types.ObjectId, 
    ref: 'User' 
  },
  linkedAt: { type: Date },
  
  // Metadata
  notes: { 
    type: String,
    maxlength: 500
  }, // User's private notes about this contact
  
  tags: [{ 
    type: String,
    trim: true,
    lowercase: true
  }], // E.g., 'family', 'college friend', 'coworker'
  
  // Timestamps
  created: { 
    type: Date, 
    default: Date.now 
  },
  lastUpdated: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true // Adds createdAt and updatedAt
});

// Compound Index: One contact per email per user
ContactSchema.index({ email: 1, addedBy: 1 }, { unique: true });

// Index for quick lookup when someone signs up
ContactSchema.index({ email: 1 });

// Index for finding contacts that became users
ContactSchema.index({ linkedUserId: 1 });

// Index for the user's contact list
ContactSchema.index({ addedBy: 1, linkedUserId: 1 });

// Virtual for display name
ContactSchema.virtual('displayName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for full name (alternative)
ContactSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for initials
ContactSchema.virtual('initials').get(function() {
  return `${this.firstName.charAt(0)}${this.lastName.charAt(0)}`.toUpperCase();
});

/**
 * Generate a unique invite link for this contact
 * @returns {string} - Invite URL
 */
ContactSchema.methods.generateInviteLink = function() {
  const token = crypto.randomBytes(32).toString('hex');
  this.inviteToken = token;
  this.invitedToJoin = true;
  this.invitesSent += 1;
  this.lastInviteSent = new Date();
  
  // In production, use your actual domain
  const baseUrl = process.env.APP_URL || 'https://yourapp.com';
  return `${baseUrl}/invite/${token}`;
};

/**
 * Link this contact to a user account
 * Called when contact signs up with the same email
 * @param {ObjectId} userId - The new user's ID
 */
ContactSchema.methods.linkToUser = async function(userId) {
  this.linkedUserId = userId;
  this.linkedAt = new Date();
  await this.save();
  
  // Get the user who added this contact
  const User = mongoose.model('User');
  const adder = await User.findById(this.addedBy);
  
  if (adder && !adder.friends.includes(userId)) {
    // Automatically add as friend
    adder.friends.push(userId);
    
    // Also add the adder to the new user's friends (mutual friendship)
    const newUser = await User.findById(userId);
    if (newUser && !newUser.friends.includes(this.addedBy)) {
      newUser.friends.push(this.addedBy);
      await newUser.save();
    }
    
    await adder.save();
  }
  
  return this;
};

/**
 * Static method to find contact by invite token
 * @param {string} token - Invite token
 * @returns {Promise<Contact>}
 */
ContactSchema.statics.findByInviteToken = function(token) {
  return this.findOne({ 
    inviteToken: token,
    linkedUserId: { $exists: false } // Not yet linked
  });
};

/**
 * Static method to check if contact exists and link on signup
 * @param {string} email - Email address
 * @param {ObjectId} userId - New user's ID
 * @returns {Promise<Array<Contact>>} - Linked contacts
 */
ContactSchema.statics.linkExistingContacts = async function(email, userId) {
  const contacts = await this.find({ 
    email: email.toLowerCase(),
    linkedUserId: { $exists: false }
  });
  
  for (const contact of contacts) {
    await contact.linkToUser(userId);
  }
  
  return contacts;
};

/**
 * Static method to get contacts with stats
 * @param {ObjectId} userId - User ID
 * @returns {Promise<Object>} - Contacts with statistics
 */
ContactSchema.statics.getContactsWithStats = async function(userId) {
  const contacts = await this.find({ 
    addedBy: userId,
    linkedUserId: { $exists: false } // Only unlinked contacts
  });
  
  const total = contacts.length;
  const invited = contacts.filter(c => c.invitedToJoin).length;
  const withPhone = contacts.filter(c => c.phoneNumber).length;
  
  return {
    contacts,
    stats: {
      total,
      invited,
      withPhone,
      notInvited: total - invited
    }
  };
};

// Pre-save middleware to update lastUpdated
ContactSchema.pre('save', function(next) {
  this.lastUpdated = new Date();
  next();
});

// Ensure virtuals are included when converting to JSON
ContactSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete ret.__v;
    return ret;
  }
});

ContactSchema.set('toObject', {
  virtuals: true
});

module.exports = mongoose.model('Contact', ContactSchema);