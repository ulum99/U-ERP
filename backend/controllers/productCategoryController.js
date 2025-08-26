import db from "../models/index.js";
import { Op } from "sequelize";
const { ProductCategory, Product } = db;

/**
 * Fungsi helper untuk memvalidasi header X-Branch-ID dan hak akses pengguna.
 * @param {object} req - Objek request dari Express.
 * @returns {number} ID cabang yang valid.
 * @throws {Error} Melempar error jika header tidak ada atau pengguna tidak memiliki akses.
 */
const getValidBranchId = (req) => {
  const branchId = req.headers["x-branch-id"];
  if (!branchId) {
    throw new Error("Header X-Branch-ID diperlukan untuk request ini.");
  }
  // --- LOGIKA BARU ---
  // Jika user adalah superuser (dari token JWT), lewati pengecekan akses cabang
  if (req.user.isSuperUser) {
    return parseInt(branchId, 10);
  }
  // -------------------
  const userBranches = req.user.branches || [];
  if (!userBranches.includes(parseInt(branchId, 10))) {
    throw new Error("Akses ke data cabang ini ditolak.");
  }
  return parseInt(branchId, 10);
};

// --- FUNGSI-FUNGSI CRUD ---

/**
 * @desc    Membuat Kategori Produk baru
 * @route   POST /api/product-categories
 * @access  Private (Admin)
 */
export const createCategory = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nama kategori wajib diisi." });
    }

    const existingCategory = await ProductCategory.findOne({
      where: { name, branchId },
    });
    if (existingCategory) {
      return res
        .status(400)
        .json({ message: `Kategori dengan nama '${name}' sudah ada.` });
    }

    const newCategory = await ProductCategory.create({
      name,
      description,
      branchId,
    });
    res.status(201).json(newCategory);
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua Kategori Produk
 * @route   GET /api/product-categories
 * @access  Private
 */
export const getAllCategories = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const categories = await ProductCategory.findAll({
      where: { branchId },
      order: [["name", "ASC"]],
    });
    res.status(200).json(categories);
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan satu Kategori Produk by ID
 * @route   GET /api/product-categories/:id
 * @access  Private
 */
export const getCategoryById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const category = await ProductCategory.findOne({
      where: { id: req.params.id, branchId },
    });
    if (category) {
      res.status(200).json(category);
    } else {
      res.status(404).json({ message: "Kategori produk tidak ditemukan." });
    }
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Memperbarui Kategori Produk
 * @route   PUT /api/product-categories/:id
 * @access  Private (Admin)
 */
export const updateCategory = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const { name, description } = req.body;

    const category = await ProductCategory.findOne({ where: { id, branchId } });
    if (!category) {
      return res
        .status(404)
        .json({ message: "Kategori produk tidak ditemukan." });
    }

    if (name && name !== category.name) {
      const existing = await ProductCategory.findOne({
        where: { name, branchId, id: { [Op.ne]: id } },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: `Nama kategori '${name}' sudah digunakan.` });
      }
    }

    const updatedCategory = await category.update({ name, description });
    res.status(200).json({
      message: "Kategori berhasil diperbarui",
      category: updatedCategory,
    });
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Menghapus Kategori Produk
 * @route   DELETE /api/product-categories/:id
 * @access  Private (Admin)
 */
export const deleteCategory = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    // PENTING: Cek apakah kategori ini sedang digunakan oleh produk manapun
    const productUsingCategory = await Product.findOne({
      where: { productCategoryId: id },
    });
    if (productUsingCategory) {
      return res.status(400).json({
        message:
          "Kategori tidak dapat dihapus karena sedang digunakan oleh satu atau lebih produk.",
      });
    }

    const deletedRows = await ProductCategory.destroy({
      where: { id, branchId },
    });
    if (deletedRows > 0) {
      res.status(200).json({ message: "Kategori produk berhasil dihapus." });
    } else {
      res.status(404).json({ message: "Kategori produk tidak ditemukan." });
    }
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};
