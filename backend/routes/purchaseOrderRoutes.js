import express from "express";
import {
  createPurchaseOrder,
  receivePurchaseOrder,
  getAllPurchaseOrders,
  getPurchaseOrderById,
} from "../controllers/purchaseOrderController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Semua rute di sini memerlukan login
router.use(protect);

// Hanya admin atau role tertentu yang boleh membuat dan menerima PO
router.route("/").post(isAdmin, createPurchaseOrder).get(getAllPurchaseOrders);

router.route("/:id").get(getPurchaseOrderById);

// Endpoint khusus untuk menandai PO sebagai diterima
router.post("/:id/receive", isAdmin, receivePurchaseOrder);

export default router;
