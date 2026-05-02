import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { generateToken } from "../utils/jwt.js";

/**
 * User Signup
 * POST /api/auth/signup
 */
export const signup = async (req, res) => {
  try {
    const { email, password, confirmPassword, displayName } = req.body;

    // Validation
    if (!email || !password || !confirmPassword) {
      return res
        .status(400)
        .json({ error: "Please fill in all required fields" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords do not match" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      displayName: displayName || email.split("@")[0],
    });

    await newUser.save();

    // Generate token
    const token = generateToken(newUser._id);

    // Return user data (without password)
    const userResponse = {
      id: newUser._id,
      email: newUser.email,
      displayName: newUser.displayName,
      avatar: newUser.avatar,
    };

    res.status(201).json({
      message: "User created successfully",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * User Login
 * POST /api/auth/login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide email and password" });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() }).select(
      "+password",
    );
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: "Account is deactivated" });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Update last login time
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    // Return user data (without password)
    const userResponse = {
      id: user._id,
      email: user.email,
      displayName: user.displayName,
      avatar: user.avatar,
    };

    res.json({
      message: "Login successful",
      user: userResponse,
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Get Current User
 * GET /api/auth/me
 * Requires authentication
 */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Logout
 * POST /api/auth/logout
 * Note: Logout is primarily handled on frontend by removing the token
 * This endpoint can be used for server-side cleanup if needed
 */
export const logout = async (req, res) => {
  try {
    // Token-based authentication doesn't require server-side logout
    // Frontend will simply remove the token from local storage
    res.json({ message: "Logout successful" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Update User Profile
 * PUT /api/auth/profile
 * Requires authentication
 */
export const updateProfile = async (req, res) => {
  try {
    const { displayName, avatar } = req.body;
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (displayName) user.displayName = displayName;
    if (avatar) user.avatar = avatar;

    await user.save();

    res.json({
      message: "Profile updated successfully",
      user: {
        id: user._id,
        email: user.email,
        displayName: user.displayName,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Change Password
 * POST /api/auth/change-password
 * Requires authentication
 */
export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ error: "Please fill in all fields" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "Password must be at least 6 characters" });
    }

    const user = await User.findById(req.userId).select("+password");

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({ error: error.message });
  }
};
