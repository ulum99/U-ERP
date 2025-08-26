import express from "express";
import {
  createSupplier,
  getAllSuppliers,
  getSupplierById,
  updateSupplier,
  deleteSupplier,
} from "../controllers/supplierController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Terapkan middleware 'protect' ke semua rute di bawah ini.
// Ini memastikan hanya pengguna yang sudah login yang bisa mengakses.
router.use(protect);

// Rute untuk mendapatkan semua pemasok dan membuat pemasok baru
router
  .route("/")
  .get(getAllSuppliers) // Semua pengguna yang login bisa melihat daftar pemasok
  .post(isAdmin, createSupplier); // Hanya admin yang bisa membuat pemasok baru

// Rute untuk mendapatkan, memperbarui, dan menghapus satu pemasok berdasarkan ID
router
  .route("/:id")
  .get(getSupplierById) // Semua pengguna yang login bisa melihat detail pemasok
  .put(isAdmin, updateSupplier) // Hanya admin yang bisa memperbarui
  .delete(isAdmin, deleteSupplier); // Hanya admin yang bisa menghapus

export default router;
