import { asyncHandler } from "../utils/asyncHandler.js";
import {
  registerService,
  verifyOtpService,
  resendOtpService,
  loginService,
  forgotPasswordService,
  verifyResetOtpService,
  resetPasswordService,
} from "../middlewares/services.js";

//REGISTER 
export const register = asyncHandler(async (req, res, next) => {
  try {
      const data = await registerService(req.body);
  res.status(201).json({ success: true, data,message:"User registered sucessfully." });
  } catch (error) {
    next(error)
  }

});

//VERIFY OTP
export const verifyOtp = asyncHandler(async (req, res) => {
  const data = await verifyOtpService(req.body);
  res.status(200).json({ success: true, ...data });
});

// RESEND OTP 
export const resendOtp = asyncHandler(async (req, res) => {
  const data = await resendOtpService(req.body);
  res.status(200).json({ success: true, ...data });
});

// LOGIN 
export const login = asyncHandler(async (req, res) => {
  const data = await loginService(req.body);
  res.status(200).json({ success: true, ...data });
});


export const forgotPassword = asyncHandler(async (req, res) => {
  const data = await forgotPasswordService(req.body);
  res.status(200).json({ success: true, ...data });
});

export const verifyResetOtp = asyncHandler(async (req, res) => {
  const data = await verifyResetOtpService(req.body);
  res.status(200).json({ success: true, ...data });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const data = await resetPasswordService(req.body);
  res.status(200).json({ success: true, ...data });
});



//add try..catch block at services 
//in controller do not write ...data,define it and add msg
//and during re registration of any user again incase of giving error msg give output as user email exists already 
//implement handlebars / pug ,read documentation 
//store data on redis
//make the logger a bit more responsive 
