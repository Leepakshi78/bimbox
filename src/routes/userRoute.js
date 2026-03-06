import express from "express";

import {
  register,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  verifyResetOtp,
  resetPassword,
} from "../controllers/userController.js";

import {
  registerValidation,
  loginValidation,
  otpValidation,
  emailOnlyValidation,
  resetPasswordValidation,
} from "../middlewares/validators.js";

import { validate } from "../middlewares/validate.js";

import {
  otpEmailLimiter,
  otpIpLimiter,
  loginLimiter,
} from "../middlewares/rateLimit.js";

import authUser from "../middlewares/authUser.js";
import authorize from "../middlewares/authorize.js";
import { getProfile } from "../controllers/userController.js";
import { firstAdminResetPassword } from "../controllers/userController.js";


// FIRST ADMIN PASSWORD RESET




const userRouter = express.Router();

// admin test route 
userRouter.get("/admin/test", authUser, authorize("admin"), (req, res) => {
  res.json({ success: true, message: "Admin route working" });
});

/* Test route */
userRouter.get("/hello", (req, res) => res.send("Hello User"));

// Register → send OTP
userRouter.post(
  "/register",
  otpIpLimiter(),
  otpEmailLimiter(),
  registerValidation,
  validate,
  register
);

// Resend OTP
userRouter.post(
  "/resendotp",
  otpIpLimiter(),
  otpEmailLimiter(),
  emailOnlyValidation,
  validate,
  resendOtp
);

// Forgot password → send OTP
userRouter.post(
  "/forgotpassword",
  otpIpLimiter(),
  otpEmailLimiter(),
  emailOnlyValidation,
  validate,
  forgotPassword
);

// Verify OTP (registration)
userRouter.post("/verifyotp", otpValidation, validate, verifyOtp);

// Verify reset OTP
userRouter.post("/verifyresetotp", otpValidation, validate, verifyResetOtp);

// Reset password
userRouter.post("/resetpassword", resetPasswordValidation, validate, resetPassword);


// Login (rate limited)
userRouter.post("/login", loginLimiter(), loginValidation, validate, login);

// USER profile (logged-in)
userRouter.get("/profile", authUser, getProfile);

userRouter.post("/first-reset-password", firstAdminResetPassword);




export default userRouter;



//103.191.198.250     103.191.198.250