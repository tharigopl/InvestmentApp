const twilio = require('twilio');

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

const TWILIO_PHONE = process.env.TWILIO_PHONE_NUMBER;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:19006';

/**
 * Send invitation SMS
 */
async function sendInvitationSMS(event, guest) {
  try {
    const inviteUrl = `${FRONTEND_URL}/invite/${event.shareableSlug || event._id}`;
    
    // TODO: Use URL shortener (bit.ly, TinyURL) for SMS
    const shortUrl = inviteUrl;
    
    const message = `
${guest.name || 'Hi'},

You're invited to ${event.eventTitle}!

📅 ${new Date(event.eventDate).toLocaleDateString()}
${event.eventTime ? `🕐 ${event.eventTime}` : ''}
${event.location?.address ? `📍 ${event.location.address}` : ''}

RSVP: ${shortUrl}
    `.trim();
    
    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: guest.phone,
    });
    
    console.log(`📱 Invitation SMS sent to ${guest.phone} (SID: ${result.sid})`);
    
    return { success: true, messageId: result.sid };
    
  } catch (error) {
    console.error('Error sending SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send RSVP confirmation SMS
 */
async function sendRSVPConfirmationSMS(event, guest) {
  try {
    const eventDate = new Date(event.eventDate).toLocaleDateString();
    
    const message = `
Thanks for your RSVP, ${guest.name}!

${event.eventTitle}
${eventDate}
${event.eventTime || ''}

See you there! 🎉
    `.trim();
    
    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: guest.phone,
    });
    
    console.log(`📱 RSVP confirmation SMS sent to ${guest.phone}`);
    
    return { success: true, messageId: result.sid };
    
  } catch (error) {
    console.error('Error sending RSVP SMS:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reminder SMS
 */
async function sendReminderSMS(event, guest) {
  try {
    const inviteUrl = `${FRONTEND_URL}/invite/${event.shareableSlug || event._id}`;
    
    const message = `
Reminder: Please RSVP for ${event.eventTitle}

📅 ${new Date(event.eventDate).toLocaleDateString()}

RSVP here: ${inviteUrl}
    `.trim();
    
    const result = await client.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to: guest.phone,
    });
    
    console.log(`📱 Reminder SMS sent to ${guest.phone}`);
    
    return { success: true, messageId: result.sid };
    
  } catch (error) {
    console.error('Error sending reminder SMS:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendInvitationSMS,
  sendRSVPConfirmationSMS,
  sendReminderSMS,
};