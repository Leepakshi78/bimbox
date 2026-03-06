import express from "express";
import authUser from "../middlewares/authUser.js";
import authorize from "../middlewares/authorize.js";

// Import BOTH controller functions
import {
  getMaintenance,
  setMaintenanceMode,
} from "../controllers/systemController.js";

const router = express.Router();

/*
  GET  /api/system/maintenance
  → Returns current maintenance status
  → Admin only
*/
router.get(
  "/maintenance",
  authUser,
  authorize("admin"),
  getMaintenance
);

/*
  PATCH /api/system/maintenance
  → Body: { enabled: true/false, message?: string }
  → Updates maintenance status
  → Admin only
*/
router.patch(
  "/maintenance",
  authUser,
  authorize("admin"),
  setMaintenanceMode
);

export default router;