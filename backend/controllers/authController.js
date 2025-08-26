import db from "../models/index.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";

const { User, UserBranchAccess, Branch } = db;

/**
 * @desc    Mendaftarkan pengguna baru (biasanya untuk inisialisasi atau pendaftaran mandiri)
 * @route   POST /api/auth/register
 * @access  Public
 */
export const register = async (req, res) => {
  const { username, email, password, role } = req.body;
  try {
    if (!username || !email || !password) {
      return res
        .status(400)
        .json({ message: "Username, email, dan password wajib diisi." });
    }

    // Cek apakah username atau email sudah ada
    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] },
    });
    if (existingUser) {
      return res
        .status(400)
        .json({ message: "Username atau email sudah digunakan." });
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role: role || "staff", // Default ke 'staff' jika tidak dispesifikasikan
    });

    // Catatan: Pendaftaran mandiri tidak otomatis memberikan akses cabang.
    // Admin harus memberikan akses melalui halaman Manajemen Pengguna.

    res.status(201).json({
      message:
        "Pengguna berhasil terdaftar. Hubungi admin untuk mendapatkan akses cabang.",
      userId: newUser.id,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mendaftarkan pengguna.", error: error.message });
  }
};

/**
 * @desc    Login pengguna dan membuat token JWT
 * @route   POST /api/auth/login
 * @access  Public
 */
export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // 1. Cari pengguna berdasarkan email
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Kredensial tidak valid." }); // Pesan umum untuk keamanan
    }

    // 2. Bandingkan password yang diberikan dengan hash di database
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Kredensial tidak valid." }); // Pesan umum untuk keamanan
    }

    // 3. Siapkan data akses cabang berdasarkan peran (role)
    let accessibleBranchIds = [];
    let isSuperUser = false;

    if (user.role === "superuser") {
      isSuperUser = true;
      // Untuk superuser, daftar cabang akan diambil di frontend.
      // JWT hanya perlu penanda 'isSuperUser'.
    } else {
      // Untuk pengguna biasa, ambil daftar cabang yang diizinkan
      const access = await UserBranchAccess.findAll({
        where: { userId: user.id },
        attributes: ["branchId"],
      });
      accessibleBranchIds = access.map((a) => a.branchId);

      // Jika pengguna biasa tidak punya akses ke cabang mana pun, tolak login.
      if (accessibleBranchIds.length === 0) {
        return res
          .status(403)
          .json({
            message:
              "Akun Anda belum memiliki hak akses ke cabang manapun. Hubungi admin.",
          });
      }
    }

    // 4. Buat token JWT
    const tokenPayload = {
      id: user.id,
      role: user.role,
      branches: accessibleBranchIds, // Untuk pengguna biasa
      isSuperUser: isSuperUser, // Penanda khusus untuk Super User
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET,
      { expiresIn: "8h" } // Token berlaku selama 8 jam
    );

    // 5. Kirim response ke frontend
    res.json({
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        isSuperUser: isSuperUser,
        accessibleBranches: accessibleBranchIds,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res
      .status(500)
      .json({
        message: "Terjadi kesalahan pada server.",
        error: error.message,
      });
  }
};
