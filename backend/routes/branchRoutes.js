import express from "express";
import { getAllBranches } from "../controllers/branchController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getAllBranches);

export default router;
