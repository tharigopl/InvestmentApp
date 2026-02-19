// backend/controllers/contacts-controllers.js
const Contact = require('../models/contact');
const User = require('../models/user');
const HttpError = require('../models/http-error');

// Helper: handle nested auth structure
function extractUserId(userData) {
  if (!userData) return null;
  if (userData.userId && typeof userData.userId === 'object' && userData.userId.userId) {
    return userData.userId.userId;
  }
  if (typeof userData.userId === 'string') return userData.userId;
  return null;
}

/**
 * Get all contacts for current user
 * GET /api/contacts
 */
const getContacts = async (req, res, next) => {
  try {
    const userId = extractUserId(req.userData);
    
    const result = await Contact.getContactsWithStats(userId);
    
    res.json({ 
      contacts: result.contacts,
      stats: result.stats
    });
  } catch (error) {
    console.error('Get contacts error:', error);
    return next(new HttpError('Failed to fetch contacts', 500));
  }
};

/**
 * Get single contact by ID
 * GET /api/contacts/:contactId
 */
const getContactById = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = extractUserId(req.userData);
    
    const contact = await Contact.findOne({
      _id: contactId,
      addedBy: userId
    });
    
    if (!contact) {
      return next(new HttpError('Contact not found', 404));
    }
    
    res.json({ contact });
  } catch (error) {
    console.error('Get contact error:', error);
    return next(new HttpError('Failed to fetch contact', 500));
  }
};

/**
 * Add new contact
 * POST /api/contacts
 */
const createContact = async (req, res, next) => {
  try {
    const { email, firstName, lastName, phoneNumber, tags, notes } = req.body;
    const userId = extractUserId(req.userData);
    
    // Validate required fields
    if (!email || !firstName || !lastName) {
      return next(new HttpError('Email, first name, and last name are required', 400));
    }
    
    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();
    
    // Check if contact already exists for this user
    const existingContact = await Contact.findOne({ 
      email: normalizedEmail, 
      addedBy: userId 
    });
    
    if (existingContact) {
      return next(new HttpError('You already have a contact with this email', 400));
    }
    
    // Check if this email belongs to an existing user
    const existingUser = await User.findOne({ 
      email: normalizedEmail,
      isDeleted: false
    });
    
    if (existingUser) {
      // Email belongs to a user - add as friend instead
      const currentUser = await User.findById(userId);
      
      // Check if already friends
      if (currentUser.friends.includes(existingUser._id)) {
        return res.status(200).json({ 
          message: 'This user is already your friend',
          type: 'user',
          alreadyFriends: true,
          friend: {
            id: existingUser._id,
            name: `${existingUser.fname} ${existingUser.lname}`,
            email: existingUser.email,
            profileImage: existingUser.profileImage
          }
        });
      }
      
      // Add as friend (mutual)
      currentUser.friends.push(existingUser._id);
      existingUser.friends.push(userId);
      
      await currentUser.save();
      await existingUser.save();
      
      return res.status(200).json({ 
        message: 'This email belongs to an existing user. They have been added as your friend!',
        type: 'user',
        friend: {
          id: existingUser._id,
          name: `${existingUser.fname} ${existingUser.lname}`,
          email: existingUser.email,
          profileImage: existingUser.profileImage
        }
      });
    }
    
    // Create new contact
    const contact = new Contact({
      email: normalizedEmail,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
      addedBy: userId,
      tags: tags || [],
      notes: notes ? notes.trim() : undefined
    });
    
    await contact.save();
    
    // Add to user's externalContacts array
    const user = await User.findById(userId);
    user.externalContacts.push(contact._id);
    await user.save();
    
    res.status(201).json({ 
      message: 'Contact added successfully',
      type: 'contact',
      contact 
    });
  } catch (error) {
    console.error('Create contact error:', error);
    return next(new HttpError('Failed to create contact', 500));
  }
};

/**
 * Update contact
 * PATCH /api/contacts/:contactId
 */
const updateContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const { firstName, lastName, phoneNumber, notes, tags, receiveNotifications } = req.body;
    const userId = extractUserId(req.userData);
    
    const contact = await Contact.findOne({
      _id: contactId,
      addedBy: userId
    });
    
    if (!contact) {
      return next(new HttpError('Contact not found', 404));
    }
    
    // Check if contact is already linked to a user
    if (contact.linkedUserId) {
      return next(new HttpError('This contact has created an account and is now a friend. You cannot edit their information.', 400));
    }
    
    // Update fields
    if (firstName !== undefined) contact.firstName = firstName.trim();
    if (lastName !== undefined) contact.lastName = lastName.trim();
    if (phoneNumber !== undefined) contact.phoneNumber = phoneNumber ? phoneNumber.trim() : null;
    if (notes !== undefined) contact.notes = notes ? notes.trim() : null;
    if (tags !== undefined) contact.tags = tags;
    if (receiveNotifications !== undefined) contact.receiveNotifications = receiveNotifications;
    
    await contact.save();
    
    res.json({ 
      message: 'Contact updated successfully',
      contact 
    });
  } catch (error) {
    console.error('Update contact error:', error);
    return next(new HttpError('Failed to update contact', 500));
  }
};

/**
 * Delete contact
 * DELETE /api/contacts/:contactId
 */
const deleteContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = extractUserId(req.userData);
    
    const contact = await Contact.findOne({
      _id: contactId,
      addedBy: userId
    });
    
    if (!contact) {
      return next(new HttpError('Contact not found', 404));
    }
    
    // Remove from user's externalContacts array
    const user = await User.findById(userId);
    user.externalContacts = user.externalContacts.filter(
      id => id.toString() !== contact._id.toString()
    );
    await user.save();
    
    // Delete the contact
    await contact.deleteOne();
    
    res.json({ 
      message: 'Contact deleted successfully' 
    });
  } catch (error) {
    console.error('Delete contact error:', error);
    return next(new HttpError('Failed to delete contact', 500));
  }
};

/**
 * Send invitation to contact to join the app
 * POST /api/contacts/:contactId/invite
 */
const inviteContact = async (req, res, next) => {
  try {
    const { contactId } = req.params;
    const userId = extractUserId(req.userData);
    
    const contact = await Contact.findOne({
      _id: contactId,
      addedBy: userId
    });
    
    if (!contact) {
      return next(new HttpError('Contact not found', 404));
    }
    
    // Check if already linked to a user
    if (contact.linkedUserId) {
      return next(new HttpError('This contact already has an account', 400));
    }
    
    // Generate invite link
    const inviteLink = contact.generateInviteLink();
    await contact.save();
    
    // TODO: Send email with invite link
    // await sendInviteEmail({
    //   to: contact.email,
    //   firstName: contact.firstName,
    //   inviteLink: inviteLink,
    //   inviterName: req.userData.userName
    // });
    
    console.log(`Invite link generated for ${contact.email}: ${inviteLink}`);
    
    res.json({ 
      message: 'Invitation sent successfully',
      inviteLink: inviteLink, // Remove in production
      contact
    });
  } catch (error) {
    console.error('Invite contact error:', error);
    return next(new HttpError('Failed to send invitation', 500));
  }
};

/**
 * Bulk import contacts from CSV or array
 * POST /api/contacts/bulk
 */
const bulkCreateContacts = async (req, res, next) => {
  try {
    const { contacts } = req.body;
    const userId = extractUserId(req.userData);
    
    if (!Array.isArray(contacts) || contacts.length === 0) {
      return next(new HttpError('Please provide an array of contacts', 400));
    }
    
    const results = {
      created: [],
      addedAsFriends: [],
      errors: [],
      skipped: []
    };
    
    for (const contactData of contacts) {
      try {
        const { email, firstName, lastName, phoneNumber } = contactData;
        
        if (!email || !firstName || !lastName) {
          results.errors.push({
            email: email || 'unknown',
            error: 'Missing required fields'
          });
          continue;
        }
        
        const normalizedEmail = email.toLowerCase().trim();
        
        // Check if contact already exists
        const existing = await Contact.findOne({ 
          email: normalizedEmail, 
          addedBy: userId 
        });
        
        if (existing) {
          results.skipped.push({
            email: normalizedEmail,
            reason: 'Already exists'
          });
          continue;
        }
        
        // Check if user exists
        const existingUser = await User.findOne({ 
          email: normalizedEmail,
          isDeleted: false 
        });
        
        if (existingUser) {
          // Add as friend
          const currentUser = await User.findById(userId);
          if (!currentUser.friends.includes(existingUser._id)) {
            currentUser.friends.push(existingUser._id);
            existingUser.friends.push(userId);
            await currentUser.save();
            await existingUser.save();
            
            results.addedAsFriends.push({
              email: normalizedEmail,
              name: `${existingUser.fname} ${existingUser.lname}`
            });
          } else {
            results.skipped.push({
              email: normalizedEmail,
              reason: 'Already friends'
            });
          }
          continue;
        }
        
        // Create contact
        const contact = new Contact({
          email: normalizedEmail,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber ? phoneNumber.trim() : undefined,
          addedBy: userId
        });
        
        await contact.save();
        
        // Add to user's contacts
        const user = await User.findById(userId);
        user.externalContacts.push(contact._id);
        await user.save();
        
        results.created.push({
          email: normalizedEmail,
          name: contact.displayName
        });
      } catch (error) {
        results.errors.push({
          email: contactData.email || 'unknown',
          error: error.message
        });
      }
    }
    
    res.json({ 
      message: 'Bulk import completed',
      summary: {
        total: contacts.length,
        created: results.created.length,
        addedAsFriends: results.addedAsFriends.length,
        skipped: results.skipped.length,
        errors: results.errors.length
      },
      results
    });
  } catch (error) {
    console.error('Bulk create error:', error);
    return next(new HttpError('Failed to import contacts', 500));
  }
};

module.exports = {
  getContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  inviteContact,
  bulkCreateContacts
};