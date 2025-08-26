import express from "express";
import {
  createAccount,
  getAllAccounts,
  getAccountById,
  updateAccount,
  deleteAccount,
} from "../controllers/accountController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(protect);

router.route("/").get(getAllAccounts).post(isAdmin, createAccount);

router
  .route("/:id")
  .get(getAccountById)
  .put(isAdmin, updateAccount)
  .delete(isAdmin, deleteAccount);

export default router;
