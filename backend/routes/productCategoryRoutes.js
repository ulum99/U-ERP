import express from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/productCategoryController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Terapkan middleware 'protect' ke semua rute di bawah ini.
// Ini memastikan hanya pengguna yang sudah login yang bisa mengakses.
router.use(protect);

// Rute untuk mendapatkan semua kategori dan membuat kategori baru
router
  .route("/")
  .get(getAllCategories) // Semua pengguna yang login bisa melihat daftar kategori
  .post(isAdmin, createCategory); // Hanya admin yang bisa membuat kategori baru

// Rute untuk mendapatkan, memperbarui, dan menghapus satu kategori berdasarkan ID
router
  .route("/:id")
  .get(getCategoryById) // Semua pengguna yang login bisa melihat detail kategori
  .put(isAdmin, updateCategory) // Hanya admin yang bisa memperbarui
  .delete(isAdmin, deleteCategory); // Hanya admin yang bisa menghapus

export default router;
