import jwt from "jsonwebtoken";

/**
 * Generate JWT token for a user
 * @param {string} userId - User ID from MongoDB
 * @returns {string} JWT token
 */
export const generateToken = (userId) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET environment variable is not set");
  }

  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

/**
 * Verify and decode JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 */
export const verifyToken = (token) => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET environment variable is not set");
    }

    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error(`Invalid token: ${error.message}`);
  }
};

/**
 * Extract token from Authorization header
 * @param {string} authHeader - Authorization header value
 * @returns {string|null} JWT token or null if not found
 */
export const extractTokenFromHeader = (authHeader) => {
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.substring(7);
};
