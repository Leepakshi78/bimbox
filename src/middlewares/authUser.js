import jwt from "jsonwebtoken";
import User from "../models/userModel.js";

const authUser = async (req, res, next) => {
  try {
    // get token sent from frontend
    let token = req.headers.token;

    // support Bearer token
    if (!token && req.headers.authorization) {
      const [type, value] = req.headers.authorization.split(" ");
      if (type === "Bearer") token = value;
    }

    // block if token not provided
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please login.",
      });
    }

    // verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // fetch user from database to enforce status checks
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // block if user status is Suspended or Deactivated
    if (user.status === "Suspended") {
      const reason = user.suspensionReason?.trim();
      return res.status(403).json({
        success: false,
        message: reason
          ? `Account suspended: ${reason}. Contact admin.`
          : "Account suspended. Contact admin.",
      });
    }

    if (user.status === "Deactivated") {
      return res.status(403).json({
        success: false,
        message: "Account deactivated. Contact admin.",
      });
    }

    // attach user info to request
    req.user = {
      id: user._id.toString(),
      role: user.role,
      email: user.email,
    };

    next();
  } catch (error) {
    // runs if token is invalid or expired
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export default authUser;