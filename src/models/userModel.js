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

  otp: { type: String },          // used for VERIFY or RESET
  otpExpiry: { type: Date },
  otpPurpose: {                   
    type: String,
    enum: ["VERIFY", "RESET"],
  },

  isVerified: {
    type: Boolean,
    default: false,
  },
});

const userModel = mongoose.model("User", userSchema);
export default userModel;
