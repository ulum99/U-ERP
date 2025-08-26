import db from "../models/index.js";
import { Op } from "sequelize";
const { TaxRate, AppliedTax } = db;

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
 * @desc    Membuat tarif pajak baru di cabang yang aktif
 * @route   POST /api/tax-rates
 * @access  Private (Admin)
 * @header  X-Branch-ID
 * @body    { "name": "PPN", "rate": 11.00 }
 */
export const createTaxRate = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { name, rate } = req.body;

    if (!name || rate === undefined) {
      return res
        .status(400)
        .json({ message: 'Field "name" dan "rate" wajib diisi.' });
    }
    if (isNaN(parseFloat(rate)) || parseFloat(rate) < 0) {
      return res
        .status(400)
        .json({ message: 'Field "rate" harus berupa angka positif.' });
    }

    // Cek duplikasi nama pajak di cabang yang sama
    const existingTax = await TaxRate.findOne({ where: { name, branchId } });
    if (existingTax) {
      return res.status(400).json({
        message: `Pajak dengan nama '${name}' sudah ada di cabang ini.`,
      });
    }

    const newTaxRate = await TaxRate.create({ name, rate, branchId });
    res.status(201).json(newTaxRate);
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
 * @desc    Mendapatkan semua tarif pajak dari cabang yang aktif
 * @route   GET /api/tax-rates
 * @access  Private
 * @header  X-Branch-ID
 */
export const getAllTaxRates = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);

    const taxRates = await TaxRate.findAll({
      where: { branchId },
      order: [["name", "ASC"]],
    });
    res.status(200).json(taxRates);
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
 * @desc    Mendapatkan satu tarif pajak berdasarkan ID dari cabang yang aktif
 * @route   GET /api/tax-rates/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const getTaxRateById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    const taxRate = await TaxRate.findOne({ where: { id, branchId } });

    if (taxRate) {
      res.status(200).json(taxRate);
    } else {
      res
        .status(404)
        .json({ message: "Tarif pajak tidak ditemukan di cabang ini." });
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
 * @desc    Memperbarui tarif pajak di cabang yang aktif
 * @route   PUT /api/tax-rates/:id
 * @access  Private (Admin)
 * @header  X-Branch-ID
 */
export const updateTaxRate = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const { name, rate } = req.body;

    const taxRate = await TaxRate.findOne({ where: { id, branchId } });
    if (!taxRate) {
      return res
        .status(404)
        .json({ message: "Tarif pajak tidak ditemukan di cabang ini." });
    }

    // Jika nama diubah, cek duplikasi pada pajak lain di cabang yang sama
    if (name && name !== taxRate.name) {
      const existingTax = await TaxRate.findOne({
        where: { name, branchId, id: { [Op.ne]: id } },
      });
      if (existingTax) {
        return res
          .status(400)
          .json({ message: `Nama pajak '${name}' sudah digunakan.` });
      }
    }

    const updatedTaxRate = await taxRate.update({ name, rate });
    res.status(200).json({
      message: "Tarif pajak berhasil diperbarui",
      taxRate: updatedTaxRate,
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
 * @desc    Menghapus tarif pajak dari cabang yang aktif
 * @route   DELETE /api/tax-rates/:id
 * @access  Private (Admin)
 * @header  X-Branch-ID
 */
export const deleteTaxRate = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    // Cek apakah pajak ini sudah pernah digunakan dalam transaksi
    const usage = await AppliedTax.findOne({ where: { taxRateId: id } });
    if (usage) {
      return res.status(400).json({
        message:
          "Pajak tidak dapat dihapus karena sudah digunakan dalam transaksi.",
      });
    }

    const deletedRows = await TaxRate.destroy({ where: { id, branchId } });

    if (deletedRows > 0) {
      res.status(200).json({ message: "Tarif pajak berhasil dihapus." });
    } else {
      res
        .status(404)
        .json({ message: "Tarif pajak tidak ditemukan di cabang ini." });
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
