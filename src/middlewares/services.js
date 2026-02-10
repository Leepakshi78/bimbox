import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import logger from "../utils/logger.js";
import transporter from "../utils/mailer.js";
import AppError from "../utils/appError.js";

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));
const OTP_TTL = 10 * 60 * 1000; // 10 minutes

/*  REGISTER (send OTP for VERIFY)  */
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
  });

  const info=await transporter.sendMail({
    to: email,
    subject: "Verify your account",
    html: `<h3>Your OTP is ${otp}</h3>`,
  });

  logger.info({
  accepted: info.accepted,
  rejected: info.rejected,
  messageId: info.messageId
}, "Mail delivery result");
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

//resend otp
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

//login
export const loginService = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("Invalid credentials", 401);

  if (!user.isVerified) throw new AppError("Please verify your account first", 403);

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new AppError("Invalid credentials", 401);

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
  return { token };
};

//forgot password
export const forgotPasswordService = async ({ email }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  // optional security: only verified users can reset
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

//verify reset otp
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

//reset password
export const resetPasswordService = async ({ email, newPassword }) => {
  const user = await User.findOne({ email });
  if (!user) throw new AppError("User not found", 404);

  // Since we cleared OTP in verifyResetOtpService,
  // you should call resetPassword immediately after OTP 

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();

  logger.info(`Password reset done for ${email}`);
  return { message: "Password reset successful" };
};
