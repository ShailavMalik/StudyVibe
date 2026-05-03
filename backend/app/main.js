/**
 * StudyVibe Backend - Main Application Entry Point
 *
 * This is the main server file that sets up the Express application,
 * configures middleware, and defines routes for the StudyVibe platform.
 *
 * @author Shailav Malik
 * @version 1.0.0
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";

// Import route handlers
import authRoute from "./routes/auth.route.js";
import plannerRoute from "./routes/planner.route.js";
import timetableRoute from "./routes/timeTable.route.js";
import scheduleRoute from "./routes/schedule.route.js";
import sessionRoute from "./routes/session.route.js";
import dashboardRoute from "./routes/dashboard.route.js";
import adaptivePlanRoute from "./routes/adaptivePlan.route.js";
import planRoute from "./routes/plan.route.js";
import notificationRoute from "./routes/notification.route.js";
import blogRoute from "./routes/blog.route.js";
import contactRoute from "./routes/contact.route.js";

// Import middleware
import LoggingMiddleware from "./middleware/logging.js";

// Import services
import connectToMongoDB from "./db/connectToMongoDB.js";
import { verifyEmailConfig } from "./services/emailService.js";

// Load environment variables from .env file
dotenv.config();

// Initialize Express app
const app = express();

/**
 * CORS Configuration
 * Allows requests from any origin - useful during development
 * TODO: In production, restrict this to specific frontend domains
 */
const allowedOrigin = process.env.FRONTEND_URL || "*";

app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization", "Origin", "Accept"],
  }),
);

// Add request logging to track API calls
app.use(LoggingMiddleware);

// Body parser middleware - parses incoming JSON requests
app.use(express.json());

/**
 * File Upload Directory Setup
 * Creates the uploads/schedules directory if it doesn't exist
 * This is where schedule files will be stored when users upload them
 */
const uploadsDir = "./uploads/schedules";
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log(`Created uploads directory: ${uploadsDir}`);
}

/**
 * API Routes
 * All routes are prefixed with /api to keep the API organized
 */
app.use("/api/auth", authRoute); // Authentication endpoints (signup, login, etc.)
app.use("/api/planner", plannerRoute); // Study planner generation endpoints
app.use("/api/timetable", timetableRoute); // Timetable management endpoints
app.use("/api/schedule", scheduleRoute); // Schedule upload and parsing endpoints
app.use("/api/session", sessionRoute); // Session completion endpoint
app.use("/api/dashboard", dashboardRoute); // Dashboard progress endpoint
app.use("/api/adaptive-plan", adaptivePlanRoute); // Adaptive plan endpoint
app.use("/api/plan", planRoute); // Backwards-compatible plan endpoints
app.use("/api/notifications", notificationRoute); // Notification and email endpoints
app.use("/api/blogs", blogRoute); // Blog endpoints for exam prep articles
app.use("/api/contact", contactRoute); // Contact form email submission endpoint

/**
 * Root Endpoint
 * Returns basic API information - useful for checking if the server is up
 */
app.get("/", (req, res) => {
  res.json({
    message: "Welcome to StudyVibe API!",
    app_name: process.env.APP_NAME || "StudyVibe Backend",
    version: process.env.API_VERSION || "v1",
    status: "running",
    endpoints: {
      health: "/health",
      planner: "/api/planner",
      timetable: "/api/timetable",
      schedule: "/api/schedule",
      session: "/api/session",
      dashboard: "/api/dashboard",
      adaptivePlan: "/api/adaptive-plan",
    },
  });
});

/**
 * Health Check Endpoint
 * Used by monitoring services (like Render) to verify the service is running
 * Returns server uptime and current status
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime()), // Server uptime in seconds
    environment: process.env.NODE_ENV || "development",
  });
});

/**
 * Start the Express server
 * Listens on the port specified in .env or defaults to 3001
 */
const PORT = process.env.PORT || 3001;

// Start the Express server after MongoDB is connected
const startServer = async () => {
  await connectToMongoDB();

  // Verify email configuration
  const emailConfigured = await verifyEmailConfig();

  app.listen(PORT, () => {
    console.log(`🚀 Server started successfully!`);
    console.log(`📡 Listening on port ${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);

    if (process.env.NODE_ENV === "development") {
      console.log(`🔗 Local URL: http://localhost:${PORT}`);
    }

    if (emailConfigured) {
      console.log(`📧 Email notifications: ENABLED`);
    }
  });
};

startServer().catch((error) => {
  console.error("❌ Failed to start server:", error.message);
  process.exit(1);
});
