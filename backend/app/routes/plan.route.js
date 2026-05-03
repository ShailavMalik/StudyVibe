import express from "express";
import {
  createAdaptivePlan,
  rebalance,
} from "../controllers/plan.controller.js";
import authMiddleware from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/plan/adaptive
router.post("/adaptive", authMiddleware, createAdaptivePlan);
router.post("/rebalance", authMiddleware, rebalance);

export default router;
