import db from "../models/index.js";
const {
  SalesOrder,
  SalesOrderDetail,
  Product,
  Customer,
  User,
  InventoryMovement,
  sequelize,
} = db;

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
 * @desc    Membuat Pesanan Penjualan baru
 */
export const createSalesOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    // 1. Mendapatkan branchId dari header, bukan dari body
    const branchId = getValidBranchId(req);
    const userId = req.user.id;
    const { customerId, items } = req.body;

    if (!customerId || !items || !Array.isArray(items) || items.length === 0) {
      throw new Error("Data customerId dan items (array) diperlukan.");
    }

    const customer = await Customer.findOne({
      where: { id: customerId, branchId },
      transaction: t,
    });
    if (!customer) {
      throw new Error(
        `Customer dengan ID ${customerId} tidak ditemukan di cabang ini.`
      );
    }

    // 2. Inisialisasi dan kalkulasi totalAmount di backend
    let totalAmount = 0;
    const processedItems = [];

    for (const item of items) {
      const product = await Product.findOne({
        where: { id: item.productId, branchId },
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!product) {
        throw new Error(`Produk dengan ID ${item.productId} tidak ditemukan.`);
      }

      if (product.productType === "STOCKABLE") {
        if (product.quantity < item.quantity) {
          throw new Error(
            `Stok untuk produk '${product.name}' tidak mencukupi.`
          );
        }
      }

      const itemPrice = parseFloat(product.sellingPrice);
      totalAmount += item.quantity * itemPrice; // Kalkulasi terjadi di sini
      processedItems.push({
        product,
        quantity: item.quantity,
        price: itemPrice,
      });
    }

    // 3. Menyimpan ke database dengan variabel yang sudah disiapkan
    const newOrder = await SalesOrder.create(
      {
        customerId,
        userId,
        totalAmount, // Menggunakan totalAmount yang dihitung di backend
        branchId, // Menggunakan branchId yang didapat dari header
        status: "pending",
      },
      { transaction: t }
    );

    // ... (sisa logika untuk menyimpan detail dan mengurangi stok)

    for (const item of processedItems) {
      await SalesOrderDetail.create(
        {
          salesOrderId: newOrder.id,
          productId: item.product.id,
          quantity: item.quantity,
          price: item.price,
        },
        { transaction: t }
      );

      if (item.product.productType === "STOCKABLE") {
        const quantityBefore = item.product.quantity;
        await item.product.decrement(
          { quantity: item.quantity },
          { transaction: t }
        );

        await InventoryMovement.create(
          {
            branchId,
            productId: item.product.id,
            userId,
            type: "SALES_SHIPMENT",
            quantityChange: -item.quantity,
            quantityAfter: quantityBefore - item.quantity,
            referenceId: `SO-${newOrder.id}`,
          },
          { transaction: t }
        );
      }
    }

    await t.commit();
    res.status(201).json({
      message: "Pesanan penjualan berhasil dibuat",
      orderId: newOrder.id,
    });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mengubah status pesanan (misal: membatalkan)
 */
// di file: controllers/salesOrderController.js

export const updateSalesOrderStatus = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const userId = req.user.id;
    const { id } = req.params;
    const { status } = req.body; // <-- BARIS YANG HILANG ADA DI SINI

    if (!status) {
      throw new Error("Status wajib diisi.");
    }

    const order = await SalesOrder.findOne({
      where: { id, branchId },
      include: [{ model: SalesOrderDetail, as: "details" }],
      transaction: t,
    });

    if (!order) {
      throw new Error("Pesanan penjualan tidak ditemukan di cabang ini.");
    }

    if (order.status === status) {
      return res
        .status(200)
        .json({
          message: `Status pesanan sudah '${status}'. Tidak ada perubahan.`,
          order,
        });
    }

    // Logika pengembalian stok jika pesanan dibatalkan
    if (status === "cancelled" && order.status !== "cancelled") {
      for (const item of order.details) {
        const product = await Product.findByPk(item.productId, {
          transaction: t,
          lock: t.LOCK.UPDATE,
        });

        if (product && product.productType === "STOCKABLE") {
          const quantityBefore = product.quantity;
          await product.increment(
            { quantity: item.quantity },
            { transaction: t }
          );

          await InventoryMovement.create(
            {
              branchId,
              productId: item.productId,
              userId,
              type: "ADJUSTMENT_IN",
              quantityChange: item.quantity,
              quantityAfter: quantityBefore + item.quantity,
              referenceId: `SO-${order.id}`,
              notes: `Pembatalan pesanan #${order.id}`,
            },
            { transaction: t }
          );
        }
      }
    }

    order.status = status;
    await order.save({ transaction: t });

    await t.commit();
    res
      .status(200)
      .json({
        message: `Status pesanan berhasil diubah menjadi '${status}'`,
        order,
      });
  } catch (error) {
    await t.rollback();
    const statusCode = error.message.includes("Akses ditolak")
      ? 403
      : error.message.includes("wajib") || error.message.includes("ditemukan")
      ? 400
      : 500;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua pesanan penjualan dari cabang aktif
 * @route   GET /api/sales-orders
 * @access  Private
 * @header  X-Branch-ID
 */
export const getAllSalesOrders = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const orders = await SalesOrder.findAll({
      where: { branchId },
      order: [["orderDate", "DESC"]],
      include: [
        { model: Customer, attributes: ["id", "name"] },
        { model: User, attributes: ["id", "username"] },
        {
          model: SalesOrderDetail,
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
 * @desc    Mendapatkan satu pesanan penjualan berdasarkan ID dari cabang aktif
 * @route   GET /api/sales-orders/:id
 * @access  Private
 * @header  X-Branch-ID
 */
export const getSalesOrderById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { id } = req.params;
    const order = await SalesOrder.findOne({
      where: { id, branchId },
      include: [
        { model: Customer },
        { model: User, attributes: ["id", "username"] },
        { model: SalesOrderDetail, as: "details", include: [Product] },
      ],
    });

    if (order) {
      res.status(200).json(order);
    } else {
      res
        .status(404)
        .json({ message: "Pesanan penjualan tidak ditemukan di cabang ini." });
    }
  } catch (error) {
    const statusCode = error.message.includes("Akses ditolak") ? 403 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};
