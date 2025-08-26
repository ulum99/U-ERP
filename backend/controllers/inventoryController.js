import db from "../models/index.js";
const { Product, InventoryMovement, sequelize } = db;

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
 * @desc    Menyesuaikan stok produk secara manual
 * @route   POST /api/inventory/adjust
 * @access  Private (Manager/Admin)
 * @header  X-Branch-ID
 * @body    { "productId": 1, "newQuantity": 150, "notes": "Hasil stock opname 25 Agustus 2025" }
 */
export const adjustStock = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const { productId, newQuantity, notes } = req.body;
    const userId = req.user.id;

    if (newQuantity === undefined || newQuantity < 0) {
      return res.status(400).json({
        message:
          "Kuantitas baru (newQuantity) harus diisi dan tidak boleh negatif.",
      });
    }

    const product = await Product.findOne({
      where: { id: productId, branchId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });

    if (!product) {
      throw new Error(
        `Produk dengan ID ${productId} tidak ditemukan di cabang ini.`
      );
    }

    const oldQuantity = product.quantity;
    const quantityChange = newQuantity - oldQuantity;

    if (quantityChange === 0) {
      return res
        .status(200)
        .json({ message: "Tidak ada perubahan stok.", product });
    }

    // Update kuantitas di tabel master produk
    product.quantity = newQuantity;
    await product.save({ transaction: t });

    // Buat catatan pergerakan stok
    await InventoryMovement.create(
      {
        branchId,
        productId,
        userId,
        type: quantityChange > 0 ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT",
        quantityChange,
        quantityAfter: newQuantity,
        notes,
      },
      { transaction: t }
    );

    await t.commit();
    res.status(200).json({ message: "Stok berhasil disesuaikan.", product });
  } catch (error) {
    await t.rollback();
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header") || error.message.includes("ditemukan")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Melihat riwayat stok (buku besar) untuk satu produk
 * @route   GET /api/inventory/ledger/:productId
 * @access  Private
 * @header  X-Branch-ID
 */
export const getProductLedger = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { productId } = req.params;

    const product = await Product.findOne({
      where: { id: productId, branchId },
    });
    if (!product) {
      return res.status(404).json({
        message: `Produk dengan ID ${productId} tidak ditemukan di cabang ini.`,
      });
    }

    const movements = await InventoryMovement.findAll({
      where: { productId, branchId },
      order: [["createdAt", "DESC"]],
      include: [{ model: db.User, attributes: ["id", "username"] }],
    });

    res.status(200).json({ product, movements });
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak") ? 403 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};
