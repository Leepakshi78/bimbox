// controllers/userController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import AppError from "../utils/appError.js";
import User from "../models/userModel.js";
import SystemConfig from "../models/systemConfigModel.js"; // ADDED
import { firstAdminResetPasswordService } from "../middlewares/services.js";

import { asyncHandler } from "../utils/asyncHandler.js";
import {
  ensureNotLocked,
  recordFailedLogin,
  clearLoginFailures,
} from "../utils/loginSecurity.js";

import {
  registerService,
  verifyOtpService,
  resendOtpService,
  forgotPasswordService,
  verifyResetOtpService,
  resetPasswordService,
} from "../middlewares/services.js";

// Block login if user is Suspended or Deactivated
const assertUserIsActive = (user) => {
  if (user.status === "Suspended") {
    const reason = user.suspensionReason ? String(user.suspensionReason).trim() : "";
    throw new AppError(
      reason
        ? `Account suspended: ${reason}. Contact admin.`
        : "Account suspended. Contact admin.",
      403
    );
  }

  if (user.status === "Deactivated") {
    throw new AppError("Account deactivated. Contact admin.", 403);
  }
};

// REGISTER
export const register = asyncHandler(async (req, res, next) => {
  try {
    await registerService(req.body);
    return res
      .status(201)
      .json({ success: true, message: "User registered successfully." });
  } catch (error) {
    next(error);
  }
});

// VERIFY OTP (ACCOUNT VERIFY)
export const verifyOtp = asyncHandler(async (req, res, next) => {
  try {
    await verifyOtpService(req.body);
    return res.status(200).json({ success: true, message: "OTP verified!" });
  } catch (error) {
    next(error);
  }
});

// RESEND OTP (ACCOUNT VERIFY)
export const resendOtp = asyncHandler(async (req, res, next) => {
  try {
    await resendOtpService(req.body);
    return res
      .status(200)
      .json({ success: true, message: "OTP resent successfully." });
  } catch (error) {
    next(error);
  }
});

// LOGIN
export const login = asyncHandler(async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        success: false,
        message: "Please verify your account first",
      });
    }

    assertUserIsActive(user);

    // Lock / rate limit per user (your logic)
    await ensureNotLocked(user._id.toString());

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      await recordFailedLogin(user._id.toString());
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    // Correct password -> clear failure count
    await clearLoginFailures(user._id.toString());

    // MAINTENANCE CHECK (ADDED)
    // Only admin can login during maintenance mode
    const cfg = await SystemConfig.findOne({ key: "global" }).lean();
    const maintenanceOn = Boolean(cfg?.maintenanceMode);

    if (maintenanceOn && String(user.role).toLowerCase() !== "admin") {
      return res.status(503).json({
        success: false,
        message: cfg?.message || "System under maintenance. Please try later.",
      });
    }

    // Admin first-time reset flow (keep as-is)
    if (user.role === "admin" && user.mustChangePassword) {
      const resetToken = jwt.sign(
        { id: user._id, role: user.role, purpose: "FIRST_RESET" },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      return res.status(200).json({
        success: true,
        mustChangePassword: true,
        resetToken,
        message: "First login detected. Please reset your password.",
      });
    }

    // Normal login token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      success: true,
      message: "Logged in Successfully.",
      mustChangePassword: false,
      token,
    });
  } catch (error) {
    next(error);
  }
});

// FORGOT PASSWORD (SEND RESET OTP)
export const forgotPassword = asyncHandler(async (req, res, next) => {
  try {
    await forgotPasswordService(req.body);
    return res.status(200).json({
      success: true,
      message: "OTP sent to your registered mail id",
    });
  } catch (error) {
    next(error);
  }
});

// VERIFY RESET OTP (OPTIONAL STEP)
export const verifyResetOtp = asyncHandler(async (req, res, next) => {
  try {
    await verifyResetOtpService(req.body);
    return res.status(200).json({
      success: true,
      message: "Account verified, now you can reset the password.",
    });
  } catch (error) {
    next(error);
  }
});

// RESET PASSWORD (FIXED TO MATCH userModel.js fields)
export const resetPassword = asyncHandler(async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) throw new AppError("User not found", 404);

    // must be reset OTP stored in otp fields
    if (user.otpPurpose !== "RESET")
      throw new AppError("OTP not verified. Please verify first.", 400);
    if (!user.otp || user.otp !== String(otp))
      throw new AppError("Invalid OTP", 400);
    if (!user.otpExpiry || new Date(user.otpExpiry).getTime() < Date.now())
      throw new AppError("OTP expired", 400);

    user.password = await bcrypt.hash(newPassword, 10);

    // clear otp fields
    user.otp = undefined;
    user.otpExpiry = undefined;
    user.otpPurpose = undefined;

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password updated successfully!",
    });
  } catch (err) {
    next(err);
  }
});

// getProfile
export const getProfile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

export const firstAdminResetPassword = async (req, res, next) => {
  try {
    const auth = req.headers.authorization;

    if (!auth || !auth.startsWith("Bearer ")) {
      throw new AppError("Missing reset token", 401);
    }

    const resetToken = auth.split(" ")[1];
    const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);

    if (decoded.purpose !== "FIRST_RESET") {
      throw new AppError("Invalid reset token", 401);
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters", 400);
    }

    const result = await firstAdminResetPasswordService({
      adminId: decoded.id,
      newPassword,
    });

    res.status(200).json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};