const Event = require('../models/event');
const EventParticipant = require('../models/event-participant');
const User = require('../models/user');
const { sendInvitationEmail, sendRSVPConfirmation, sendReminderEmail } = require('../services/email-service');
const { sendInvitationSMS, sendRSVPConfirmationSMS, sendReminderSMS } = require('../services/sms-service');

// ========================================
// SEND INVITATIONS (Handles both types)
// ========================================

/**
 * Send invitations to multiple guests
 * POST /api/events/:eventId/invite
 * Body: { 
 *   guests: [
 *     { userId: ObjectId } OR
 *     { email: String, name: String, phone?: String }
 *   ]
 * }
 */
const sendInvitations = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guests } = req.body; // Array of guest objects
    
    if (!guests || !Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ message: 'Please provide guest list' });
    }
    
    // Find event
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is host
    if (!event.isHost(req.userData.userId)) {
      return res.status(403).json({ message: 'Only hosts can send invitations' });
    }
    
    let registeredCount = 0;
    let externalCount = 0;
    const errors = [];
    
    for (const guest of guests) {
      try {
        if (guest.userId) {
          // ========================================
          // REGISTERED USER → EventParticipant
          // ========================================
          
          // Check if already participant
          const existing = await EventParticipant.findOne({
            event: eventId,
            user: guest.userId,
          });
          
          if (!existing) {
            await EventParticipant.create({
              event: eventId,
              user: guest.userId,
              role: 'invited',
              rsvpStatus: 'pending',
              inviteMethod: 'in_app',
              invitedAt: new Date(),
            });
            registeredCount++;
          }
          
        } else if (guest.email) {
          // ========================================
          // EXTERNAL GUEST → Event.guestList
          // ========================================
          
          // Check if email already in guestList
          const alreadyInvited = event.guestList.some(
            g => g.email === guest.email
          );
          
          if (!alreadyInvited) {
            event.guestList.push({
              email: guest.email,
              name: guest.name || guest.email.split('@')[0],
              phone: guest.phone,
              rsvpStatus: 'pending',
              inviteMethod: 'email',
              invitedAt: new Date(),
            });
            externalCount++;
          }
          
        } else if (guest.phone) {
            // ========================================
            // EXTERNAL GUEST → Event.guestList
            // ========================================
            
            // Check if phone already in guestList
            const alreadyInvited = event.guestList.some(
              g => g.phone === guest.phone
            );
            
            if (!alreadyInvited) {
              event.guestList.push({
                email: guest.email,
                name: guest.name || guest.email.split('@')[0],
                phone: guest.phone,
                rsvpStatus: 'pending',
                inviteMethod: 'sms',
                invitedAt: new Date(),
              });
              externalCount++;
            }
            
          } 
        else {
          errors.push('Guest must have userId or email');
        }
      } catch (error) {
        errors.push(`Failed to invite: ${error.message}`);
      }
    }
    
    // Save event with new guestList
    await event.save();
    
    //  Send actual emails/SMS (Day 5)

    for (const guest of guests) {
        try {
          if (guest.userId) {
            // ... create EventParticipant ...
            
            // Send in-app notification (implement later)
            
          } else if (guest.email) {
            // ✅ SEND EMAIL
            if (guest.email) {
              await sendInvitationEmail(event, {
                email: guest.email,
                name: guest.name,
              });
            }
            
            // ✅ SEND SMS (if phone provided)
            if (guest.phone) {
              await sendInvitationSMS(event, {
                phone: guest.phone,
                name: guest.name,
              });
            }
          }
        } catch (error) {
          errors.push(`Failed to invite ${guest.email}: ${error.message}`);
        }
      }


    console.log(`📧 Would send ${registeredCount} in-app + ${externalCount} email invitations`);
    
    res.status(200).json({
      message: `Sent ${registeredCount + externalCount} invitation(s)`,
      registeredUsers: registeredCount,
      externalGuests: externalCount,
      errors: errors.length > 0 ? errors : undefined,
    });
    
  } catch (error) {
    console.error('Error sending invitations:', error);
    res.status(500).json({ message: 'Failed to send invitations' });
  }
};

// ========================================
// GET GUEST LIST (Both types)
// ========================================

/**
 * Get all guests for an event
 * GET /api/events/:eventId/guests
 */
const getGuestList = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Get registered users
    const participants = await EventParticipant.find({ 
      event: eventId,
      isActive: true,
    })
    .populate('user', 'fname lname email profileImage')
    .sort({ joinedAt: 1 });
    
    // Get external guests
    const externalGuests = event.guestList;
    
    // Calculate combined RSVP stats
    const participantStats = await EventParticipant.getRSVPStats(eventId);
    const guestListStats = event.calculateRSVPStats();
    
    const combinedStats = {
      total: participantStats.total + guestListStats.total,
      going: participantStats.going + guestListStats.going,
      maybe: participantStats.maybe + guestListStats.maybe,
      notGoing: participantStats.notGoing + guestListStats.notGoing,
      pending: participantStats.pending + guestListStats.pending,
      totalPlusOnes: participantStats.totalPlusOnes,
      totalAttending: participantStats.totalAttending + guestListStats.going,
    };
    
    combinedStats.responseRate = combinedStats.total > 0
      ? ((combinedStats.going + combinedStats.maybe + combinedStats.notGoing) / combinedStats.total * 100).toFixed(1)
      : 0;
    
    res.status(200).json({
      registeredUsers: participants,
      externalGuests: externalGuests,
      stats: combinedStats,
      breakdown: {
        registered: participantStats,
        external: guestListStats,
      },
    });
    
  } catch (error) {
    console.error('Error getting guest list:', error);
    res.status(500).json({ message: 'Failed to get guest list' });
  }
};

// ========================================
// UPDATE RSVP (Checks both)
// ========================================

/**
 * Update guest RSVP status
 * PATCH /api/events/:eventId/rsvp
 * Body: { email, rsvpStatus, plusOnes?, dietaryRestrictions? }
 */
const updateRSVP = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { email, rsvpStatus, plusOnes, dietaryRestrictions, specialRequests } = req.body;
    
    if (!['going', 'maybe', 'not_going'].includes(rsvpStatus)) {
      return res.status(400).json({ message: 'Invalid RSVP status' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // ========================================
    // TRY REGISTERED USER FIRST
    // ========================================
    const user = await User.findOne({ email });
    
    if (user) {
      const participant = await EventParticipant.findOne({ 
        event: eventId, 
        user: user._id 
      });
      
      if (participant) {
        // Update EventParticipant
        await participant.updateRSVP(rsvpStatus, plusOnes || 0, dietaryRestrictions);
        
        if (specialRequests) {
          participant.specialRequests = specialRequests;
          await participant.save();
        }
        
        // Send notification to host (Day 5)
        if (email) {
            await sendRSVPConfirmation(event, { email, name: guest.name || email });
        }
        console.log(`✅ RSVP updated (registered user): ${email} - ${rsvpStatus}`);
        
        return res.status(200).json({
          message: 'RSVP updated successfully',
          guest: participant,
          type: 'registered',
        });
      }
    }
    
    // ========================================
    // TRY EXTERNAL GUEST
    // ========================================
    const guest = event.guestList.find(g => g.email === email);
    
    if (guest) {
      // Update Event.guestList
      guest.rsvpStatus = rsvpStatus;
      guest.respondedAt = new Date();
      
      if (plusOnes !== undefined) {
        if (!event.allowPlusOnes && plusOnes > 0) {
          return res.status(400).json({ message: 'Plus ones not allowed for this event' });
        }
        guest.plusOnes = Math.min(plusOnes, event.maxPlusOnes);
      }
      
      if (dietaryRestrictions) {
        guest.dietaryRestrictions = dietaryRestrictions;
      }
      
      if (specialRequests) {
        guest.specialRequests = specialRequests;
      }
      
      await event.save();
      
      // TODO: Send notification to host (Day 5)
      console.log(`✅ RSVP updated (external guest): ${email} - ${rsvpStatus}`);
      
      return res.status(200).json({
        message: 'RSVP updated successfully',
        guest: guest,
        type: 'external',
      });
    }
    
    // Guest not found in either
    res.status(404).json({ message: 'Guest not found' });
    
  } catch (error) {
    console.error('Error updating RSVP:', error);
    res.status(500).json({ message: 'Failed to update RSVP' });
  }
};

// ========================================
// REMOVE GUEST (Both types)
// ========================================

/**
 * Remove a guest from event
 * DELETE /api/events/:eventId/guests/:guestIdentifier
 * guestIdentifier can be: participantId OR email
 */
const removeGuest = async (req, res) => {
    try {
      const { eventId, guestId } = req.params;
      
      console.log('Remove guest request:', { eventId, guestId, userId: req.userData.userId });
      
      // Find event
      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Check if user is event creator
      if (event.createdBy.toString() !== req.userData.userId) {
        return res.status(403).json({ message: 'Not authorized to manage this event' });
      }
      
      // Find guest in guestList
      const guestIndex = event.guestList.findIndex(
        g => g._id.toString() === guestId
      );
      
      if (guestIndex === -1) {
        console.log('Guest not found in guestList:', {
          guestId,
          availableGuests: event.guestList.map(g => g._id.toString())
        });
        return res.status(404).json({ message: 'Guest not found in guest list' });
      }
      
      const removedGuest = event.guestList[guestIndex];
      
      // Remove guest from array
      event.guestList.splice(guestIndex, 1);
      
      await event.save();
      
      console.log('Guest removed successfully:', removedGuest.name);
      
      res.json({ 
        message: 'Guest removed successfully',
        removedGuest: {
          name: removedGuest.name,
          email: removedGuest.email,
        }
      });
      
    } catch (error) {
      console.error('Remove guest error:', error);
      res.status(500).json({ 
        message: 'Failed to remove guest',
        error: error.message 
      });
    }
  };

// ========================================
// RESEND INVITATION
// ========================================

/**
 * Resend invitation to a guest
 * POST /api/events/:eventId/guests/resend
 * Body: { email }
 */
const resendInvite = async (req, res) => {
    try {
      const { eventId } = req.params;
      const { guestId } = req.body;
      
      console.log('Resend invite request:', { eventId, guestId });
      
      // Find event
      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Check if user is event creator
      if (event.createdBy.toString() !== req.userData.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // Find guest in guestList
      const guest = event.guestList.find(
        g => g._id.toString() === guestId
      );
      
      if (!guest) {
        return res.status(404).json({ message: 'Guest not found in guest list' });
      }
      
      // Update invitedAt timestamp
      guest.invitedAt = new Date();
      guest.inviteMethod = guest.email ? 'email' : (guest.phone ? 'sms' : 'in_app');
      
      await event.save();
      
      // TODO: Actually send email/SMS invitation here
      // const emailService = require('../services/email-service');
      // await emailService.sendInvitation(guest.email, event);
      
      console.log('Invitation resent to:', guest.name);
      
      res.json({ 
        message: 'Invitation sent successfully',
        guest: {
          name: guest.name,
          email: guest.email,
          invitedAt: guest.invitedAt,
        }
      });
      
    } catch (error) {
      console.error('Resend invite error:', error);
      res.status(500).json({ 
        message: 'Failed to resend invitation',
        error: error.message 
      });
    }
  };

/**
 * Send invitations to all pending guests
 * POST /api/events/:eventId/send-all-invites
 */
const sendAllInvites = async (req, res) => {
    try {
      const { eventId } = req.params;
      
      console.log('Send all invites request:', { eventId });
      
      // Find event
      const event = await Event.findById(eventId);
      
      if (!event) {
        return res.status(404).json({ message: 'Event not found' });
      }
      
      // Check if user is event creator
      if (event.createdBy.toString() !== req.userData.userId) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      
      // Find all pending guests
      const pendingGuests = event.guestList.filter(
        g => g.rsvpStatus === 'pending'
      );
      
      if (pendingGuests.length === 0) {
        return res.status(400).json({ message: 'No pending guests to invite' });
      }
      
      // Update invitedAt timestamp for all pending guests
      const now = new Date();
      pendingGuests.forEach(guest => {
        guest.invitedAt = now;
        guest.inviteMethod = guest.email ? 'email' : (guest.phone ? 'sms' : 'in_app');
      });
      
      await event.save();
      
      // TODO: Actually send email/SMS invitations here
      // const emailService = require('../services/email-service');
      // await emailService.sendBulkInvitations(pendingGuests, event);
      
      console.log(`Invitations sent to ${pendingGuests.length} guests`);
      
      res.json({ 
        message: 'Invitations sent successfully',
        count: pendingGuests.length,
        guests: pendingGuests.map(g => ({
          name: g.name,
          email: g.email,
        }))
      });
      
    } catch (error) {
      console.error('Send all invites error:', error);
      res.status(500).json({ 
        message: 'Failed to send invitations',
        error: error.message 
      });
    }
  };

// ========================================
// SEND REMINDER (Both types)
// ========================================

/**
 * Send reminder to all pending guests
 * POST /api/events/:eventId/remind
 */
const sendReminder = async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is host
    if (!event.isHost(req.userData.userId)) {
      return res.status(403).json({ message: 'Only hosts can send reminders' });
    }
    
    // Get pending registered users
    const pendingParticipants = await EventParticipant.findPendingRSVPs(eventId);
    
    // Get pending external guests
    const pendingExternal = event.guestList.filter(
      g => g.rsvpStatus === 'pending'
    );
    
    const totalPending = pendingParticipants.length + pendingExternal.length;
    
    // TODO: Send actual reminder emails/SMS (Day 5)
    console.log(`📧 Would send reminders to ${totalPending} guests`);
    console.log(`   - ${pendingParticipants.length} registered users`);
    console.log(`   - ${pendingExternal.length} external guests`);
    
    // Send to registered users
    for (const participant of pendingParticipants) {
        if (participant.user.email) {
        await sendReminderEmail(event, {
            email: participant.user.email,
            name: `${participant.user.fname} ${participant.user.lname}`,
        });
        }
    }
    
    // Send to external guests
    for (const guest of pendingExternal) {
        if (guest.email) {
        await sendReminderEmail(event, guest);
        }
        if (guest.phone) {
        await sendReminderSMS(event, guest);
        }
    }
    
    res.status(200).json({
      message: `Reminder sent to ${totalPending} guest(s)`,
      registered: pendingParticipants.length,
      external: pendingExternal.length,
    });
    
  } catch (error) {
    console.error('Error sending reminder:', error);
    res.status(500).json({ message: 'Failed to send reminder' });
  }
};

// ========================================
// BULK IMPORT GUESTS
// ========================================

/**
 * Bulk import guests from CSV
 * POST /api/events/:eventId/guests/import
 * Body: { guests: [{ name, email, phone }] }
 */
const bulkImportGuests = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { guests } = req.body;
    
    if (!Array.isArray(guests) || guests.length === 0) {
      return res.status(400).json({ message: 'Invalid guest list' });
    }
    
    const event = await Event.findById(eventId);
    if (!event) {
      return res.status(404).json({ message: 'Event not found' });
    }
    
    // Check if user is host
    if (!event.isHost(req.userData.userId)) {
      return res.status(403).json({ message: 'Only hosts can import guests' });
    }
    
    let registered = 0;
    let external = 0;
    let skipped = 0;
    
    for (const guest of guests) {
      if (!guest.email) {
        skipped++;
        continue;
      }
      
      // Check if user exists
      const user = await User.findOne({ email: guest.email });
      
      if (user) {
        // Add as EventParticipant
        const exists = await EventParticipant.findOne({
          event: eventId,
          user: user._id,
        });
        
        if (!exists) {
          await EventParticipant.create({
            event: eventId,
            user: user._id,
            role: 'invited',
            rsvpStatus: 'pending',
          });
          registered++;
        } else {
          skipped++;
        }
      } else {
        // Add to guestList
        const exists = event.guestList.some(g => g.email === guest.email);
        
        if (!exists) {
          event.guestList.push({
            name: guest.name || guest.email.split('@')[0],
            email: guest.email,
            phone: guest.phone,
            rsvpStatus: 'pending',
          });
          external++;
        } else {
          skipped++;
        }
      }
    }
    
    await event.save();
    
    res.status(200).json({
      message: `Imported ${registered + external} guests, skipped ${skipped}`,
      registered,
      external,
      skipped,
      total: registered + external,
    });
    
  } catch (error) {
    console.error('Error importing guests:', error);
    res.status(500).json({ message: 'Failed to import guests' });
  }
};

module.exports = {
    sendInvitations,
    getGuestList,
    updateRSVP,
    removeGuest,
    resendInvite,
    sendAllInvites,
    sendReminder,
    bulkImportGuests,
  };
