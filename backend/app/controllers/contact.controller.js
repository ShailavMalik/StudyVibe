/**
 * @fileoverview Contact Controller
 * Handles contact form submissions and sends emails to admin and user
 * Manages customer inquiries through the contact form on the website
 *
 * @module controllers/contact.controller
 * @requires ../services/emailService - Email sending functionality
 */

import { sendEmail } from "../services/emailService.js";

/**
 * Handle contact form submission
 * Sends email to admin (shailavmalik684@gmail.com) with user details
 * Also sends thank you email to the user
 *
 * @param {Object} req - Express request object
 * @param {string} req.body.name - Sender's name
 * @param {string} req.body.email - Sender's email address
 * @param {string} req.body.message - Contact message from user
 * @param {Object} res - Express response object
 * @returns {Object} JSON response with success status
 */
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
      return res
        .status(400)
        .json({ error: "Name, email, and message are required" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email address" });
    }

    const adminEmail = process.env.EMAIL_USER || "shailavmalik684@gmail.com";

    // 1. Send email to admin with contact details
    const adminMailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "StudyVibe"} <${adminEmail}>`,
      to: adminEmail,
      subject: `📬 New Contact Form Submission from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">📬 New Contact Form Submission</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <h2 style="color: #333;">Sender Details</h2>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            <h2 style="color: #333;">Message</h2>
            <p style="background: white; padding: 15px; border-left: 4px solid #667eea; white-space: pre-wrap;">
              ${message}
            </p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">
              This message was sent from the StudyVibe Contact Form at ${new Date().toLocaleString()}
            </p>
          </div>
        </div>
      `,
    };

    // 2. Send thank you email to user
    const userMailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "StudyVibe"} <${adminEmail}>`,
      to: email,
      subject: "✅ We Received Your Message - StudyVibe Support",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">✅ Thank You, ${name}!</h1>
          </div>
          <div style="padding: 20px; background-color: #f9f9f9; border: 1px solid #ddd;">
            <p>Thank you for reaching out to StudyVibe!</p>
            <p>We have received your message and appreciate you taking the time to contact us.</p>
            <div style="background: white; padding: 15px; border-left: 4px solid #28a745; margin: 20px 0;">
              <strong>Your Message:</strong>
              <p style="white-space: pre-wrap; margin: 10px 0 0 0;">
                ${message}
              </p>
            </div>
            <p>Our team will review your inquiry and get back to you as soon as possible, typically within 24-48 hours.</p>
            <p>If you have any urgent matters, feel free to reach out directly.</p>
            <p>Best regards,<br><strong>The StudyVibe Team</strong></p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #666; font-size: 12px; text-align: center;">
              StudyVibe - Your Personal Study Companion
            </p>
          </div>
        </div>
      `,
    };

    // Send both emails in parallel
    await Promise.all([
      sendEmail(adminMailOptions),
      sendEmail(userMailOptions),
    ]);

    res.status(200).json({
      success: true,
      message:
        "Your message has been sent successfully. We will get back to you soon!",
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    res.status(500).json({
      error: error.message || "Failed to send message. Please try again later.",
    });
  }
};
