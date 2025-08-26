import express from "express";
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/userController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Terapkan middleware 'protect' dan 'isAdmin' ke semua rute di bawah ini.
// Ini memastikan hanya pengguna dengan peran 'admin' yang sudah login yang bisa mengakses.
router.use(protect, isAdmin);

// Rute untuk mendapatkan semua pengguna dan membuat pengguna baru
router.route("/").get(getAllUsers).post(createUser);

// Rute untuk mendapatkan, memperbarui, dan menghapus satu pengguna berdasarkan ID
router.route("/:id").get(getUserById).put(updateUser).delete(deleteUser);

export default router;
