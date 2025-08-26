import db from "../models/index.js";
import { Op } from "sequelize";
const {
  PurchaseOrder,
  PurchaseOrderDetail,
  Product,
  Supplier,
  InventoryMovement,
  ProductCategory,
  UnitOfMeasure,
  sequelize,
} = db;

/**
 * Helper function untuk memvalidasi header dan akses cabang.
 * @param {object} req - Object request Express.
 * @returns {number} ID cabang yang valid.
 * @throws {Error} Jika header tidak ada atau akses ditolak.
 */
const getValidBranchId = (req) => {
  const branchId = req.headers["x-branch-id"];
  if (!branchId) {
    throw new Error("Header X-Branch-ID diperlukan untuk request ini");
  }

  // --- LOGIKA BARU ---
  // Jika user adalah superuser (dari token JWT), lewati pengecekan akses cabang
  if (req.user.isSuperUser) {
    return parseInt(branchId, 10);
  }
  // -------------------

  const userBranches = req.user.branches || [];
  const hasAccess = userBranches.includes(parseInt(branchId, 10));

  if (!hasAccess) {
    throw new Error("Akses ke data cabang ini ditolak");
  }

  return parseInt(branchId, 10);
};

/**
 * @desc    Membuat produk baru
 * @route   POST /api/products
 * @access  Private/Admin
 */
export const createProduct = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    // Ambil field baru dari body
    const {
      sku,
      name,
      description,
      quantity,
      sellingPrice,
      costPrice,
      productType,
      productCategoryId,
      unitOfMeasureId,
    } = req.body;

    if (!sku || !name || sellingPrice === undefined) {
      return res
        .status(400)
        .json({ message: "Field sku, name, dan sellingPrice wajib diisi" });
    }

    const existingProduct = await Product.findOne({ where: { sku, branchId } });
    if (existingProduct) {
      return res.status(400).json({
        message: `Produk dengan SKU '${sku}' sudah ada di cabang ini`,
      });
    }

    const newProduct = await Product.create({
      sku,
      name,
      description,
      quantity,
      sellingPrice,
      costPrice,
      productType,
      productCategoryId,
      unitOfMeasureId,
      branchId,
    });

    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua produk
 * @route   GET /api/products
 * @access  Private
 */
export const getAllProducts = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const products = await Product.findAll({
      where: { branchId },
      include: [
        { model: ProductCategory, as: "category", attributes: ["id", "name"] },
        {
          model: UnitOfMeasure,
          as: "uom",
          attributes: ["id", "name", "symbol"],
        },
      ],
      order: [["name", "ASC"]],
    });
    res.status(200).json(products);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Gagal mendapatkan data produk", error: error.message });
  }
};

/**
 * @desc    Memperbarui data produk
 * @route   PUT /api/products/:id
 * @access  Private/Admin
 */
export const updateProduct = async (req, res) => {
  const { id } = req.params;
  try {
    const branchId = getValidBranchId(req);
    const product = await Product.findOne({ where: { id, branchId } });
    if (!product) {
      return res.status(404).json({ message: "Produk tidak ditemukan" });
    }
    // Update dengan field-field baru
    const updatedProduct = await product.update(req.body);
    res
      .status(200)
      .json({ message: "Produk berhasil diperbarui", product: updatedProduct });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan satu produk berdasarkan ID dari cabang yang aktif
 * @route   GET /api/products/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const getProductById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    const product = await Product.findOne({
      where: { id, branchId }, // Filter berdasarkan ID dan cabang
    });

    if (product) {
      res.status(200).json(product);
    } else {
      res.status(404).json({ message: "Produk tidak ditemukan di cabang ini" });
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
 * @desc    Menghapus produk dari cabang yang aktif
 * @route   DELETE /api/products/:id
 * @access  Private/Admin
 * @header  X-Branch-ID
 */
export const deleteProduct = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    const deletedRows = await Product.destroy({
      where: { id, branchId },
    });

    if (deletedRows > 0) {
      res.status(200).json({ message: "Produk berhasil dihapus" });
    } else {
      res.status(404).json({ message: "Produk tidak ditemukan di cabang ini" });
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

export const receivePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // ... (logika find order)
    const userId = req.user.id;

    for (const item of order.details) {
      // Dapatkan kuantitas produk sebelum ditambah
      const productBefore = await Product.findByPk(item.productId, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      const quantityBefore = productBefore.quantity;

      // Tambah stok produk
      await productBefore.increment(
        { quantity: item.quantity },
        { transaction: t }
      );

      // Buat catatan pergerakan inventaris
      await InventoryMovement.create(
        {
          branchId,
          productId: item.productId,
          userId,
          type: "PURCHASE_RECEIPT",
          quantityChange: item.quantity,
          quantityAfter: quantityBefore + item.quantity,
          referenceId: `PO-${order.id}`,
        },
        { transaction: t }
      );
    }
    // ... (logika update status order dan commit)
  } catch (error) {
    // ...
  }
};
