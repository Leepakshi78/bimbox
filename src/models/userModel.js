import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
  },
  password: {
    type: String,
    required: true,
  },

  // used for VERIFY or RESET
  otp: { type: String },
  otpExpiry: { type: Date },
  otpPurpose: {
    type: String,
    enum: ["VERIFY", "RESET"],
  },

  // IMPORTANT: used for password reset flow
  isResetOtpVerified: {
    type: Boolean,
    default: false,
  },

  isVerified: {
    type: Boolean,
    default: false,
  },

  // RBAC
  role: { type: String, enum: ["user", "admin"], default: "user" },
  mustChangePassword: { type: Boolean, default: false },

  // User Status Management
  status: {
    type: String,
    enum: ["Active", "Suspended", "Deactivated"],
    default: "Active",
  },
  suspensionReason: { type: String, default: "" },
  statusUpdatedAt: { type: Date },
  statusUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
});

const userModel = mongoose.model("User", userSchema);
export default userModel;