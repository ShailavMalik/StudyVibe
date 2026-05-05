/**
 * Email Service using Nodemailer
 *
 * Handles sending various types of notification emails to users
 * Supports: Study Reminders, Exam Alerts, Weekly Digest, Motivational Quotes
 *
 * @module services/emailService
 */

import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

/**
 * Configure and create email transporter
 * Uses Gmail SMTP or custom SMTP configuration
 */
const createTransporter = () => {
  const emailService = process.env.EMAIL_SERVICE || "gmail";

  if (emailService === "gmail" || !process.env.SMTP_HOST) {
    // Gmail configuration
    return nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  } else {
    // Custom SMTP configuration
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      family: 4,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }
};

/**
 * Verify email transporter configuration
 * Should be called on server startup
 */
export const verifyEmailConfig = async () => {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log("✅ Email service configured successfully");
    return true;
  } catch (error) {
    console.error("❌ Email configuration error:", error.message);
    console.log(
      "⚠️  Email notifications will not work. Please configure EMAIL_USER and EMAIL_PASSWORD in .env",
    );
    return false;
  }
};

/**
 * Generic email sending function
 * Sends an email with provided options
 *
 * @param {Object} mailOptions - Email configuration
 * @param {string} mailOptions.from - Sender email address
 * @param {string} mailOptions.to - Recipient email address
 * @param {string} mailOptions.subject - Email subject
 * @param {string} mailOptions.html - HTML email body
 * @returns {Promise<Object>} Nodemailer response
 * @throws {Error} If email sending fails
 */
export const sendEmail = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail(mailOptions);
    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    throw error;
  }
};

/**
 * Send Study Reminder Email
 * Notifies user about an upcoming study session
 */
export const sendStudyReminder = async (email, userData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "StudyVibe"} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "📚 Study Reminder - Time to Focus!",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📚 Study Reminder</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="color: #333; font-size: 16px;">Hi ${userData.displayName || userData.username},</p>
            
            <p style="color: #555; line-height: 1.6;">
              This is your reminder to start your scheduled study session! 
              You've set this time to maximize your learning potential.
            </p>
            
            <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; color: #667eea; font-weight: bold;">💡 Tip:</p>
              <p style="margin: 5px 0 0 0; color: #555;">
                Start with the most challenging subject first while your mind is fresh!
              </p>
            </div>
            
            <p style="color: #777; font-size: 14px; margin-top: 20px;">
              Keep up the great work! 💪
            </p>
          </div>
          
          <div style="background: #f0f0f0; padding: 15px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">StudyVibe - Your Personal Study Companion</p>
            <p style="margin: 5px 0 0 0;">
              <a href="#" style="color: #667eea; text-decoration: none;">Notification Preferences</a>
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Study reminder sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending study reminder: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Exam Alert Email
 * Notifies user about upcoming exams
 */
export const sendExamAlert = async (email, userData, examData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "StudyVibe"} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `📝 Exam Alert - ${examData.subject || "Upcoming Exam"}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 20px; border-radius: 8px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📝 Exam Alert</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="color: #333; font-size: 16px;">Hi ${userData.displayName || userData.username},</p>
            
            <p style="color: #555; line-height: 1.6;">
              You have an upcoming exam! It's time to start your focused preparation.
            </p>
            
            <div style="background: white; padding: 20px; border: 2px solid #f5576c; margin: 20px 0; border-radius: 4px;">
              <h3 style="margin: 0 0 10px 0; color: #f5576c;">📚 Exam Details</h3>
              <p style="margin: 5px 0; color: #555;"><strong>Subject:</strong> ${examData.subject || "N/A"}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Date:</strong> ${examData.date || "TBD"}</p>
              <p style="margin: 5px 0; color: #555;"><strong>Topics:</strong> ${examData.topics || "Check your dashboard"}</p>
            </div>
            
            <p style="color: #777; font-size: 14px; margin-top: 20px;">
              Use your StudyVibe schedule to plan your study sessions efficiently! 🚀
            </p>
          </div>
          
          <div style="background: #f0f0f0; padding: 15px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">StudyVibe - Your Personal Study Companion</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Exam alert sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending exam alert: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Weekly Digest Email
 * Sends a summary of study progress for the week
 */
export const sendWeeklyDigest = async (email, userData, digestData) => {
  try {
    const transporter = createTransporter();

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "StudyVibe"} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "📊 Your Weekly Study Digest",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">📊 Weekly Study Digest</h1>
          </div>
          
          <div style="padding: 30px; background: #f9f9f9;">
            <p style="color: #333; font-size: 16px;">Hi ${userData.displayName || userData.username},</p>
            
            <p style="color: #555; line-height: 1.6;">
              Here's a summary of your study progress this week!
            </p>
            
            <div style="background: white; padding: 20px; margin: 20px 0; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="margin: 0 0 15px 0; color: #667eea;">📈 This Week's Statistics</h3>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">
                  <p style="margin: 0; color: #667eea; font-weight: bold; font-size: 24px;">${digestData.totalHours || "N/A"}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Total Study Hours</p>
                </div>
                <div style="padding: 10px; background: #f0f4ff; border-radius: 4px;">
                  <p style="margin: 0; color: #667eea; font-weight: bold; font-size: 24px;">${digestData.sessionsCompleted || "N/A"}</p>
                  <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">Sessions Completed</p>
                </div>
              </div>
              <p style="margin: 15px 0 0 0; color: #555; line-height: 1.6;">
                <strong>Top Subject:</strong> ${digestData.topSubject || "N/A"}<br>
                <strong>Consistency Streak:</strong> ${digestData.streak || "N/A"} days 🔥
              </p>
            </div>
            
            <div style="background: #e8f5e9; padding: 15px; border-radius: 4px; border-left: 4px solid #4caf50;">
              <p style="margin: 0; color: #2e7d32; font-weight: bold;">🌟 Keep it up!</p>
              <p style="margin: 5px 0 0 0; color: #555; font-size: 14px;">
                You're making great progress. Maintain your study routine next week!
              </p>
            </div>
          </div>
          
          <div style="background: #f0f0f0; padding: 15px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">StudyVibe - Your Personal Study Companion</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Weekly digest sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending weekly digest: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send Motivational Quote Email
 * Sends daily inspiration to keep users motivated
 */
export const sendMotivationalQuote = async (email, userData, quoteData) => {
  try {
    const transporter = createTransporter();

    const quote =
      quoteData?.quote || "The secret of getting ahead is getting started.";
    const author = quoteData?.author || "Unknown";

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "StudyVibe"} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "💡 Daily Inspiration From StudyVibe",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #2563eb 0%, #7c3aed 100%); padding: 20px; border-radius: 8px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">💡 Daily Inspiration</h1>
          </div>
          
          <div style="padding: 40px; background: #f9f9f9; text-align: center;">
            <p style="color: #333; font-size: 16px; margin-bottom: 10px;">Hi ${userData.displayName || userData.username},</p>
            <p style="color: #555; line-height: 1.6; margin-bottom: 24px;">
              Here's a quick note for today. Save it, reflect on it, and let it set the tone for your next study session.
            </p>
            
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); margin: 20px 0;">
              <p style="margin: 0; color: #2563eb; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 15px; font-weight: bold;">Daily Inspiration</p>
              <p style="margin: 0; color: #333; font-size: 20px; font-style: italic; line-height: 1.6; margin-bottom: 15px;">
                "${quote}"
              </p>
              <p style="margin: 0; color: #999; font-size: 14px;">
                — ${author}
              </p>
            </div>
            
            <p style="color: #555; line-height: 1.6; margin-top: 20px;">
              One small focused session today is enough to move you forward. Keep going, one page at a time. 🚀
            </p>
          </div>
          
          <div style="background: #f0f0f0; padding: 15px; text-align: center; color: #999; font-size: 12px; border-radius: 0 0 8px 8px;">
            <p style="margin: 0;">StudyVibe - Your Personal Study Companion</p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Motivational quote sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending motivational quote: ${error.message}`);
    return { success: false, error: error.message };
  }
};

/**
 * Send test email to verify configuration
 */
export const sendTestEmail = async (email, userData = {}) => {
  try {
    const transporter = createTransporter();

    const welcomeQuote = "The secret of getting ahead is getting started.";
    const welcomeQuoteAuthor = "Mark Twain";
    const recipientName =
      userData.displayName || userData.username || "StudyVibe user";

    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "StudyVibe"} <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to StudyVibe - Your Account Is Now Connected",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #1d4ed8 0%, #6d28d9 100%); padding: 30px 24px; border-radius: 12px 12px 0 0; color: white; text-align: center;">
            <p style="margin: 0 0 10px 0; font-size: 14px; letter-spacing: 1.5px; text-transform: uppercase; opacity: 0.9;">Official StudyVibe Service Notice</p>
            <h1 style="margin: 0; font-size: 30px; line-height: 1.2;">Welcome to StudyVibe</h1>
          </div>
          
          <div style="padding: 32px; background: #f9fafb; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
            <p style="color: #111827; font-size: 18px; font-weight: 600; margin: 0 0 12px 0;">Dear ${recipientName},</p>
            
            <p style="color: #4b5563; line-height: 1.7; font-size: 15px; margin: 0 0 24px 0;">
              This email confirms that your StudyVibe account is now connected to our notification system.
              You will receive scheduled study reminders, exam alerts, weekly progress summaries, and daily inspiration.
            </p>

            <div style="background: white; padding: 24px; border-radius: 12px; border-left: 5px solid #2563eb; box-shadow: 0 8px 20px rgba(37,99,235,0.08); margin: 0 0 24px 0;">
              <p style="margin: 0 0 10px 0; color: #2563eb; font-size: 13px; font-weight: 700; letter-spacing: 1px; text-transform: uppercase;">Daily Inspiration</p>
              <p style="margin: 0 0 12px 0; color: #111827; font-size: 20px; font-style: italic; line-height: 1.6;">
                “${welcomeQuote}”
              </p>
              <p style="margin: 0; color: #6b7280; font-size: 14px;">— ${welcomeQuoteAuthor}</p>
            </div>
            
            <div style="background: #ecfdf5; padding: 20px; border-radius: 12px; border: 1px solid #a7f3d0;">
              <p style="margin: 0 0 10px 0; color: #065f46; font-weight: 700;">✨ What your service includes:</p>
              <ul style="margin: 0; color: #374151; padding-left: 20px; line-height: 1.7;">
                <li>📚 Study reminders before your scheduled sessions</li>
                <li>📝 Exam alerts for upcoming exams</li>
                <li>📊 Weekly digests of your study progress</li>
                <li>💡 Daily motivational quotes</li>
              </ul>
            </div>

            <p style="color: #6b7280; line-height: 1.7; font-size: 14px; margin: 24px 0 0 0;">
              If you need to update your notification preferences, you can do so at any time from your StudyVibe dashboard.
              Thank you for choosing StudyVibe.
            </p>
          </div>
        </div>
      `,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Test email sent to ${email}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error(`❌ Error sending test email: ${error.message}`);
    return { success: false, error: error.message };
  }
};
