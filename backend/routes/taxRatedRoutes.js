import express from "express";
import {
  createTaxRate,
  getAllTaxRates,
  getTaxRateById,
  updateTaxRate,
  deleteTaxRate,
} from "../controllers/taxRateController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Terapkan middleware 'protect' ke semua rute di bawah ini.
// Ini memastikan hanya pengguna yang sudah login yang bisa mengakses.
router.use(protect);

// Rute untuk mendapatkan semua tarif pajak dan membuat yang baru
router
  .route("/")
  .get(getAllTaxRates) // Semua pengguna yang login bisa melihat daftar tarif pajak
  .post(isAdmin, createTaxRate); // Hanya admin yang bisa membuat tarif pajak baru

// Rute untuk mendapatkan, memperbarui, dan menghapus satu tarif pajak berdasarkan ID
router
  .route("/:id")
  .get(getTaxRateById) // Semua pengguna yang login bisa melihat detail tarif pajak
  .put(isAdmin, updateTaxRate) // Hanya admin yang bisa memperbarui
  .delete(isAdmin, deleteTaxRate); // Hanya admin yang bisa menghapus

export default router;
