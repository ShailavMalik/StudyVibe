/**
 * @fileoverview Contact Routes
 * REST API endpoints for handling contact form submissions
 *
 * @module routes/contact.route
 * POST /api/contact - Submit contact form
 */

import express from "express";
import { submitContactForm } from "../controllers/contact.controller.js";

const router = express.Router();

/**
 * POST /api/contact
 * Submit a contact form message
 * Sends email to admin and thank you email to user
 *
 * Request body:
 * {
 *   "name": "string",
 *   "email": "string",
 *   "message": "string"
 * }
 *
 * Response:
 * {
 *   "success": true,
 *   "message": "Your message has been sent successfully..."
 * }
 */
router.post("/", submitContactForm);

export default router;
