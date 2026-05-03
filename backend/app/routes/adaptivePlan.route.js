import express from "express";

import { generateAdaptivePlanController } from "../controllers/adaptivePlan.controller.js";
import authMiddleware from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/adaptive-plan
router.post("/", authMiddleware, generateAdaptivePlanController);

export default router;
