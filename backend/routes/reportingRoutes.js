import express from "express";
import {
  getSalesSummary,
  getTopSellingProducts,
  getFinancialSnapshot,
  getLowStockProducts,
  getGeneralLedger,
  getTrialBalance,
  getProfitAndLoss,
  getBalanceSheet,
} from "../controllers/reportingController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Semua rute laporan memerlukan login
router.use(protect);

// Endpoint spesifik untuk laporan, beberapa mungkin hanya untuk admin/manager
router.get("/sales-summary", isAdmin, getSalesSummary);
router.get("/financial-snapshot", isAdmin, getFinancialSnapshot);

// Laporan ini bisa diakses oleh staf juga
router.get("/top-selling-products", getTopSellingProducts);
router.get("/low-stock-products", getLowStockProducts);

router.get("/general-ledger", isAdmin, getGeneralLedger);
router.get("/trial-balance", isAdmin, getTrialBalance);
// Endpoint untuk laporan Laba Rugi
router.get("/profit-and-loss", isAdmin, getProfitAndLoss);
// Endpoint untuk laporan Neraca
router.get("/balance-sheet", isAdmin, getBalanceSheet);

export default router;
