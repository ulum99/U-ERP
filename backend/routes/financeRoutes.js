import express from "express";
import {
  createInvoiceFromSalesOrder,
  getAllInvoices,
  getInvoiceById,
  recordPaymentForInvoice,
  createBillFromPurchaseOrder,
  recordPaymentForBill,
  getAllBills,
  getBillById,
  // Impor fungsi lain jika ada, misal: voidInvoice
} from "../controllers/financeController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Terapkan middleware 'protect' ke semua rute di bawah ini.
// Ini memastikan hanya pengguna yang sudah login yang bisa mengakses.
router.use(protect);

// --- Rute untuk Faktur (Invoices) ---

// Rute untuk mendapatkan semua faktur dan membuat faktur baru
router
  .route("/invoices")
  .get(getAllInvoices) // Semua pengguna yang login bisa melihat daftar faktur
  .post(isAdmin, createInvoiceFromSalesOrder); // Hanya admin/manager yang bisa membuat faktur

// Rute untuk mendapatkan detail satu faktur
router.route("/invoices/:id").get(getInvoiceById); // Semua pengguna yang login bisa melihat detail faktur

// --- Rute untuk Pembayaran (Payments) ---

// Rute untuk mencatat pembayaran baru pada faktur tertentu
router.post("/invoices/:invoiceId/payments", isAdmin, recordPaymentForInvoice); // Hanya admin/manager yang bisa mencatat pembayaran

// --- Rute untuk Tagihan Pemasok (Bills / Utang) ---

// Membuat tagihan baru dari purchase order
router
  .route("/bills")
  .get(getAllBills) // <-- Tambahkan ini
  .post(isAdmin, createBillFromPurchaseOrder);

router
  .route("/bills/:id") // <-- Tambahkan ini
  .get(getBillById);

// Mencatat pembayaran keluar untuk tagihan tertentu
router.post("/bills/:billId/payments", isAdmin, recordPaymentForBill);

export default router;
