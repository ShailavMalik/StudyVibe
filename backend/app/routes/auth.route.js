import express from "express";
import {
  signup,
  login,
  logout,
  getCurrentUser,
  updateProfile,
  changePassword,
} from "../controllers/auth.controller.js";
import { authMiddleware } from "../middleware/verifyToken.js";

const router = express.Router();

/**
 * Public routes - no authentication required
 */
router.post("/signup", signup);
router.post("/login", login);

/**
 * Protected routes - authentication required
 */
router.post("/logout", authMiddleware, logout);
router.get("/me", authMiddleware, getCurrentUser);
router.put("/profile", authMiddleware, updateProfile);
router.post("/change-password", authMiddleware, changePassword);

export default router;
