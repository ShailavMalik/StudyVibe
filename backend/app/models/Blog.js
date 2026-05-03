/**
 * @fileoverview Blog Model Schema
 *
 * Mongoose schema for storing blog posts about exam preparation and study techniques.
 * Includes support for tracking likes per user to prevent duplicate likes.
 *
 * Features:
 * - Blog metadata (title, author, date, category, tags)
 * - Content storage (excerpt and full HTML content)
 * - Like tracking with user references
 * - Automatic timestamps for creation/modification
 *
 * Fields:
 * - id: Unique numeric identifier
 * - title: Blog post title
 * - author: Author name
 * - date: Publication date
 * - readTime: Estimated reading time
 * - category: Blog category (Study Tips, Exam Tips, etc.)
 * - excerpt: Short summary for preview
 * - image: Featured image URL
 * - content: Full HTML content
 * - tags: Array of topic tags
 * - likes: Count of total likes
 * - likedBy: Array of user IDs who liked the post
 *
 * @module models/Blog
 * @requires mongoose
 */

import mongoose from "mongoose";

const blogSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      unique: true,
    },
    title: {
      type: String,
      required: true,
    },
    author: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
    },
    readTime: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    excerpt: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    tags: [String],
    likes: {
      type: Number,
      default: 0,
    },
    likedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { timestamps: true },
);

export default mongoose.model("Blog", blogSchema);
