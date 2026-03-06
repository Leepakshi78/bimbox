import { api } from "../services/api";

export const loginApi = (data) => api.post("/api/user/login", data);

export const verifyOtpApi = (data) => api.post("/api/user/verifyotp", data);

//  this route in backend
export const resendOtpApi = (data) => api.post("/api/user/resendotp", data);

export const forgotPasswordApi = (data) => api.post("/api/user/forgotpassword", data);

export const verifyResetOtpApi = (data) => api.post("/api/user/verifyresetotp", data);

export const resetPasswordApi = (data) => api.post("/api/user/resetpassword", data);