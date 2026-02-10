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

const userRouter = express.Router();

userRouter.get("/hello", (req, res) => res.send("Hello User"));

userRouter.post("/register", registerValidation, validate, register);
userRouter.post("/verifyotp", otpValidation, validate, verifyOtp);
userRouter.post("/resendotp", emailOnlyValidation, validate, resendOtp);

userRouter.post("/login", loginValidation, validate, login);

userRouter.post("/forgotpassword", emailOnlyValidation, validate, forgotPassword);
userRouter.post("/verifyresetotp", otpValidation, validate, verifyResetOtp);
userRouter.post("/resetpassword", resetPasswordValidation, validate, resetPassword);

export default userRouter;
