const nodemailer = require('nodemailer');

let transporter;

const initEmailService = async () => {
  try {
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      const isGmail = process.env.SMTP_HOST?.includes('gmail') || process.env.SMTP_USER?.includes('gmail.com');

      if (isGmail) {
        // Highly optimized Gmail transport configuration
        transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false // bypass potential local SSL cert issues
          }
        });
        console.log(`Email service initialized with optimized GMAIL engine: ${process.env.SMTP_USER}`);
      } else {
        // Generic custom SMTP configuration
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: process.env.SMTP_SECURE === 'true',
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
          tls: {
            rejectUnauthorized: false
          }
        });
        console.log(`Email service initialized with custom SMTP: ${process.env.SMTP_USER}`);
      }
    } else {
      // Generate test SMTP service account from ethereal.email
      let testAccount = await nodemailer.createTestAccount();

      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user, // generated ethereal user
          pass: testAccount.pass, // generated ethereal password
        },
      });
      console.log('Email service initialized with Ethereal Email (Local Testing fallback)');
    }
  } catch (error) {
    console.error('Failed to initialize email service:', error);
  }
};

// Initialize on startup
initEmailService();

const getSenderEmail = (senderName = 'CloudPro') => {
  if (process.env.SMTP_USER) {
    return `"${senderName}" <${process.env.SMTP_USER}>`;
  }
  return `"${senderName}" <noreply@cloudpro.com>`;
};

const sendWelcomeEmail = async (email, name) => {
  if (!transporter) return;

  try {
    const info = await transporter.sendMail({
      from: getSenderEmail('CloudPro Files'),
      to: email,
      subject: 'Welcome to CloudPro Storage! 🚀',
      text: `Hi ${name},\n\nWelcome to CloudPro Storage! Your premium cloud file sharing system is ready to use.\n\nEnjoy unlimited secure storage.`,
      html: `<b>Hi ${name},</b><br><br>Welcome to CloudPro Storage! Your premium cloud file sharing system is ready to use.<br><br>Enjoy unlimited secure storage!`,
    });

    console.log('Welcome email sent: %s', info.messageId);
    if (!process.env.SMTP_USER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending welcome email:', error);
  }
};

const sendShareNotification = async (fileOwner, filename, shareUrl, recipientEmail = null) => {
  if (!transporter) return;
  try {
    const isToRecipient = !!recipientEmail;
    const toEmail = recipientEmail || fileOwner.email;
    const subject = isToRecipient ? `${fileOwner.name} shared a file with you: ${filename}` : `Share Link Created: ${filename}`;
    
    const textBody = isToRecipient 
      ? `Hi,\n\n${fileOwner.name} has shared a file with you via CloudPro.\nFile: ${filename}\nLink: ${shareUrl}`
      : `Hi ${fileOwner.name},\n\nYou generated a new secure share link for ${filename}.\nLink: ${shareUrl}`;
      
    const htmlBody = isToRecipient
      ? `<b>Hi,</b><br><br><b>${fileOwner.name}</b> has securely shared a file with you via CloudPro.<br><b>File:</b> ${filename}<br><br><a href="${shareUrl}" style="display:inline-block;padding:10px 20px;background:#6366f1;color:white;text-decoration:none;border-radius:8px;">Download / View File</a>`
      : `<b>Hi ${fileOwner.name},</b><br><br>You generated a new secure share link for <b>${filename}</b>.<br><br><a href="${shareUrl}">View File</a>`;

    const info = await transporter.sendMail({
      from: getSenderEmail('CloudPro Files'),
      to: toEmail,
      subject: subject,
      text: textBody,
      html: htmlBody,
    });

    console.log(`Share notification sent to ${toEmail}: %s`, info.messageId);
    if (!process.env.SMTP_USER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending share notification:', error);
  }
};

const sendSupportTicketEmail = async (ticket) => {
  if (!transporter) return;
  try {
    // 1. Send confirmation to the user
    const info = await transporter.sendMail({
      from: getSenderEmail('CloudPro Support'),
      to: ticket.email,
      subject: `Support Ticket Received: ${ticket.subject} [#${ticket._id.toString().slice(-6).toUpperCase()}]`,
      text: `Hi ${ticket.name},\n\nWe have received your support request regarding "${ticket.subject}".\n\nTicket Type: ${ticket.type}\nStatus: ${ticket.status}\n\nOur backup and recovery engineering team is actively investigating your request to retrieve your data. We will keep you updated.\n\nBest regards,\nCloudPro Data Recovery Team`,
      html: `<b>Hi ${ticket.name},</b><br><br>We have received your support request regarding <b>"${ticket.subject}"</b>.<br><br><b>Ticket Details:</b><br>- <b>Ticket ID:</b> #${ticket._id.toString().slice(-6).toUpperCase()}<br>- <b>Request Type:</b> ${ticket.type}<br>- <b>Current Status:</b> ${ticket.status}<br><br>Our backup and recovery engineering team is actively investigating your request to retrieve your lost files/data. We will keep you updated.<br><br>Best regards,<br><b>CloudPro Data Recovery Team</b>`,
    });

    console.log('Support Ticket confirmation email sent: %s', info.messageId);
    if (!process.env.SMTP_USER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }

    // 2. Send notification alert to Admin
    const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'admin@cloudpro.com';
    if (adminEmail) {
      const adminInfo = await transporter.sendMail({
        from: getSenderEmail('CloudPro System'),
        to: adminEmail,
        subject: `[ACTION REQUIRED] New Support Ticket: ${ticket.subject} [#${ticket._id.toString().slice(-6).toUpperCase()}]`,
        text: `Admin Alert: A new support ticket has been submitted.\n\nUser: ${ticket.name} (${ticket.email})\nTicket ID: #${ticket._id.toString().slice(-6).toUpperCase()}\nType: ${ticket.type}\nSubject: ${ticket.subject}\nDescription: ${ticket.description}\n\nPlease check the admin dashboard to process this ticket.`,
        html: `<h2>New Support Ticket Received</h2><p><b>User:</b> ${ticket.name} (${ticket.email})</p><p><b>Ticket ID:</b> #${ticket._id.toString().slice(-6).toUpperCase()}</p><p><b>Type:</b> ${ticket.type}</p><p><b>Subject:</b> ${ticket.subject}</p><p><b>Description:</b><br>${ticket.description}</p><p>Please process this ticket.</p>`,
      });
      console.log('Support Ticket Admin Alert sent: %s', adminInfo.messageId);
    }
  } catch (error) {
    console.error('Error sending support ticket email:', error);
  }
};

const sendOtpEmail = async (email, name, otp) => {
  if (!transporter) return;
  try {
    const info = await transporter.sendMail({
      from: getSenderEmail('CloudPro Security'),
      to: email,
      subject: `Login Verification Code: ${otp} 🔑`,
      text: `Hi ${name},\n\nYour 6-digit login verification OTP is: ${otp}\n\nThis OTP is valid for 5 minutes. If you did not request this code, please secure your account immediately.\n\nBest regards,\nCloudPro Security Team`,
      html: `<b>Hi ${name},</b><br><br>Your 6-digit login verification OTP is:<br><br><span style="font-size: 24px; font-weight: bold; background-color: #f1f5f9; color: #4f46e5; padding: 10px 20px; border-radius: 8px; font-family: monospace; border: 1px solid #e2e8f0; letter-spacing: 4px;">${otp}</span><br><br>This OTP is valid for <b>5 minutes</b>. If you did not request this code, please secure your account immediately.<br><br>Best regards,<br><b>CloudPro Security Team</b>`,
    });

    console.log('OTP Verification email sent: %s', info.messageId);
    if (!process.env.SMTP_USER) {
      console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
    }
  } catch (error) {
    console.error('Error sending OTP email:', error);
  }
};

module.exports = { sendWelcomeEmail, sendShareNotification, sendSupportTicketEmail, sendOtpEmail };
