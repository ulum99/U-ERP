import express from "express";
import {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
} from "../controllers/productController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Rute ini bisa diakses semua user yang login
router.route("/").get(protect, getAllProducts);

router.route("/:id").get(protect, getProductById);

// Rute di bawah ini hanya bisa diakses oleh Admin
router.route("/").post(protect, isAdmin, createProduct);

router
  .route("/:id")
  .put(protect, isAdmin, updateProduct)
  .delete(protect, isAdmin, deleteProduct);

export default router;
