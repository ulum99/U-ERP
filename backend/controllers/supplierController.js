import db from "../models/index.js";
import { Op } from "sequelize";
const { Supplier } = db;

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
 * @desc    Membuat pemasok baru di cabang yang aktif
 * @route   POST /api/suppliers
 * @access  Private
 * @header  X-Branch-ID
 */
export const createSupplier = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nama pemasok wajib diisi." });
    }

    // Cek duplikasi nama pemasok hanya di dalam cabang yang sama
    const existingSupplier = await Supplier.findOne({
      where: { name, branchId },
    });
    if (existingSupplier) {
      return res.status(400).json({
        message: `Pemasok dengan nama '${name}' sudah ada di cabang ini.`,
      });
    }

    // Buat pemasok baru dengan branchId yang sudah divalidasi
    const newSupplier = await Supplier.create({ ...req.body, branchId });
    res.status(201).json(newSupplier);
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
 * @desc    Mendapatkan semua data pemasok dari cabang yang aktif
 * @route   GET /api/suppliers
 * @access  Private
 * @header  X-Branch-ID
 */
export const getAllSuppliers = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);

    const suppliers = await Supplier.findAll({
      where: { branchId },
      order: [["name", "ASC"]],
    });
    res.status(200).json(suppliers);
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
 * @desc    Mendapatkan satu pemasok berdasarkan ID dari cabang yang aktif
 * @route   GET /api/suppliers/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const getSupplierById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    // Cari pemasok berdasarkan ID dan branchId
    const supplier = await Supplier.findOne({ where: { id, branchId } });

    if (supplier) {
      res.status(200).json(supplier);
    } else {
      res
        .status(404)
        .json({ message: "Pemasok tidak ditemukan di cabang ini." });
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
 * @desc    Memperbarui data pemasok di cabang yang aktif
 * @route   PUT /api/suppliers/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const updateSupplier = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const { name } = req.body;

    const supplier = await Supplier.findOne({ where: { id, branchId } });
    if (!supplier) {
      return res
        .status(404)
        .json({ message: "Pemasok tidak ditemukan di cabang ini." });
    }

    // Jika nama diubah, cek duplikasi pada pemasok lain di cabang yang sama
    if (name && name !== supplier.name) {
      const existingSupplier = await Supplier.findOne({
        where: { name, branchId, id: { [Op.ne]: id } },
      });
      if (existingSupplier) {
        return res.status(400).json({
          message: `Nama '${name}' sudah digunakan oleh pemasok lain di cabang ini.`,
        });
      }
    }

    const updatedSupplier = await supplier.update(req.body);
    res.status(200).json({
      message: "Data pemasok berhasil diperbarui",
      supplier: updatedSupplier,
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
 * @desc    Menghapus pemasok dari cabang yang aktif
 * @route   DELETE /api/suppliers/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const deleteSupplier = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    const deletedRows = await Supplier.destroy({ where: { id, branchId } });

    if (deletedRows > 0) {
      res.status(200).json({ message: "Pemasok berhasil dihapus." });
    } else {
      res
        .status(404)
        .json({ message: "Pemasok tidak ditemukan di cabang ini." });
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
