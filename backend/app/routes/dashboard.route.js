import express from "express";
import {
  getDashboard,
  logStudySession,
  rebalanceSchedule,
} from "../controllers/dashboard.controller.js";
import authMiddleware from "../middleware/verifyToken.js";

const router = express.Router();

// GET /api/dashboard - Fetch dashboard data with streak
router.get("/", authMiddleware, getDashboard);

// POST /api/dashboard/log-session - Log completed study session for today
router.post("/log-session", authMiddleware, logStudySession);

// POST /api/dashboard/rebalance - Rebalance schedule for next day
router.post("/rebalance", authMiddleware, rebalanceSchedule);

export default router;
