import db from "../models/index.js";
import { Op } from "sequelize";
const { UnitOfMeasure, Product } = db;

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
 * @desc    Membuat Satuan Produk baru
 * @route   POST /api/units-of-measure
 * @access  Private (Admin)
 */
export const createUnitOfMeasure = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { name, symbol } = req.body;

    if (!name || !symbol) {
      return res
        .status(400)
        .json({ message: 'Field "name" dan "symbol" wajib diisi.' });
    }

    const existing = await UnitOfMeasure.findOne({
      where: {
        [Op.or]: [{ name }, { symbol }],
        branchId,
      },
    });

    if (existing) {
      return res.status(400).json({
        message: `Satuan dengan nama '${name}' atau simbol '${symbol}' sudah ada.`,
      });
    }

    const newUom = await UnitOfMeasure.create({ name, symbol, branchId });
    res.status(201).json(newUom);
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
 * @desc    Mendapatkan semua Satuan Produk
 * @route   GET /api/units-of-measure
 * @access  Private
 */
export const getAllUnitOfMeasures = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const uoms = await UnitOfMeasure.findAll({
      where: { branchId },
      order: [["name", "ASC"]],
    });
    res.status(200).json(uoms);
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
 * @desc    Mendapatkan satu Satuan Produk by ID
 * @route   GET /api/units-of-measure/:id
 * @access  Private
 */
export const getUnitOfMeasureById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const uom = await UnitOfMeasure.findOne({
      where: { id: req.params.id, branchId },
    });
    if (uom) {
      res.status(200).json(uom);
    } else {
      res.status(404).json({ message: "Satuan produk tidak ditemukan." });
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
 * @desc    Memperbarui Satuan Produk
 * @route   PUT /api/units-of-measure/:id
 * @access  Private (Admin)
 */
export const updateUnitOfMeasure = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const { name, symbol } = req.body;

    const uom = await UnitOfMeasure.findOne({ where: { id, branchId } });
    if (!uom) {
      return res
        .status(404)
        .json({ message: "Satuan produk tidak ditemukan." });
    }

    // Cek duplikasi jika nama atau simbol diubah
    if ((name && name !== uom.name) || (symbol && symbol !== uom.symbol)) {
      const existing = await UnitOfMeasure.findOne({
        where: {
          [Op.or]: [{ name }, { symbol }],
          branchId,
          id: { [Op.ne]: id },
        },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Nama atau simbol sudah digunakan." });
      }
    }

    const updatedUom = await uom.update({ name, symbol });
    res
      .status(200)
      .json({ message: "Satuan berhasil diperbarui", uom: updatedUom });
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
 * @desc    Menghapus Satuan Produk
 * @route   DELETE /api/units-of-measure/:id
 * @access  Private (Admin)
 */
export const deleteUnitOfMeasure = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    // PENTING: Cek apakah satuan ini sedang digunakan oleh produk
    const productUsingUom = await Product.findOne({
      where: { unitOfMeasureId: id },
    });
    if (productUsingUom) {
      return res.status(400).json({
        message:
          "Satuan tidak dapat dihapus karena sedang digunakan oleh satu atau lebih produk.",
      });
    }

    const deletedRows = await UnitOfMeasure.destroy({
      where: { id, branchId },
    });
    if (deletedRows > 0) {
      res.status(200).json({ message: "Satuan produk berhasil dihapus." });
    } else {
      res.status(404).json({ message: "Satuan produk tidak ditemukan." });
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
