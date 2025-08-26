import express from "express";
import {
  createUnitOfMeasure,
  getAllUnitOfMeasures,
  getUnitOfMeasureById,
  updateUnitOfMeasure,
  deleteUnitOfMeasure,
} from "../controllers/unitOfMeasureController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Terapkan middleware 'protect' ke semua rute di bawah ini.
router.use(protect);

// Rute untuk mendapatkan semua satuan dan membuat satuan baru
router
  .route("/")
  .get(getAllUnitOfMeasures) // Semua pengguna yang login bisa melihat daftar satuan
  .post(isAdmin, createUnitOfMeasure); // Hanya admin yang bisa membuat satuan baru

// Rute untuk mendapatkan, memperbarui, dan menghapus satu satuan berdasarkan ID
router
  .route("/:id")
  .get(getUnitOfMeasureById) // Semua pengguna yang login bisa melihat detail satuan
  .put(isAdmin, updateUnitOfMeasure) // Hanya admin yang bisa memperbarui
  .delete(isAdmin, deleteUnitOfMeasure); // Hanya admin yang bisa menghapus

export default router;
