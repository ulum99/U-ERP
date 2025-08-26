import express from "express";
import {
  createCustomer,
  getAllCustomers,
  getCustomerById,
  updateCustomer,
  deleteCustomer,
} from "../controllers/customerController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Terapkan middleware 'protect' ke semua rute di bawah ini
router.use(protect);

router.route("/").post(createCustomer).get(getAllCustomers);

router
  .route("/:id")
  .get(getCustomerById)
  .put(updateCustomer)
  .delete(deleteCustomer);

export default router;
