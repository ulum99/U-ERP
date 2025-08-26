import db from "../models/index.js";
import AccountingService from "../services/accountingService.js";
const {
  SalesInvoice,
  SalesOrder,
  PaymentReceived,
  Customer,
  PurchaseInvoice,
  PurchaseOrder,
  PaymentMade,
  Supplier,
  TaxRate,
  AppliedTax,
  sequelize,
} = db;

/**
 * Fungsi helper untuk memvalidasi header X-Branch-ID dan hak akses pengguna.
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

// --- FUNGSI SIKLUS PIUTANG (ACCOUNTS RECEIVABLE) ---

/**
 * @desc    Membuat faktur dari Sales Order, menerapkan pajak, dan menjurnalkannya
 * @route   POST /api/finance/invoices
 * @access  Private (Admin/Manager)
 * @body    { "salesOrderId": 1, "dueDate": "2025-09-25", "taxIds": [1, 2] }
 */
export const createInvoiceFromSalesOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const { salesOrderId, dueDate, taxIds = [] } = req.body;

    if (!salesOrderId || !dueDate)
      throw new Error("Data salesOrderId dan dueDate wajib diisi.");

    const salesOrder = await SalesOrder.findOne({
      where: { id: salesOrderId, branchId },
      transaction: t,
    });
    if (!salesOrder)
      throw new Error("Sales Order tidak ditemukan di cabang ini.");

    const existingInvoice = await SalesInvoice.findOne({
      where: { salesOrderId },
      transaction: t,
    });
    if (existingInvoice)
      throw new Error("Faktur untuk Sales Order ini sudah pernah dibuat.");

    const subtotal = parseFloat(salesOrder.totalAmount);
    let totalTaxAmount = 0;
    const appliedTaxesData = [];

    if (taxIds.length > 0) {
      const taxes = await TaxRate.findAll({
        where: { id: taxIds, branchId },
        transaction: t,
      });
      if (taxes.length !== taxIds.length)
        throw new Error(
          "Satu atau lebih ID pajak tidak valid untuk cabang ini."
        );

      for (const tax of taxes) {
        const taxAmount = subtotal * (parseFloat(tax.rate) / 100);
        totalTaxAmount += taxAmount;
        appliedTaxesData.push({ taxRateId: tax.id, taxAmount });
      }
    }

    const totalAmount = subtotal + totalTaxAmount;
    const invoiceCount = await SalesInvoice.count({
      where: { branchId },
      transaction: t,
    });
    const invoiceNumber = `INV-${branchId}-${String(invoiceCount + 1).padStart(
      5,
      "0"
    )}`;

    const newInvoice = await SalesInvoice.create(
      {
        invoiceNumber,
        issueDate: new Date(),
        dueDate,
        salesOrderId,
        customerId: salesOrder.customerId,
        branchId,
        subtotal,
        totalTaxAmount,
        totalAmount,
        balanceDue: totalAmount,
        status: "sent",
      },
      { transaction: t }
    );

    if (appliedTaxesData.length > 0) {
      await AppliedTax.bulkCreate(
        appliedTaxesData.map((tax) => ({
          ...tax,
          salesInvoiceId: newInvoice.id,
        })),
        { transaction: t }
      );
    }

    await AccountingService.postSalesInvoice(newInvoice, t);

    await t.commit();
    res.status(201).json({
      message: "Faktur berhasil dibuat dan dijurnalkan",
      invoice: newInvoice,
    });
  } catch (error) {
    await t.rollback();
    const statusCode = error.message.includes("Akses ditolak") ? 403 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Mencatat pembayaran untuk faktur penjualan dan menjurnalkannya
 * @route   POST /api/finance/invoices/:invoiceId/payments
 * @access  Private (Admin/Manager)
 */
export const recordPaymentForInvoice = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const { invoiceId } = req.params;
    const { amount, paymentMethod, paymentDate, reference } = req.body;

    if (!amount || !paymentMethod || !paymentDate)
      throw new Error(
        "Data amount, paymentMethod, dan paymentDate wajib diisi."
      );

    const invoice = await SalesInvoice.findOne({
      where: { id: invoiceId, branchId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!invoice) throw new Error("Faktur tidak ditemukan di cabang ini.");
    if (["paid", "void"].includes(invoice.status))
      throw new Error(
        `Faktur ini berstatus '${invoice.status}' dan tidak dapat menerima pembayaran.`
      );

    const paymentAmount = parseFloat(amount);
    if (paymentAmount <= 0 || paymentAmount > parseFloat(invoice.balanceDue))
      throw new Error("Jumlah pembayaran tidak valid.");

    const newPayment = await PaymentReceived.create(
      {
        amount: paymentAmount,
        paymentMethod,
        paymentDate,
        reference,
        salesInvoiceId: invoice.id,
        branchId,
        customerId: invoice.customerId,
        userId: req.user.id,
      },
      { transaction: t }
    );

    const newBalanceDue = parseFloat(invoice.balanceDue) - paymentAmount;
    invoice.amountPaid = parseFloat(invoice.totalAmount) - newBalanceDue;
    invoice.balanceDue = newBalanceDue;
    invoice.status = newBalanceDue <= 0.005 ? "paid" : "partial";
    await invoice.save({ transaction: t });

    await AccountingService.postPaymentReceived(newPayment, invoice, t);

    await t.commit();
    res.status(201).json({
      message: "Pembayaran berhasil dicatat dan dijurnalkan",
      invoice,
    });
  } catch (error) {
    await t.rollback();
    const statusCode = error.message.includes("Akses ditolak") ? 403 : 400;
    res.status(statusCode).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua faktur penjualan dari cabang aktif
 * @route   GET /api/finance/invoices
 * @access  Private
 */
export const getAllInvoices = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { status } = req.query;
    let whereClause = { branchId };
    if (status) whereClause.status = status;

    const invoices = await SalesInvoice.findAll({
      where: whereClause,
      include: [{ model: Customer, attributes: ["id", "name"] }],
      order: [["issueDate", "DESC"]],
    });
    res.status(200).json(invoices);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu faktur penjualan, termasuk pajak terapan
 * @route   GET /api/finance/invoices/:id
 * @access  Private
 */
export const getInvoiceById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const invoice = await SalesInvoice.findOne({
      where: { id: req.params.id, branchId },
      include: [
        { model: Customer },
        { model: SalesOrder },
        { model: PaymentReceived },
        { model: TaxRate, as: "TaxRates" }, // Mengambil data pajak yang diterapkan
      ],
    });
    if (!invoice)
      return res
        .status(404)
        .json({ message: "Faktur tidak ditemukan di cabang ini." });
    res.status(200).json(invoice);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// --- FUNGSI SIKLUS UTANG (ACCOUNTS PAYABLE) ---

/**
 * @desc    Mencatat tagihan dari Purchase Order, menerapkan pajak, dan menjurnalkannya
 * @route   POST /api/finance/bills
 * @access  Private (Admin/Manager)
 */
export const createBillFromPurchaseOrder = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const {
      purchaseOrderId,
      supplierInvoiceNumber,
      issueDate,
      dueDate,
      taxIds = [],
    } = req.body;

    const po = await PurchaseOrder.findOne({
      where: { id: purchaseOrderId, branchId },
      transaction: t,
    });
    if (!po) throw new Error("Purchase Order tidak ditemukan di cabang ini.");
    if (po.status !== "completed")
      throw new Error(
        "Tagihan hanya bisa dibuat untuk PO yang barangnya sudah diterima."
      );

    const existingBill = await PurchaseInvoice.findOne({
      where: { purchaseOrderId },
      transaction: t,
    });
    if (existingBill)
      throw new Error("Tagihan untuk Purchase Order ini sudah pernah dibuat.");

    const subtotal = parseFloat(po.totalAmount);
    let totalTaxAmount = 0;
    const appliedTaxesData = [];

    if (taxIds.length > 0) {
      const taxes = await TaxRate.findAll({
        where: { id: taxIds, branchId },
        transaction: t,
      });
      if (taxes.length !== taxIds.length)
        throw new Error("Satu atau lebih ID pajak tidak valid.");

      for (const tax of taxes) {
        const taxAmount = subtotal * (parseFloat(tax.rate) / 100);
        totalTaxAmount += taxAmount;
        appliedTaxesData.push({ taxRateId: tax.id, taxAmount });
      }
    }

    const totalAmount = subtotal + totalTaxAmount;

    const newBill = await PurchaseInvoice.create(
      {
        supplierInvoiceNumber,
        issueDate,
        dueDate,
        purchaseOrderId,
        supplierId: po.supplierId,
        branchId,
        subtotal,
        totalTaxAmount,
        totalAmount,
        balanceDue: totalAmount,
        status: "awaiting_payment",
      },
      { transaction: t }
    );

    if (appliedTaxesData.length > 0) {
      await AppliedTax.bulkCreate(
        appliedTaxesData.map((tax) => ({
          ...tax,
          purchaseInvoiceId: newBill.id,
        })),
        { transaction: t }
      );
    }

    // await AccountingService.postPurchaseInvoice(newBill, t); // Aktifkan jika service sudah dibuat

    await t.commit();
    res
      .status(201)
      .json({ message: "Tagihan pemasok berhasil dicatat", bill: newBill });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mencatat pembayaran untuk tagihan pemasok dan menjurnalkannya
 * @route   POST /api/finance/bills/:billId/payments
 * @access  Private (Admin/Manager)
 */
export const recordPaymentForBill = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const branchId = getValidBranchId(req);
    const { billId } = req.params;
    const { amount, paymentMethod, paymentDate, reference } = req.body;

    const bill = await PurchaseInvoice.findOne({
      where: { id: billId, branchId },
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!bill)
      throw new Error("Tagihan pemasok tidak ditemukan di cabang ini.");
    if (["paid", "void"].includes(bill.status))
      throw new Error("Tagihan ini sudah lunas atau dibatalkan.");
    if (amount > bill.balanceDue)
      throw new Error("Jumlah pembayaran melebihi sisa tagihan.");

    const newPayment = await PaymentMade.create(
      {
        amount,
        paymentMethod,
        paymentDate,
        reference,
        purchaseInvoiceId: bill.id,
        branchId,
        supplierId: bill.supplierId,
        userId: req.user.id,
      },
      { transaction: t }
    );

    const newBalanceDue = parseFloat(bill.balanceDue) - parseFloat(amount);
    bill.amountPaid = parseFloat(bill.totalAmount) - newBalanceDue;
    bill.balanceDue = newBalanceDue;
    bill.status = newBalanceDue <= 0.005 ? "paid" : "partial";
    await bill.save({ transaction: t });

    // await AccountingService.postPaymentMade(newPayment, bill, t); // Aktifkan jika service sudah dibuat

    await t.commit();
    res
      .status(201)
      .json({ message: "Pembayaran tagihan berhasil dicatat", bill });
  } catch (error) {
    await t.rollback();
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan semua tagihan pemasok dari cabang aktif
 * @route   GET /api/finance/bills
 * @access  Private
 */
export const getAllBills = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { status } = req.query;
    let whereClause = { branchId };
    if (status) whereClause.status = status;

    const bills = await PurchaseInvoice.findAll({
      where: whereClause,
      include: [{ model: Supplier, attributes: ["id", "name"] }],
      order: [["issueDate", "DESC"]],
    });
    res.status(200).json(bills);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan detail satu tagihan pemasok
 * @route   GET /api/finance/bills/:id
 * @access  Private
 */
export const getBillById = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const bill = await PurchaseInvoice.findOne({
      where: { id: req.params.id, branchId },
      include: [
        { model: Supplier },
        { model: PurchaseOrder },
        { model: PaymentMade },
        { model: TaxRate, as: "TaxRates" },
      ],
    });
    if (!bill)
      return res
        .status(404)
        .json({ message: "Tagihan pemasok tidak ditemukan di cabang ini." });
    res.status(200).json(bill);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
