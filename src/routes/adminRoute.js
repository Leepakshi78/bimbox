import express from "express";
import authUser from "../middlewares/authUser.js";
import authorize from "../middlewares/authorize.js";

import {
  getAllUsers,
  deleteUser,
  changeRole,
  updateUserStatus,
} from "../controllers/adminController.js";

import { firstAdminResetPassword } from "../controllers/userController.js";

const router = express.Router();

// First login reset (uses resetToken, not authUser)
router.post("/first-reset-password", firstAdminResetPassword);

// Admin protected routes
router.get("/users", authUser, authorize("admin"), getAllUsers);
router.delete("/users/:id", authUser, authorize("admin"), deleteUser);
router.patch("/users/:id/role", authUser, authorize("admin"), changeRole);

// Update user status
router.patch("/users/:id/status", authUser, authorize("admin"), updateUserStatus);

export default router;