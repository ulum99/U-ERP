import express from "express";
import {
  adjustStock,
  getProductLedger,
} from "../controllers/inventoryController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Semua rute di sini memerlukan login
router.use(protect);

// Hanya admin/manager yang boleh melakukan penyesuaian stok
router.post("/adjust", isAdmin, adjustStock);

// Semua user yang login boleh melihat riwayat stok
router.get("/ledger/:productId", getProductLedger);

export default router;
