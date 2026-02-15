const fs = require('fs');

const { validationResult } = require('express-validator');
const mongoose = require('mongoose');

const HttpError = require('../models/http-error');

const Message = require('../models/message');
const InvestmentEvent = require('../models/investment-event');
const EventParticipant = require('../models/event-participant');
const User = require('../models/user');
const { getIO } = require('../socket/socket-server');

// Send a message
exports.sendMessage = async (req, res, next) => {
  const { eventId, content, messageType, metadata, replyTo } = req.body;
  const userId = req.userData.userId;
  
  try {
    // Verify user is participant
    const participant = await EventParticipant.findOne({
      event: eventId,
      user: userId,
      isActive: true
    });
    
    if (!participant) {
      return res.status(403).json({ message: 'Not authorized to send messages in this event' });
    }
    
    // Create message
    const message = new Message({
      event: eventId,
      sender: userId,
      messageType: messageType || 'text',
      content: {
        text: content,
        mentions: extractMentions(content)
      },
      metadata,
      replyTo
    });
    
    await message.save();
    await message.populate('sender', 'fname lname email');
    
    // Update reply count if this is a reply
    if (replyTo) {
      await Message.findByIdAndUpdate(replyTo, { $inc: { replyCount: 1 } });
    }
    
    // Update unread counts for other participants
    await updateUnreadCounts(eventId, userId);
    
    // Emit real-time update via Socket.IO
    const io = getIO();
    io.to(`event-${eventId}`).emit('new-message', message);
    
    // Send push notifications
    await sendMessageNotifications(eventId, message, userId);
    
    res.status(201).json({ message });
  } catch (error) {
    next(error);
  }
};

// Get event messages
exports.getEventMessages = async (req, res, next) => {
  const { eventId } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const userId = req.userData.userId;
  
  try {
    // Verify access
    const participant = await EventParticipant.findOne({
      event: eventId,
      user: userId
    });
    
    if (!participant) {
      return res.status(403).json({ message: 'Not authorized' });
    }
    
    const messages = await Message.find({ 
      event: eventId,
      isDeleted: false
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('sender', 'fname lname email')
      .populate('replyTo', 'content.text sender');
    
    // Mark messages as read
    await markMessagesAsRead(eventId, userId);
    
    res.json({ 
      messages: messages.reverse(), // Return in chronological order
      page,
      hasMore: messages.length === limit
    });
  } catch (error) {
    next(error);
  }
};

// System message for contributions
exports.createContributionMessage = async (eventId, contribution) => {
  const event = await InvestmentEvent.findById(eventId);
  const percentageOfGoal = (contribution.amount / event.targetAmount) * 100;
  
  const message = new Message({
    event: eventId,
    sender: contribution.contributor,
    messageType: 'contribution',
    content: {
      text: contribution.isAnonymous 
        ? `Someone contributed $${contribution.amount}! 🎉` 
        : `${contribution.contributor.fname} contributed $${contribution.amount}! 🎉`
    },
    metadata: {
      contribution: {
        amount: contribution.amount,
        contributionId: contribution._id,
        isFirstContribution: event.contributors.length === 1,
        newTotal: event.currentAmount,
        percentageOfGoal: percentageOfGoal.toFixed(1)
      }
    }
  });
  
  await message.save();
  await message.populate('sender', 'fname lname');
  
  // Emit to socket
  const io = getIO();
  io.to(`event-${eventId}`).emit('new-message', message);
  
  return message;
};

// System message for stock updates
exports.createStockUpdateMessage = async (eventId, symbol, priceData) => {
  const message = new Message({
    event: eventId,
    messageType: 'stockUpdate',
    content: {
      text: `${symbol} is now $${priceData.currentPrice.toFixed(2)} (${priceData.percentChange > 0 ? '+' : ''}${priceData.percentChange.toFixed(2)}%)`
    },
    metadata: {
      stockUpdate: {
        symbol,
        previousPrice: priceData.previousPrice,
        currentPrice: priceData.currentPrice,
        priceChange: priceData.priceChange,
        percentChange: priceData.percentChange,
        timestamp: new Date()
      }
    }
  });
  
  await message.save();
  
  const io = getIO();
  io.to(`event-${eventId}`).emit('new-message', message);
  
  return message;
};

// System message for milestones
exports.createMilestoneMessage = async (eventId, milestoneType) => {
  const event = await InvestmentEvent.findById(eventId);
  const percentage = (event.currentAmount / event.targetAmount) * 100;
  
  const milestoneMessages = {
    '25_percent': '🎯 25% funded! Keep it going!',
    '50_percent': '🎉 Halfway there! 50% funded!',
    '75_percent': '🚀 75% funded! Almost there!',
    '100_percent': '🎊 FULLY FUNDED! Time to buy stocks!',
    'deadline_near': '⏰ Only 24 hours left to contribute!',
    'first_contribution': '🎈 First contribution received!'
  };
  
  const message = new Message({
    event: eventId,
    messageType: 'milestone',
    content: {
      text: milestoneMessages[milestoneType]
    },
    metadata: {
      milestone: {
        milestoneType,
        currentAmount: event.currentAmount,
        targetAmount: event.targetAmount,
        percentageReached: percentage
      }
    },
    isPinned: milestoneType === '100_percent'
  });
  
  await message.save();
  
  const io = getIO();
  io.to(`event-${eventId}`).emit('new-message', message);
  
  return message;
};

// Add reaction to message
exports.addReaction = async (req, res, next) => {
  const { messageId } = req.params;
  const { emoji } = req.body;
  const userId = req.userData.userId;
  
  try {
    const message = await Message.findById(messageId);
    
    // Check if user already reacted with this emoji
    const existingReaction = message.reactions.find(
      r => r.user.toString() === userId && r.emoji === emoji
    );
    
    if (existingReaction) {
      // Remove reaction
      message.reactions = message.reactions.filter(
        r => !(r.user.toString() === userId && r.emoji === emoji)
      );
    } else {
      // Add reaction
      message.reactions.push({ user: userId, emoji });
    }
    
    await message.save();
    
    // Emit update
    const io = getIO();
    io.to(`event-${message.event}`).emit('reaction-update', {
      messageId,
      reactions: message.reactions
    });
    
    res.json({ reactions: message.reactions });
  } catch (error) {
    next(error);
  }
};

// Helper functions
function extractMentions(text) {
  const mentionRegex = /@(\w+)/g;
  const mentions = [];
  let match;
  
  while ((match = mentionRegex.exec(text)) !== null) {
    mentions.push(match[1]);
  }
  
  return mentions;
}

async function updateUnreadCounts(eventId, excludeUserId) {
  await EventParticipant.updateMany(
    { 
      event: eventId, 
      user: { $ne: excludeUserId },
      isActive: true
    },
    { $inc: { unreadCount: 1 } }
  );
}

async function markMessagesAsRead(eventId, userId) {
  const participant = await EventParticipant.findOne({
    event: eventId,
    user: userId
  });
  
  if (participant.unreadCount > 0) {
    participant.unreadCount = 0;
    participant.lastReadAt = new Date();
    await participant.save();
  }
}

async function sendMessageNotifications(eventId, message, senderId) {
  // Get all participants who want notifications
  const participants = await EventParticipant.find({
    event: eventId,
    user: { $ne: senderId },
    isActive: true,
    'chatSettings.notificationPreferences.newMessages': true,
    'chatSettings.isMuted': false
  }).populate('user', 'fcmToken email fname');
  
  // Send push notifications (implementation depends on your notification service)
  // This is a placeholder
  for (const participant of participants) {
    // await sendPushNotification(participant.user.fcmToken, {
    //   title: `New message in ${event.eventTitle}`,
    //   body: message.content.text
    // });
  }
}

module.exports = exports;