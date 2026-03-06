import mongoose from "mongoose";

const systemConfigSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true }, // use "global"
    maintenanceMode: { type: Boolean, default: false },
    message: {
      type: String,
      default: "System under maintenance. Please try later.",
    },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedAt: { type: Date },
  },
  { timestamps: true }
);

export default mongoose.model("SystemConfig", systemConfigSchema);