import db from "../models/index.js";
import { Op } from "sequelize";
const { Customer } = db;

/**
 * Fungsi helper untuk memvalidasi header X-Branch-ID dan hak akses pengguna.
 * @param {object} req - Objek request dari Express.
 * @returns {number} ID cabang yang valid.
 * @throws {Error} Melempar error jika header tidak ada atau pengguna tidak memiliki akses.
 */
const getValidBranchId = (req) => {
  // 1. Ambil ID cabang dari header request
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

  // 2. Ambil daftar cabang yang bisa diakses pengguna dari token JWT (disisipkan oleh middleware 'protect')
  const userBranches = req.user.branches || [];
  const hasAccess = userBranches.includes(parseInt(branchId, 10));

  // 3. Lemparkan error jika pengguna tidak punya akses
  if (!hasAccess) {
    throw new Error("Akses ke data cabang ini ditolak.");
  }

  return parseInt(branchId, 10);
};

// --- FUNGSI-FUNGSI CRUD ---

/**
 * @desc    Membuat pelanggan baru di cabang yang aktif
 * @route   POST /api/customers
 * @access  Private
 * @header  X-Branch-ID
 */
export const createCustomer = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { name, email, phone, address } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Nama pelanggan wajib diisi." });
    }

    // Cek duplikasi email hanya di dalam cabang yang sama
    if (email) {
      const existingCustomer = await Customer.findOne({
        where: { email, branchId },
      });
      if (existingCustomer) {
        return res.status(400).json({
          message: `Pelanggan dengan email '${email}' sudah ada di cabang ini.`,
        });
      }
    }

    // Buat pelanggan baru dengan branchId yang sudah divalidasi
    const newCustomer = await Customer.create({
      name,
      email,
      phone,
      address,
      branchId,
    });
    res.status(201).json(newCustomer);
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
 * @desc    Mendapatkan semua data pelanggan dari cabang yang aktif
 * @route   GET /api/customers
 * @access  Private
 * @header  X-Branch-ID
 */
export const getAllCustomers = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);

    // Ambil semua pelanggan dengan filter branchId
    const customers = await Customer.findAll({
      where: { branchId },
      order: [["name", "ASC"]],
    });
    res.status(200).json(customers);
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
 * @desc    Mendapatkan satu pelanggan berdasarkan ID dari cabang yang aktif
 * @route   GET /api/customers/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const getCustomerById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    // Cari pelanggan berdasarkan ID dan branchId untuk memastikan data tidak bocor antar cabang
    const customer = await Customer.findOne({ where: { id, branchId } });

    if (customer) {
      res.status(200).json(customer);
    } else {
      res
        .status(404)
        .json({ message: "Pelanggan tidak ditemukan di cabang ini." });
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
 * @desc    Memperbarui data pelanggan di cabang yang aktif
 * @route   PUT /api/customers/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const updateCustomer = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const { email } = req.body;

    const customer = await Customer.findOne({ where: { id, branchId } });
    if (!customer) {
      return res
        .status(404)
        .json({ message: "Pelanggan tidak ditemukan di cabang ini." });
    }

    // Jika email diubah, cek duplikasi email baru pada pelanggan lain di cabang yang sama
    if (email && email !== customer.email) {
      const existingCustomer = await Customer.findOne({
        where: { email, branchId, id: { [Op.ne]: id } },
      });
      if (existingCustomer) {
        return res.status(400).json({
          message: `Email '${email}' sudah digunakan oleh pelanggan lain di cabang ini.`,
        });
      }
    }

    const updatedCustomer = await customer.update(req.body);
    res.status(200).json({
      message: "Data pelanggan berhasil diperbarui",
      customer: updatedCustomer,
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
 * @desc    Menghapus pelanggan dari cabang yang aktif
 * @route   DELETE /api/customers/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const deleteCustomer = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    // Hapus pelanggan berdasarkan ID dan branchId
    const deletedRows = await Customer.destroy({ where: { id, branchId } });

    if (deletedRows > 0) {
      res.status(200).json({ message: "Pelanggan berhasil dihapus." });
    } else {
      res
        .status(404)
        .json({ message: "Pelanggan tidak ditemukan di cabang ini." });
    }
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header")
      ? 400
      : 500;
    // Error 500 bisa terjadi jika pelanggan terkait dengan data lain (misal: SalesOrder)
    res.status(statusCode).json({ message: error.message });
  }
};
