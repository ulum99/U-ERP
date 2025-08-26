import db from "../models/index.js"; // <-- PASTIKAN BARIS INI ADA
import { Op } from "sequelize";
const { Setting, sequelize } = db;

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
 * @desc    Mendapatkan semua pengaturan untuk cabang aktif
 * @route   GET /api/settings
 * @access  Private (Admin)
 */
export const getSettings = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const settings = await Setting.findAll({ where: { branchId } });

    // Ubah array of objects menjadi satu object key-value
    const settingsObject = settings.reduce((obj, item) => {
      obj[item.key] = item.value;
      return obj;
    }, {});

    res.status(200).json(settingsObject);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Memperbarui pengaturan (Upsert)
 * @route   PUT /api/settings
 * @access  Private (Admin)
 * @body    { "company_name": "...", "company_address": "..." }
 */
export const updateSettings = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const settingsData = req.body;

    for (const key in settingsData) {
      await Setting.upsert(
        {
          key: key,
          value: settingsData[key],
          branchId: branchId,
        },
        { transaction: t }
      );
    }

    await t.commit();
    res.status(200).json({ message: "Pengaturan berhasil diperbarui." });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};
