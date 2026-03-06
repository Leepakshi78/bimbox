import { body } from "express-validator";
// Register validation
export const registerValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .notEmpty().withMessage("Password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];

// Login validation
export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password")
    .notEmpty().withMessage("Password is required"),
];

// OTP validation (for verifyOtp)
export const otpValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];

// Forgot password (send reset OTP)
export const emailOnlyValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
];

// Verify reset OTP
export const verifyResetOtpValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
];

// Reset password (MUST include otp + newPassword)
export const resetPasswordValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("otp")
    .notEmpty().withMessage("OTP is required")
    .isLength({ min: 6, max: 6 }).withMessage("OTP must be 6 digits"),
  body("newPassword")
    .notEmpty().withMessage("New password is required")
    .isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
];