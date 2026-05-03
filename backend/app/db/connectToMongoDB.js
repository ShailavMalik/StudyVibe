/**
 * MongoDB Connection Module
 *
 * Handles the connection to MongoDB database using Mongoose.
 * Uses connection string from environment variables for security.
 *
 * @module db/connectToMongoDB
 */

import mongoose from "mongoose";
import dns from "dns";

/**
 * Establishes connection to MongoDB database
 *
 * @async
 * @function connectToMongoDB
 * @returns {Promise<void>} Resolves when successful
 * @throws {Error} Logs error if connection fails but doesn't crash the app
 */
const connectToMongoDB = async () => {
  try {
    // Use Google's public DNS to resolve MongoDB SRV records
    // Fixes "querySrv ECONNREFUSED" errors on corporate/restricted networks
    dns.setServers(["8.8.8.8", "8.8.4.4"]);

    if (!process.env.MONGODB_URI) {
      throw new Error("MONGODB_URI is not configured");
    }

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
    console.error("❌ MongoDB connection failed:", error.message);
    throw error;
  }
};

export default connectToMongoDB;
