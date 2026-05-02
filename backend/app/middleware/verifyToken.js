import { verifyToken, extractTokenFromHeader } from "../utils/jwt.js";

/**
 * Middleware to verify JWT token
 * Extracts token from Authorization header and verifies it
 * Sets req.userId if token is valid
 */
export const authMiddleware = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      return res
        .status(401)
        .json({ error: "No token provided. Please log in." });
    }

    // Verify token and extract payload
    const decoded = verifyToken(token);
    req.userId = decoded.id;

    next();
  } catch (error) {
    console.error("Token verification error:", error);
    res
      .status(401)
      .json({ error: "Invalid or expired token. Please log in again." });
  }
};

/**
 * Optional auth middleware - doesn't require token but extracts userId if present
 */
export const optionalAuthMiddleware = (req, res, next) => {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const decoded = verifyToken(token);
      req.userId = decoded.id;
    }

    next();
  } catch (error) {
    // Ignore invalid token for optional auth
    next();
  }
};

// Default export for backward compatibility
export default authMiddleware;
