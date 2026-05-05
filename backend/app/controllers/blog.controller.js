import mongoose from "mongoose";
import Blog from "../models/Blog.js";

const findBlogByIdParam = async (blogId) => {
  if (mongoose.isValidObjectId(blogId)) {
    const blogByObjectId = await Blog.findById(blogId);
    if (blogByObjectId) {
      return blogByObjectId;
    }
  }

  const numericId = Number(blogId);
  if (!Number.isNaN(numericId)) {
    return Blog.findOne({ id: numericId });
  }

  return null;
};

/**
 * Get all blogs
 */
export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.status(200).json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get blog by ID
 */
export const getBlogById = async (req, res) => {
  try {
    const blog = await findBlogByIdParam(req.params.id);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }
    res.status(200).json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Like/Unlike a blog
 */
export const toggleBlogLike = async (req, res) => {
  try {
    const userId = req.userId;
    const blogId = req.params.id;

    if (!userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const blog = await findBlogByIdParam(blogId);
    if (!blog) {
      return res.status(404).json({ error: "Blog not found" });
    }

    // Check if user already liked this blog
    const userIndex = blog.likedBy.findIndex((id) => id.toString() === userId);

    if (userIndex > -1) {
      // Unlike: remove user from likedBy array
      blog.likedBy.splice(userIndex, 1);
      blog.likes = Math.max(0, blog.likes - 1);
    } else {
      // Like: add user to likedBy array
      blog.likedBy.push(userId);
      blog.likes += 1;
    }

    await blog.save();
    res.status(200).json({ likes: blog.likes, liked: userIndex === -1 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/**
 * Initialize blogs from data (admin function)
 */
export const initializeBlogs = async (req, res) => {
  try {
    const blogsData = req.body.blogs;

    // Clear existing blogs
    await Blog.deleteMany({});

    // Insert new blogs
    const blogs = await Blog.insertMany(blogsData);
    res.status(201).json({
      message: "Blogs initialized successfully",
      count: blogs.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
