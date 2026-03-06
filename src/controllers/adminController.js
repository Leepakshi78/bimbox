import User from "../models/userModel.js";
import { emailQueue } from "../queues/emailQueue.js";

// GET all users (admin only)
export const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.find().select("-password");
    return res.status(200).json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

// DELETE a user by id (admin only)
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    await User.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (err) {
    next(err);
  }
};

// CHANGE role (admin only)
export const changeRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // "user" or "admin"

    if (!role || !["user", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be 'user' or 'admin'",
      });
    }

    const updatedUser = await User.findByIdAndUpdate(id, { role }, { new: true }).select(
      "-password"
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    return res.status(200).json({
      success: true,
      message: "Role updated successfully",
      user: updatedUser,
    });
  } catch (err) {
    next(err);
  }
};

// UPDATE status (admin only)
export const updateUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params; // user id
    const { status, reason } = req.body;

    const allowed = ["Active", "Suspended", "Deactivated"];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be Active, Suspended, or Deactivated",
      });
    }

    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    user.status = status;

    if (status === "Suspended") {
      user.suspensionReason = (reason || "").trim();
    } else {
      user.suspensionReason = "";
    }

    user.statusUpdatedAt = new Date();
    user.statusUpdatedBy = req.user.id;

    await user.save();

    //bullmq job 
    //here we add a job to the queue ,this job will picked by the worker 
    //which will send email to the user when their role get changed by admin
    
    await emailQueue.add(
        "sendStatusEmail",
        {
          email: user.email,
          name: user.name, 
          status: user.status,
        },
        {
          attempts: 3,     // retry 3 times if email fails
          backoff: 5000,   // wait 5 seconds between retries
        }
      );

    return res.status(200).json({
      success: true,
      message: "User status updated successfully",
      user,
    });
  } catch (err) {
    next(err);
  }
};