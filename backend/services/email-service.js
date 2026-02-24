// backend/services/email-service.js
const sgMail = require('@sendgrid/mail');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL;
const FROM_NAME = process.env.SENDGRID_FROM_NAME || 'Invites Events';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:19006';

// ========================================
// EMAIL TEMPLATES
// ========================================

/**
 * Generate invitation email HTML
 */
function generateInvitationEmail(event, guest, inviteUrl) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0; 
      padding: 0; 
      background-color: #FFF9F0; 
    }
    .container { max-width: 600px; margin: 0 auto; background: white; }
    .header { 
      background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%); 
      padding: 40px 20px; 
      text-align: center; 
    }
    .header h1 { color: white; margin: 0; font-size: 28px; font-weight: 800; }
    .design-image { width: 100%; height: auto; max-height: 300px; object-fit: cover; }
    .content { padding: 30px 20px; }
    .event-details { 
      background: #FFF9F0; 
      padding: 20px; 
      border-radius: 12px; 
      margin: 20px 0; 
      border-left: 4px solid #FF6B6B;
    }
    .detail-row { 
      display: flex; 
      margin: 12px 0; 
      align-items: flex-start;
    }
    .detail-icon { 
      font-size: 20px; 
      margin-right: 12px; 
      min-width: 24px;
    }
    .detail-text { flex: 1; }
    .detail-label { font-weight: 600; color: #666; font-size: 14px; }
    .detail-value { color: #333; font-size: 16px; margin-top: 4px; }
    .cta-button { 
      display: inline-block; 
      background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%); 
      color: white; 
      padding: 16px 40px; 
      text-decoration: none; 
      border-radius: 25px; 
      font-weight: 700;
      font-size: 16px;
      margin: 20px 0; 
      box-shadow: 0 4px 15px rgba(78, 205, 196, 0.3);
    }
    .cta-button:hover {
      background: linear-gradient(135deg, #44A08D 0%, #4ECDC4 100%);
    }
    .footer { 
      background: #F5F5F5; 
      padding: 20px; 
      text-align: center; 
      font-size: 12px; 
      color: #999; 
    }
    .footer a { color: #4ECDC4; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>You're Invited! 🎉</h1>
    </div>
    
    ${event.design?.customImageUrl ? `
      <img src="${FRONTEND_URL}${event.design.customImageUrl}" alt="Event Design" class="design-image">
    ` : ''}
    
    <div class="content">
      <p style="font-size: 18px; color: #333;">Hi ${guest.name || 'there'},</p>
      
      <p style="font-size: 16px; color: #666; line-height: 1.6;">
        You've been invited to <strong style="color: #FF6B6B;">${event.eventTitle}</strong>!
      </p>
      
      <div class="event-details">
        <div class="detail-row">
          <span class="detail-icon">📅</span>
          <div class="detail-text">
            <div class="detail-label">Date</div>
            <div class="detail-value">${new Date(event.eventDate).toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}</div>
          </div>
        </div>
        
        ${event.eventTime ? `
          <div class="detail-row">
            <span class="detail-icon">🕐</span>
            <div class="detail-text">
              <div class="detail-label">Time</div>
              <div class="detail-value">${event.eventTime}</div>
            </div>
          </div>
        ` : ''}
        
        ${event.location?.address ? `
          <div class="detail-row">
            <span class="detail-icon">📍</span>
            <div class="detail-text">
              <div class="detail-label">Location</div>
              <div class="detail-value">
                ${event.location.venueName ? event.location.venueName + '<br>' : ''}
                ${event.location.address}
              </div>
            </div>
          </div>
        ` : ''}
        
        ${event.eventDescription ? `
          <div class="detail-row">
            <span class="detail-icon">📝</span>
            <div class="detail-text">
              <div class="detail-label">Details</div>
              <div class="detail-value">${event.eventDescription}</div>
            </div>
          </div>
        ` : ''}
      </div>
      
      <center>
        <a href="${inviteUrl}" class="cta-button">
          RSVP Now
        </a>
      </center>
      
      ${event.registryType !== 'none' ? `
        <p style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
          🎁 Gift registry available after RSVP
        </p>
      ` : ''}
      
      <p style="color: #666; font-size: 14px; margin-top: 30px; line-height: 1.6;">
        We hope you can join us for this special celebration!
      </p>
    </div>
    
    <div class="footer">
      <p>Sent with Early Bird Events</p>
      <p><a href="${inviteUrl}">View Event Online</a></p>
      <p style="margin-top: 10px;">
        <a href="${FRONTEND_URL}/unsubscribe">Unsubscribe</a>
      </p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Generate RSVP confirmation email
 */
function generateRSVPConfirmationEmail(event, guest) {
  const eventDate = new Date(event.eventDate).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #FFF9F0; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; }
    .header { text-align: center; margin-bottom: 30px; }
    .checkmark { font-size: 64px; }
    h1 { color: #4ECDC4; margin: 20px 0; }
    .details { background: #FFF9F0; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .detail-item { margin: 10px 0; }
    .label { font-weight: 600; color: #666; }
    .value { color: #333; margin-top: 4px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="checkmark">✅</div>
      <h1>RSVP Confirmed!</h1>
    </div>
    
    <p>Hi ${guest.name},</p>
    
    <p>Thanks for confirming your attendance for <strong>${event.eventTitle}</strong>!</p>
    
    <div class="details">
      <div class="detail-item">
        <div class="label">Date</div>
        <div class="value">${eventDate}</div>
      </div>
      
      ${event.eventTime ? `
        <div class="detail-item">
          <div class="label">Time</div>
          <div class="value">${event.eventTime}</div>
        </div>
      ` : ''}
      
      ${event.location?.address ? `
        <div class="detail-item">
          <div class="label">Location</div>
          <div class="value">${event.location.venueName || ''} ${event.location.address}</div>
        </div>
      ` : ''}
      
      ${guest.plusOnes > 0 ? `
        <div class="detail-item">
          <div class="label">Plus Ones</div>
          <div class="value">${guest.plusOnes}</div>
        </div>
      ` : ''}
    </div>
    
    <p>Looking forward to seeing you there!</p>
    
    <p style="color: #999; font-size: 12px; margin-top: 30px;">
      Need to update your RSVP? <a href="${FRONTEND_URL}/events/${event._id}">Click here</a>
    </p>
  </div>
</body>
</html>
  `;
}

/**
 * Generate reminder email
 */
function generateReminderEmail(event, guest) {
  const inviteUrl = `${FRONTEND_URL}/events/${event.shareableSlug || event._id}`;
  
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; background: #FFF9F0; }
    .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 12px; }
    h2 { color: #FF6B6B; }
    .cta { 
      display: inline-block; 
      background: #FF6B6B; 
      color: white; 
      padding: 12px 30px; 
      text-decoration: none; 
      border-radius: 20px; 
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <h2>Don't forget to RSVP! ⏰</h2>
    <p>Hi ${guest.name},</p>
    <p>This is a friendly reminder to RSVP for <strong>${event.eventTitle}</strong>.</p>
    <p>📅 ${new Date(event.eventDate).toLocaleDateString()}</p>
    <p><a href="${inviteUrl}" class="cta">RSVP Now</a></p>
    <p>We'd love to know if you can make it!</p>
  </div>
</body>
</html>
  `;
}

// ========================================
// SEND FUNCTIONS
// ========================================

/**
 * Send invitation email
 */
async function sendInvitationEmail(event, guest) {
  try {
    const inviteUrl = `${FRONTEND_URL}/invite/${event.shareableSlug || event._id}`;
    
    const msg = {
      to: guest.email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `You're invited to ${event.eventTitle}! 🎉`,
      html: generateInvitationEmail(event, guest, inviteUrl),
    };
    
    await sgMail.send(msg);
    console.log(`📧 Invitation email sent to ${guest.email}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error sending invitation email:', error.response?.body || error);
    return { success: false, error: error.message };
  }
}

/**
 * Send RSVP confirmation email
 */
async function sendRSVPConfirmation(event, guest) {
  try {
    const msg = {
      to: guest.email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `RSVP Confirmed: ${event.eventTitle}`,
      html: generateRSVPConfirmationEmail(event, guest),
    };
    
    await sgMail.send(msg);
    console.log(`📧 RSVP confirmation sent to ${guest.email}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error sending RSVP confirmation:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Send reminder email
 */
async function sendReminderEmail(event, guest) {
  try {
    const msg = {
      to: guest.email,
      from: {
        email: FROM_EMAIL,
        name: FROM_NAME,
      },
      subject: `Reminder: RSVP for ${event.eventTitle}`,
      html: generateReminderEmail(event, guest),
    };
    
    await sgMail.send(msg);
    console.log(`📧 Reminder email sent to ${guest.email}`);
    
    return { success: true };
    
  } catch (error) {
    console.error('Error sending reminder:', error);
    return { success: false, error: error.message };
  }
}

module.exports = {
  sendInvitationEmail,
  sendRSVPConfirmation,
  sendReminderEmail,
};