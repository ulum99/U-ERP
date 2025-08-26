import express from "express";
import {
  createSalesOrder,
  getAllSalesOrders,
  getSalesOrderById,
  updateSalesOrderStatus,
} from "../controllers/salesOrderController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Semua rute di bawah ini dilindungi dan memerlukan login
router.use(protect);

router.route("/").post(createSalesOrder).get(getAllSalesOrders);

router.route("/:id").get(getSalesOrderById);

router.put("/:id/status", updateSalesOrderStatus);

export default router;
