import express from "express";
import {
  getSettings,
  updateSettings,
} from "../controllers/settingController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect, isAdmin);

router.route("/").get(getSettings).put(updateSettings);

export default router;
