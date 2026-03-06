// middlewares/maintenanceGuard.js
import SystemConfig from "../models/systemConfigModel.js";

export const maintenanceGuard = async (req, res, next) => {
  try {
    const cfg = await SystemConfig.findOne({ key: "global" }).lean();

    // If config not created yet, assume maintenance is off
    if (!cfg || cfg.maintenanceMode === false) return next();

    // Allow login route during maintenance
    // (Admin can login; non-admin will be blocked inside login controller)
    if (req.originalUrl.startsWith("/api/user/login")) return next();

    // Optional: if you want these to work during maintenance, uncomment:
    // if (req.originalUrl.startsWith("/api/user/register")) return next();
    // if (req.originalUrl.startsWith("/api/user/verifyotp")) return next();
    // if (req.originalUrl.startsWith("/api/user/resendotp")) return next();
    // if (req.originalUrl.startsWith("/api/user/forgotpassword")) return next();
    // if (req.originalUrl.startsWith("/api/user/verifyresetotp")) return next();
    // if (req.originalUrl.startsWith("/api/user/resetpassword")) return next();

    // Allow only admin during maintenance (works if optionalAuth set req.user)
    if (String(req.user?.role || "").toLowerCase() === "admin") return next();

    return res.status(503).json({
      success: false,
      message: cfg.message || "System under maintenance. Please try later.",
    });
  } catch (err) {
    next(err);
  }
};