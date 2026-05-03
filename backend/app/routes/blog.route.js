import express from "express";
import {
  getAllBlogs,
  getBlogById,
  toggleBlogLike,
  initializeBlogs,
} from "../controllers/blog.controller.js";
import { optionalAuthMiddleware } from "../middleware/verifyToken.js";

const router = express.Router();

// GET all blogs
router.get("/", getAllBlogs);

// GET blog by ID
router.get("/:id", getBlogById);

// POST like/unlike blog (requires authentication)
router.post("/:id/like", optionalAuthMiddleware, toggleBlogLike);

// POST initialize blogs (admin - no auth check for initial setup)
router.post("/init/seed", initializeBlogs);

export default router;
