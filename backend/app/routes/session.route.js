import express from "express";

import { completeSession } from "../controllers/session.controller.js";
import authMiddleware from "../middleware/verifyToken.js";

const router = express.Router();

// POST /api/session/complete
router.post("/complete", authMiddleware, completeSession);

export default router;
