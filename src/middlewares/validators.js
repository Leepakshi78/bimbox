import { body } from "express-validator";

export const registerValidation = [
  body("email")
    .isEmail()
    .withMessage("Please enter a valid email"),

  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters"),
];

export const loginValidation = [
  body("email").isEmail().withMessage("Invalid email"),
  body("password").notEmpty().withMessage("Password required"),
];

export const otpValidation = [
  body("email").isEmail().withMessage("Invalid email"),
  body("otp").notEmpty().withMessage("OTP required"),
];

export const emailOnlyValidation = [
  body("email").isEmail().withMessage("Invalid email"),
];

export const resetPasswordValidation = [
  body("email").isEmail(),
  body("newPassword").isLength({ min: 6 }),
];
