import db from "../models/index.js";
const { PurchaseOrder, PurchaseOrderDetail, Product, Supplier, sequelize } = db;

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

// --- FUNGSI-FUNGSI CONTROLLER ---

/**
 * @desc    Membuat Pesanan Pembelian baru di cabang aktif
 * @route   POST /api/purchase-orders
 * @access  Private
 * @header  X-Branch-ID
 * @body    { "supplierId": 1, "items": [{ "productId": 1, "quantity": 10, "price": 15000 }, ...] }
 */
export const createPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();

  try {
    const branchId = getValidBranchId(req);
    const { supplierId, items } = req.body;

    if (!supplierId || !items || !Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: "Data supplierId dan items (array) diperlukan." });
    }

    // Validasi supplier (diasumsikan supplier bersifat global/tidak terikat cabang)
    const supplier = await Supplier.findByPk(supplierId, { transaction: t });
    if (!supplier) {
      throw new Error(`Supplier dengan ID ${supplierId} tidak ditemukan.`);
    }

    let totalAmount = 0;
    // Validasi setiap item dan hitung total
    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, branchId },
        transaction: t,
      });
      if (!product) {
        throw new Error(
          `Produk dengan ID ${item.productId} tidak ditemukan di cabang ini.`
        );
      }
      totalAmount += item.quantity * item.price;
    }

    // Buat header PurchaseOrder
    const newOrder = await PurchaseOrder.create(
      {
        supplierId,
        totalAmount,
        branchId,
      },
      { transaction: t }
    );

    // Buat detail pesanan
    const orderDetails = items.map((item) => ({
      purchaseOrderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
    }));
    await PurchaseOrderDetail.bulkCreate(orderDetails, { transaction: t });

    await t.commit();
    res.status(201).json({
      message: "Pesanan pembelian berhasil dibuat",
      orderId: newOrder.id,
    });
  } catch (error) {
    await t.rollback();
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header") ||
        error.message.includes("tidak ditemukan")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua pesanan pembelian dari cabang aktif
 * @route   GET /api/purchase-orders
 * @access  Private
 * @header  X-Branch-ID
 */
export const getAllPurchaseOrders = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const orders = await PurchaseOrder.findAll({
      where: { branchId },
      order: [["orderDate", "DESC"]],
      include: [
        { model: Supplier, attributes: ["id", "name"] },
        {
          model: PurchaseOrderDetail,
          as: "details",
          include: [{ model: Product, attributes: ["id", "name", "sku"] }],
        },
      ],
    });
    res.status(200).json(orders);
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak") ? 403 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan satu pesanan pembelian berdasarkan ID dari cabang aktif
 * @route   GET /api/purchase-orders/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const getPurchaseOrderById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const order = await PurchaseOrder.findOne({
      where: { id, branchId },
      include: [
        { model: Supplier },
        { model: PurchaseOrderDetail, as: "details", include: [Product] },
      ],
    });

    if (order) {
      res.status(200).json(order);
    } else {
      res
        .status(404)
        .json({ message: "Pesanan pembelian tidak ditemukan di cabang ini." });
    }
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak") ? 403 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Menerima barang dari Purchase Order & menambah stok produk
 * @route   POST /api/purchase-orders/:id/receive
 * @access  Private
 * @header  X-Branch-ID
 */
export const receivePurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;

    const order = await PurchaseOrder.findOne({
      where: { id, branchId },
      include: [{ model: PurchaseOrderDetail, as: "details" }],
      transaction: t,
    });

    if (!order) {
      throw new Error("Pesanan pembelian tidak ditemukan di cabang ini.");
    }
    if (order.status === "completed") {
      throw new Error(
        "Barang untuk pesanan ini sudah pernah diterima sebelumnya."
      );
    }

    // Tambah stok untuk setiap item dalam pesanan di cabang yang sesuai
    for (const item of order.details) {
      await Product.increment(
        { quantity: item.quantity },
        { where: { id: item.productId, branchId }, transaction: t }
      );
    }

    // Update status pesanan menjadi 'completed'
    order.status = "completed";
    await order.save({ transaction: t });

    await t.commit();
    res.status(200).json({
      message: "Barang berhasil diterima dan stok telah diperbarui",
      order,
    });
  } catch (error) {
    await t.rollback();
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("Header") ||
        error.message.includes("tidak ditemukan") ||
        error.message.includes("sudah pernah")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};
