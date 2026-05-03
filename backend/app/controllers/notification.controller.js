/**
 * Notification Controller
 *
 * Handles email notification preferences and sending test emails
 *
 * @module controllers/notification.controller
 */

import User from "../models/User.js";
import {
  sendStudyReminder,
  sendExamAlert,
  sendWeeklyDigest,
  sendMotivationalQuote,
  sendTestEmail,
} from "../services/emailService.js";

/**
 * Save Notification Preferences
 * PUT /api/notifications/preferences
 * Requires authentication
 */
export const saveNotificationPreferences = async (req, res) => {
  try {
    const { notificationEmail, preferences } = req.body;
    const userId = req.userId;

    // Validate email
    if (notificationEmail && !notificationEmail.includes("@")) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    // Find and update user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Update notification email if provided
    if (notificationEmail) {
      user.notificationEmail = notificationEmail;
    }

    // Update preferences
    if (preferences) {
      user.notificationPreferences = {
        ...user.notificationPreferences,
        ...preferences,
      };
    }

    // Enable notifications if preferences are set
    if (preferences || notificationEmail) {
      user.notificationPreferences.enabled = true;
    }

    await user.save();

    res.json({
      message: "Notification preferences saved successfully",
      user: {
        id: user._id,
        notificationEmail: user.notificationEmail,
        notificationPreferences: user.notificationPreferences,
      },
    });
  } catch (error) {
    console.error("Save notification preferences error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Notification Preferences
 * GET /api/notifications/preferences
 * Requires authentication
 */
export const getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId, {
      notificationEmail: 1,
      notificationPreferences: 1,
      email: 1,
      displayName: 1,
      username: 1,
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      notificationEmail: user.notificationEmail || user.email,
      notificationPreferences: user.notificationPreferences,
      userName: user.displayName || user.username,
    });
  } catch (error) {
    console.error("Get notification preferences error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send Test Email
 * POST /api/notifications/test-email
 * Requires authentication
 */
export const sendTestNotification = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const emailToUse = user.notificationEmail || user.email;
    const userData = {
      displayName: user.displayName,
      username: user.username,
    };

    // Send test email
    const result = await sendTestEmail(emailToUse, userData);

    if (result.success) {
      res.json({
        message: "Test email sent successfully!",
        email: emailToUse,
        messageId: result.messageId,
      });
    } else {
      res.status(500).json({
        error: "Failed to send test email",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send test email error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send Study Reminder
 * POST /api/notifications/send/reminder
 * Requires authentication
 */
export const sendStudyReminderNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { subject } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enabled study reminders
    if (!user.notificationPreferences?.studyReminders) {
      return res.status(400).json({
        error: "Study reminders are disabled in preferences",
      });
    }

    const emailToUse = user.notificationEmail || user.email;

    const userData = {
      displayName: user.displayName,
      username: user.username,
    };

    const result = await sendStudyReminder(emailToUse, userData);

    if (result.success) {
      res.json({
        message: "Study reminder sent successfully!",
        email: emailToUse,
      });
    } else {
      res.status(500).json({
        error: "Failed to send reminder",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send study reminder error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send Exam Alert
 * POST /api/notifications/send/exam-alert
 * Requires authentication
 */
export const sendExamAlertNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { subject, date, topics } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enabled exam alerts
    if (!user.notificationPreferences?.examAlerts) {
      return res.status(400).json({
        error: "Exam alerts are disabled in preferences",
      });
    }

    const emailToUse = user.notificationEmail || user.email;

    const userData = {
      displayName: user.displayName,
      username: user.username,
    };

    const examData = {
      subject: subject || "Upcoming Exam",
      date: date || new Date().toLocaleDateString(),
      topics: topics || "Check your dashboard for details",
    };

    const result = await sendExamAlert(emailToUse, userData, examData);

    if (result.success) {
      res.json({
        message: "Exam alert sent successfully!",
        email: emailToUse,
      });
    } else {
      res.status(500).json({
        error: "Failed to send exam alert",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send exam alert error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send Weekly Digest
 * POST /api/notifications/send/weekly-digest
 * Requires authentication
 */
export const sendWeeklyDigestNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { totalHours, sessionsCompleted, topSubject, streak } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enabled weekly digest
    if (!user.notificationPreferences?.weeklyDigest) {
      return res.status(400).json({
        error: "Weekly digest is disabled in preferences",
      });
    }

    const emailToUse = user.notificationEmail || user.email;

    const userData = {
      displayName: user.displayName,
      username: user.username,
    };

    const digestData = {
      totalHours: totalHours || "N/A",
      sessionsCompleted: sessionsCompleted || "N/A",
      topSubject: topSubject || "N/A",
      streak: streak || 0,
    };

    const result = await sendWeeklyDigest(emailToUse, userData, digestData);

    if (result.success) {
      res.json({
        message: "Weekly digest sent successfully!",
        email: emailToUse,
      });
    } else {
      res.status(500).json({
        error: "Failed to send weekly digest",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send weekly digest error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Send Motivational Quote
 * POST /api/notifications/send/motivational-quote
 * Requires authentication
 */
export const sendMotivationalQuoteNotification = async (req, res) => {
  try {
    const userId = req.userId;
    const { quote, author } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if user has enabled motivational quotes
    if (!user.notificationPreferences?.motivationalQuotes) {
      return res.status(400).json({
        error: "Motivational quotes are disabled in preferences",
      });
    }

    const emailToUse = user.notificationEmail || user.email;

    const userData = {
      displayName: user.displayName,
      username: user.username,
    };

    const quoteData = {
      quote:
        quote || "The secret of getting ahead is getting started. - Mark Twain",
      author: author || "Unknown",
    };

    const result = await sendMotivationalQuote(emailToUse, userData, quoteData);

    if (result.success) {
      res.json({
        message: "Motivational quote sent successfully!",
        email: emailToUse,
      });
    } else {
      res.status(500).json({
        error: "Failed to send motivational quote",
        details: result.error,
      });
    }
  } catch (error) {
    console.error("Send motivational quote error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Disable Notifications
 * PUT /api/notifications/disable
 * Requires authentication
 */
export const disableNotifications = async (req, res) => {
  try {
    const userId = req.userId;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    user.notificationPreferences.enabled = false;
    await user.save();

    res.json({
      message: "Notifications disabled successfully",
      notificationPreferences: user.notificationPreferences,
    });
  } catch (error) {
    console.error("Disable notifications error:", error);
    res.status(500).json({ error: error.message });
  }
};
