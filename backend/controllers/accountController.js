import db from "../models/index.js";
import { Op } from "sequelize";
const { Account } = db;

// Helper untuk validasi akses cabang
const getValidBranchId = (req) => {
  const branchId = req.headers["x-branch-id"];
  if (!branchId) throw new Error("Header X-Branch-ID diperlukan");
  // --- LOGIKA BARU ---
  // Jika user adalah superuser (dari token JWT), lewati pengecekan akses cabang
  if (req.user.isSuperUser) {
    return parseInt(branchId, 10);
  }
  // -------------------
  if (!req.user.branches.includes(parseInt(branchId, 10)))
    throw new Error("Akses ke cabang ini ditolak");
  return parseInt(branchId, 10);
};

/**
 * @desc    Membuat akun baru
 * @route   POST /api/accounts
 * @access  Private (Admin)
 */
export const createAccount = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { accountNumber, name, type } = req.body;

    if (!accountNumber || !name || !type) {
      return res
        .status(400)
        .json({ message: "Nomor Akun, Nama, dan Tipe wajib diisi." });
    }

    const existingAccount = await Account.findOne({
      where: { accountNumber, branchId },
    });
    if (existingAccount) {
      return res.status(400).json({
        message: `Nomor akun ${accountNumber} sudah ada di cabang ini.`,
      });
    }

    const newAccount = await Account.create({
      accountNumber,
      name,
      type,
      branchId,
    });
    res.status(201).json(newAccount);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua akun
 * @route   GET /api/accounts
 * @access  Private
 */
export const getAllAccounts = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const accounts = await Account.findAll({
      where: { branchId },
      order: [["accountNumber", "ASC"]],
    });
    res.status(200).json(accounts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan satu akun berdasarkan ID
 * @route   GET /api/accounts/:id
 * @access  Private
 */
export const getAccountById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const account = await Account.findOne({
      where: { id: req.params.id, branchId },
    });
    if (account) {
      res.status(200).json(account);
    } else {
      res.status(404).json({ message: "Akun tidak ditemukan." });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Memperbarui akun
 * @route   PUT /api/accounts/:id
 * @access  Private (Admin)
 */
export const updateAccount = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const { accountNumber, name, type } = req.body;

    const account = await Account.findOne({ where: { id, branchId } });
    if (!account)
      return res.status(404).json({ message: "Akun tidak ditemukan." });

    if (accountNumber && accountNumber !== account.accountNumber) {
      const existing = await Account.findOne({
        where: { accountNumber, branchId, id: { [Op.ne]: id } },
      });
      if (existing)
        return res
          .status(400)
          .json({ message: `Nomor akun ${accountNumber} sudah digunakan.` });
    }

    await account.update({ accountNumber, name, type });
    res.status(200).json({ message: "Akun berhasil diperbarui", account });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Menghapus akun
 * @route   DELETE /api/accounts/:id
 * @access  Private (Admin)
 */
export const deleteAccount = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    // PENTING: Cek apakah akun pernah digunakan di jurnal
    const usage = await JournalEntryLine.findOne({ where: { accountId: id } });
    if (usage) {
      return res.status(400).json({
        message:
          "Akun tidak dapat dihapus karena sudah memiliki transaksi jurnal.",
      });
    }

    const deleted = await Account.destroy({ where: { id, branchId } });
    if (!deleted)
      return res.status(404).json({ message: "Akun tidak ditemukan." });

    res.status(200).json({ message: "Akun berhasil dihapus." });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
