// src/socket/authSocket.js
import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

/**
 * Socket handshake auth middleware
 * Client must send token via:
 *   socket.auth = { token }
 * OR header: Authorization: Bearer <token>
 */
export const socketAuth = async (socket, next) => {
  try {
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.replace("Bearer ", "");

    if (!token) return next(new Error("No token provided"));

    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.id).lean();

    if (!user) return next(new Error("User not found"));

    // Block restricted users from connecting
    if (user.status === "Suspended" || user.status === "Deactivated") {
      return next(new Error("User restricted"));
    }

    socket.user = {
      id: String(user._id),
      role: user.role,
      email: user.email,
    };

    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
};