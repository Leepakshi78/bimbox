import SystemConfig from "../models/systemConfigModel.js";

// GET current maintenance mode (admin only route will protect it)
export const getMaintenance = async (req, res, next) => {
  try {
    const cfg = await SystemConfig.findOne({ key: "global" }).lean();

    // If not set yet in DB, default false
    const maintenanceMode = cfg?.maintenanceMode ?? false;
    const message =
      cfg?.message?.trim() || "System under maintenance. Please try later.";

    return res.status(200).json({
      success: true,

      //  frontend-friendly flag
      enabled: Boolean(maintenanceMode),

      //  keep your existing structure also
      data: {
        maintenanceMode: Boolean(maintenanceMode),
        message,
      },
    });
  } catch (err) {
    next(err);
  }
};

// PATCH toggle maintenance mode (admin only)
export const setMaintenanceMode = async (req, res, next) => {
  try {
    const { enabled, message } = req.body;

    const cfg = await SystemConfig.findOneAndUpdate(
      { key: "global" },
      {
        $set: {
          maintenanceMode: Boolean(enabled),
          message:
            message?.trim() ||
            "System under maintenance. Please try later.",
          updatedBy: req.user.id,
          updatedAt: new Date(),
        },
      },
      { new: true, upsert: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: `Maintenance mode ${cfg.maintenanceMode ? "enabled" : "disabled"}`,

      //  frontend-friendly
      enabled: Boolean(cfg.maintenanceMode),

      data: {
        maintenanceMode: Boolean(cfg.maintenanceMode),
        message: cfg.message,
      },
    });
  } catch (err) {
    next(err);
  }
};