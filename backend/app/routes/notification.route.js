/**
 * Notification Routes
 *
 * Handles all notification-related API endpoints
 * Includes: preferences, test emails, and various notification types
 *
 * @module routes/notification.route
 */

import express from "express";
import {
  saveNotificationPreferences,
  getNotificationPreferences,
  sendTestNotification,
  sendStudyReminderNotification,
  sendExamAlertNotification,
  sendWeeklyDigestNotification,
  sendMotivationalQuoteNotification,
  disableNotifications,
} from "../controllers/notification.controller.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

/**
 * All notification routes require authentication
 */
router.use(verifyToken);

/**
 * Save/Update notification preferences
 * PUT /api/notifications/preferences
 */
router.put("/preferences", saveNotificationPreferences);

/**
 * Get user's notification preferences
 * GET /api/notifications/preferences
 */
router.get("/preferences", getNotificationPreferences);

/**
 * Send test email to verify configuration
 * POST /api/notifications/test-email
 */
router.post("/test-email", sendTestNotification);

/**
 * Send study reminder email
 * POST /api/notifications/send/reminder
 */
router.post("/send/reminder", sendStudyReminderNotification);

/**
 * Send exam alert email
 * POST /api/notifications/send/exam-alert
 */
router.post("/send/exam-alert", sendExamAlertNotification);

/**
 * Send weekly digest email
 * POST /api/notifications/send/weekly-digest
 */
router.post("/send/weekly-digest", sendWeeklyDigestNotification);

/**
 * Send motivational quote email
 * POST /api/notifications/send/motivational-quote
 */
router.post("/send/motivational-quote", sendMotivationalQuoteNotification);

/**
 * Disable all notifications
 * PUT /api/notifications/disable
 */
router.put("/disable", disableNotifications);

export default router;
