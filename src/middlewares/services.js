// src/middlewares/services.js

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import transporter from "../utils/mailer.js";
import AppError from "../utils/appError.js";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const OTP_TTL = 10 * 60 * 1000; // 10 minutes

// Block login/usage if user is Suspended or Deactivated
const assertUserIsActive = (user) => {
  // Debug: confirm current status at login time
  console.log("LOGIN STATUS CHECK:", user.email, "=>", user.status, user.suspensionReason);

  if (user.status === "Suspended") {
    const reason = user.suspensionReason?.trim();
    throw new AppError(
      reason
        ? `Account suspended. ${reason}. Contact admin.`
        : "Account suspended. Contact admin.",
      403
    );
  }

  if (user.status === "Deactivated") {
    throw new AppError("Account deactivated. Contact admin.", 403);
  }
};

/* REGISTER (send OTP for VERIFY) */
export const registerService = async ({ email, password }) => {
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new AppError("Email already registered", 409);

  const hashedPassword = await bcrypt.hash(password, 10);
  const otp = generateOtp();

  await User.create({
    email,
    password: hashedPassword,
    otp,
    otpExpiry: new Date(Date.now() + OTP_TTL),
    otpPurpose: "VERIFY",
    // status defaults to Active in model
  });

  const info = await transporter.sendMail({
    to: email,
    subject: "Verify your account",
    html: `<h3>Your OTP is ${otp}</h3>`,
  });

  logger.info(
    {
      accepted: info.accepted,
      rejected: info.rejected,
      messageId: info.messageId,
    },
    "Mail delivery result"
  );
};

/* VERIFY OTP (account verification) */
export const verifyOtpService = async ({ email, otp }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  if (user.otpPurpose !== "VERIFY") {
    throw new AppError("This OTP is not for account verification", 400);
  }

  if (user.otp !== String(otp)) throw new AppError("Invalid OTP", 400);
  if (user.otpExpiry < new Date()) throw new AppError("OTP expired", 400);

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpPurpose = undefined;
  await user.save();

  return { message: "Account verified successfully" };
};

// Resend OTP
export const resendOtpService = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + OTP_TTL);
  user.otpPurpose = "VERIFY";
  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "Resend OTP",
    text: `Your OTP is: ${otp}`,
  });

  logger.info(`VERIFY OTP resent to ${email}`);
  return { message: "OTP resent successfully" };
};

// Login
export const loginService = async ({ email, password }) => {
  const user = await User.findOne({ email });

  if (!user) throw new AppError("Invalid credentials", 401);

  if (!user.isVerified) {
    throw new AppError("Please verify your account first", 403);
  }

  // Block Suspended/Deactivated users from logging in
  assertUserIsActive(user);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError("Invalid credentials", 401);

  // First admin login: must reset password
  if (user.role === "admin" && user.mustChangePassword) {
    const resetToken = jwt.sign(
      { id: user._id, role: user.role, purpose: "FIRST_RESET" },
      process.env.JWT_SECRET,
      { expiresIn: "15m" }
    );

    return {
      mustChangePassword: true,
      resetToken,
      message: "First login detected. Please reset your password.",
    };
  }

  // Normal login token
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );

  return { token, mustChangePassword: false };
};

// Forgot password
export const forgotPasswordService = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  // Only verified users can reset
  if (!user.isVerified) throw new AppError("Please verify your account first", 403);

  const otp = generateOtp();
  user.otp = otp;
  user.otpExpiry = new Date(Date.now() + OTP_TTL);
  user.otpPurpose = "RESET";
  await user.save();

  await transporter.sendMail({
    to: email,
    subject: "Reset Password OTP",
    text: `Your OTP is: ${otp}`,
  });

  logger.info(`RESET OTP sent to ${email}`);
  return { message: "Reset OTP sent to email" };
};

// Verify reset OTP
export const verifyResetOtpService = async ({ email, otp }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  if (user.otpPurpose !== "RESET") {
    throw new AppError("This OTP is not for password reset", 400);
  }

  if (user.otp !== String(otp)) throw new AppError("Invalid OTP", 400);
  if (user.otpExpiry < new Date()) throw new AppError("OTP expired", 400);

  user.otp = undefined;
  user.otpExpiry = undefined;
  user.otpPurpose = undefined;
  await user.save();

  return { message: "OTP verified. You can now reset password." };
};

// Reset password
export const resetPasswordService = async ({ email, newPassword }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  logger.info(`Password reset done for ${email}`);
  return { message: "Password reset successful" };
};

// Sending email to every verified user
export const dailyEmail = async () => {
  const users = await User.find({ isVerified: true }, { email: 1 });

  if (!users.length) {
    throw new AppError("No verified users found to send daily emails", 404);
  }

  let sent = 0;
  const failed = [];

  for (const u of users) {
    if (!u.email) {
      failed.push({ email: null, reason: "Missing email" });
      continue;
    }

    try {
      await transporter.sendMail({
        to: u.email,
        subject: "Daily Update",
        html: `<h3>Hello</h3><p>This is your daily email.</p>`,
      });

      sent++;
    } catch (err) {
      logger.error({ message: err.message, email: u.email }, "Daily email failed");
      failed.push({ email: u.email, reason: err.message });
    }
  }

  return { sent, total: users.length, failedCount: failed.length, failed };
};

// When the admin logs in for the first time, they must change the password
export const firstAdminResetPasswordService = async ({ adminId, newPassword }) => {
  const user = await User.findById(adminId);
  if (!user) throw new AppError("User not found", 404);

  if (user.role !== "admin") throw new AppError("Forbidden", 403);

  if (!user.mustChangePassword) {
    throw new AppError("Password reset not required", 400);
  }

  user.password = await bcrypt.hash(newPassword, 10);
  user.mustChangePassword = false;

  await user.save();

  return { message: "Password reset successful. Please login again." };
};