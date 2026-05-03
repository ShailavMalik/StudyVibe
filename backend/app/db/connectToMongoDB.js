/**
 * MongoDB Connection Module
 *
 * Handles the connection to MongoDB database using Mongoose.
 * Uses connection string from environment variables for security.
 *
 * @module db/connectToMongoDB
 */

import mongoose from "mongoose";

/**
 * Establishes connection to MongoDB database
 *
 * @async
 * @function connectToMongoDB
 * @returns {Promise<void>} Resolves when connection is successful
 * @throws {Error} Logs error if connection fails but doesn't crash the app
 */
const connectToMongoDB = async () => {
  try {
    // Connect using the URI from environment variables
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000, // Increased from 10s to 30s
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      retryWrites: true,
      maxPoolSize: 10,
    });

    console.log("✅ MongoDB connected successfully");
    console.log(`📊 Database: ${mongoose.connection.name}`);
  } catch (error) {
    // Log error but don't crash - some features might work without DB
    console.error("❌ MongoDB connection failed:", error.message);
    console.log("⚠️  Some features may not work without database connection");
  }
};

export default connectToMongoDB;
