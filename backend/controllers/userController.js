import db from "../models/index.js";
import bcrypt from "bcryptjs";
import { Op } from "sequelize";
const { User, Branch, UserBranchAccess, sequelize } = db;

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
 * @desc    Mendapatkan semua pengguna beserta akses cabangnya
 * @route   GET /api/users
 * @access  Private (Admin)
 */
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ["password"] }, // Jangan pernah kirim password hash ke frontend
      include: [
        {
          model: Branch,
          attributes: ["id", "name"],
          through: { attributes: [] }, // Jangan sertakan data dari tabel perantara
        },
      ],
      order: [["username", "ASC"]],
    });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data pengguna.",
      error: error.message,
    });
  }
};

/**
 * @desc    Mendapatkan satu pengguna berdasarkan ID
 * @route   GET /api/users/:id
 * @access  Private (Admin)
 */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ["password"] },
      include: [
        {
          model: Branch,
          attributes: ["id", "name"],
          through: { attributes: [] },
        },
      ],
    });

    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ message: "Pengguna tidak ditemukan." });
    }
  } catch (error) {
    res.status(500).json({
      message: "Gagal mengambil data pengguna.",
      error: error.message,
    });
  }
};

/**
 * @desc    Membuat pengguna baru oleh Admin
 * @route   POST /api/users
 * @access  Private (Admin)
 * @body    { "username": "...", "email": "...", "password": "...", "role": "...", "branchIds": [1, 2] }
 */
export const createUser = async (req, res) => {
  const { username, email, password, role, branchIds } = req.body;
  const t = await sequelize.transaction();
  try {
    if (
      !username ||
      !email ||
      !password ||
      !role ||
      !branchIds ||
      branchIds.length === 0
    ) {
      throw new Error(
        "Semua field wajib diisi, termasuk minimal satu akses cabang."
      );
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existingUser) {
      throw new Error("Username atau email sudah digunakan.");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create(
      {
        username,
        email,
        password: hashedPassword,
        role,
      },
      { transaction: t }
    );

    const accessData = branchIds.map((branchId) => ({
      userId: newUser.id,
      branchId,
    }));
    await UserBranchAccess.bulkCreate(accessData, { transaction: t });

    await t.commit();
    res.status(201).json({ message: "Pengguna baru berhasil dibuat." });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Memperbarui data pengguna oleh Admin
 * @route   PUT /api/users/:id
 * @access  Private (Admin)
 */
export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, role, branchIds, password } = req.body;
  const t = await sequelize.transaction();
  try {
    if (!username || !email || !role || !branchIds || branchIds.length === 0) {
      throw new Error(
        "Username, email, peran, dan minimal satu akses cabang wajib diisi."
      );
    }

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    // --- PENAMBAHAN LOGIKA KEAMANAN SUPER USER ---
    // Cek apakah pengguna yang akan diubah adalah superuser
    if (user.role === "superuser") {
      // Jika ya, pastikan pengguna yang melakukan aksi ini juga superuser
      if (req.user.role !== "superuser") {
        throw new Error(
          "Akses ditolak. Hanya Super User yang dapat mengubah data Super User lain."
        );
      }
    }
    // ---------------------------------------------

    // Update detail dasar
    user.username = username;
    user.email = email;
    user.role = role;

    // Jika ada password baru, hash dan update
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    await user.save({ transaction: t });

    // Update akses cabang (hapus yang lama, buat yang baru)
    await UserBranchAccess.destroy({ where: { userId: id }, transaction: t });
    const accessData = branchIds.map((branchId) => ({ userId: id, branchId }));
    await UserBranchAccess.bulkCreate(accessData, { transaction: t });

    await t.commit();
    res.status(200).json({ message: "Data pengguna berhasil diperbarui." });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Menghapus pengguna oleh Admin
 * @route   DELETE /api/users/:id
 * @access  Private (Admin)
 */
export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const t = await sequelize.transaction();
  try {
    // Mencegah admin menghapus akunnya sendiri
    if (parseInt(id, 10) === req.user.id) {
      throw new Error("Anda tidak dapat menghapus akun Anda sendiri.");
    }

    const user = await User.findByPk(id, { transaction: t });
    if (!user) {
      throw new Error("Pengguna tidak ditemukan.");
    }

    // --- PENAMBAHAN LOGIKA KEAMANAN SUPER USER (serupa dengan update) ---
    if (user.role === "superuser" && req.user.role !== "superuser") {
      throw new Error(
        "Akses ditolak. Hanya Super User yang dapat menghapus Super User lain."
      );
    }
    // -----------------------------------------------------------------

    // Hapus relasi akses cabang terlebih dahulu
    await UserBranchAccess.destroy({ where: { userId: id }, transaction: t });
    // Hapus pengguna
    await user.destroy({ transaction: t });

    await t.commit();
    res.status(200).json({ message: "Pengguna berhasil dihapus." });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};
