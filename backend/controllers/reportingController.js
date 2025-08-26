import db from "../models/index.js";
import { Op } from "sequelize";

const {
  SalesOrder,
  SalesOrderDetail,
  Product,
  SalesInvoice,
  PurchaseInvoice,
  sequelize,
} = db;

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
 * @desc    Menyediakan ringkasan penjualan untuk dashboard
 * @route   GET /api/reports/sales-summary
 * @access  Private (Manager/Admin)
 * @header  X-Branch-ID
 * @query   ?days=30 (opsional, default 30 hari terakhir)
 */
export const getSalesSummary = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const days = parseInt(req.query.days || 30, 10);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Menghitung total pendapatan (revenue)
    const totalRevenue = await SalesInvoice.sum("totalAmount", {
      where: {
        branchId,
        status: { [Op.notIn]: ["void", "draft"] }, // Jangan hitung invoice batal/draft
        issueDate: { [Op.gte]: startDate },
      },
    });

    // Menghitung jumlah pesanan
    const totalOrders = await SalesOrder.count({
      where: {
        branchId,
        orderDate: { [Op.gte]: startDate },
      },
    });

    res.status(200).json({
      periodDays: days,
      totalRevenue: totalRevenue || 0,
      totalOrders: totalOrders || 0,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Menampilkan produk terlaris berdasarkan kuantitas
 * @route   GET /api/reports/top-selling-products
 * @access  Private
 * @header  X-Branch-ID
 * @query   ?limit=5 (opsional, default 5)
 */
export const getTopSellingProducts = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const limit = parseInt(req.query.limit || 5, 10);

    const topProducts = await SalesOrderDetail.findAll({
      attributes: [
        "productId",
        // Beri tahu Sequelize untuk menggunakan kolom 'quantity' dari model SalesOrderDetail
        [
          sequelize.fn("SUM", sequelize.col("SalesOrderDetail.quantity")),
          "totalQuantitySold",
        ],
      ],
      include: [
        {
          model: SalesOrder,
          where: { branchId }, // Pastikan order berasal dari cabang yang benar
          attributes: [],
        },
        {
          model: Product,
          attributes: ["name", "sku"],
        },
      ],
      group: ["productId", "Product.id"],
      order: [
        [
          sequelize.fn("SUM", sequelize.col("SalesOrderDetail.quantity")),
          "DESC",
        ],
      ],
      limit: limit,
      raw: true, // Untuk hasil yang lebih bersih
      nest: true,
    });

    res.status(200).json(topProducts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Memberikan snapshot keuangan (total piutang dan utang)
 * @route   GET /api/reports/financial-snapshot
 * @access  Private (Manager/Admin)
 * @header  X-Branch-ID
 */
export const getFinancialSnapshot = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);

    // Menghitung total piutang (uang yang akan diterima)
    const totalReceivables = await SalesInvoice.sum("balanceDue", {
      where: {
        branchId,
        status: { [Op.in]: ["sent", "partial"] },
      },
    });

    // Menghitung total utang (uang yang harus dibayar)
    const totalPayables = await PurchaseInvoice.sum("balanceDue", {
      where: {
        branchId,
        status: { [Op.in]: ["awaiting_payment", "partial"] },
      },
    });

    res.status(200).json({
      accountsReceivable: totalReceivables || 0,
      accountsPayable: totalPayables || 0,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Mendapatkan daftar produk yang stoknya menipis
 * @route   GET /api/reports/low-stock-products
 * @access  Private
 * @header  X-Branch-ID
 * @query   ?threshold=10 (opsional, default 10)
 */
export const getLowStockProducts = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const threshold = parseInt(req.query.threshold || 10, 10);

    const lowStockProducts = await Product.findAll({
      where: {
        branchId,
        quantity: { [Op.lte]: threshold }, // lte = Less Than or Equal
      },
      order: [["quantity", "ASC"]],
    });

    res.status(200).json(lowStockProducts);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Menyediakan laporan buku besar untuk satu akun
 * @route   GET /api/reports/general-ledger
 * @access  Private (Manager/Admin)
 * @header  X-Branch-ID
 * @query   ?accountId=1&startDate=2025-08-01&endDate=2025-08-31
 */
export const getGeneralLedger = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { accountId, startDate, endDate } = req.query;

    if (!accountId || !startDate || !endDate) {
      return res.status(400).json({
        message: "Parameter accountId, startDate, dan endDate wajib diisi.",
      });
    }

    const account = await Account.findOne({
      where: { id: accountId, branchId },
    });
    if (!account) {
      return res
        .status(404)
        .json({ message: "Akun tidak ditemukan di cabang ini." });
    }

    // 1. Hitung Saldo Awal (Beginning Balance)
    const beginningBalanceResult = await JournalEntryLine.findAll({
      attributes: [
        [
          sequelize.fn(
            "SUM",
            sequelize.literal(
              "CASE WHEN type = 'DEBIT' THEN amount ELSE -amount END"
            )
          ),
          "balance",
        ],
      ],
      include: [
        {
          model: JournalEntry,
          attributes: [],
          where: {
            branchId,
            date: { [Op.lt]: startDate }, // Kurang dari tanggal mulai
          },
        },
      ],
      where: { accountId },
      raw: true,
    });
    const beginningBalance = parseFloat(
      beginningBalanceResult[0]?.balance || 0
    );

    // 2. Ambil Transaksi dalam Periode
    const transactions = await JournalEntryLine.findAll({
      include: [
        {
          model: JournalEntry,
          where: {
            branchId,
            date: { [Op.between]: [startDate, endDate] },
          },
        },
      ],
      where: { accountId },
      order: [[JournalEntry, "date", "ASC"]],
    });

    res.status(200).json({
      account,
      beginningBalance,
      transactions,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Menyediakan laporan Neraca Saldo (Trial Balance)
 * @route   GET /api/reports/trial-balance
 * @access  Private (Manager/Admin)
 * @header  X-Branch-ID
 * @query   ?endDate=2025-08-31
 */
export const getTrialBalance = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { endDate } = req.query;

    if (!endDate) {
      return res
        .status(400)
        .json({ message: "Parameter endDate wajib diisi." });
    }

    // Query ini akan menghitung saldo akhir untuk setiap akun hingga tanggal yang ditentukan
    const balances = await Account.findAll({
      attributes: [
        "id",
        "accountNumber",
        "name",
        "type",
        [
          sequelize.literal(`(
                        SELECT COALESCE(SUM(CASE WHEN line.type = 'DEBIT' THEN line.amount ELSE -line.amount END), 0)
                        FROM JournalEntryLines AS line
                        JOIN JournalEntries AS entry ON line.journalEntryId = entry.id
                        WHERE line.accountId = Account.id
                        AND entry.branchId = ${branchId}
                        AND entry.date <= '${endDate}'
                    )`),
          "balance",
        ],
      ],
      where: { branchId },
      group: ["Account.id"],
      having: sequelize.literal("balance != 0"), // Hanya tampilkan akun yang memiliki saldo
      order: [["accountNumber", "ASC"]],
      raw: true,
    });

    // Proses data untuk memisahkan debit dan kredit
    const trialBalance = balances.map((acc) => {
      const balance = parseFloat(acc.balance);
      const isDebitNormal = ["ASSET", "EXPENSE"].includes(acc.type);

      return {
        ...acc,
        debit: isDebitNormal
          ? balance > 0
            ? balance
            : 0
          : balance < 0
          ? -balance
          : 0,
        credit: isDebitNormal
          ? balance < 0
            ? -balance
            : 0
          : balance > 0
          ? balance
          : 0,
      };
    });

    res.status(200).json(trialBalance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Menyediakan Laporan Laba Rugi (Profit and Loss)
 * @route   GET /api/reports/profit-and-loss
 * @access  Private (Manager/Admin)
 * @header  X-Branch-ID
 * @query   ?startDate=2025-08-01&endDate=2025-08-31
 */
export const getProfitAndLoss = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Parameter startDate dan endDate wajib diisi." });
    }

    const fetchAccountsByType = async (type) => {
      return Account.findAll({
        attributes: [
          "id",
          "accountNumber",
          "name",
          [
            sequelize.literal(`(
                            SELECT COALESCE(SUM(CASE WHEN line.type = 'DEBIT' THEN amount ELSE -amount END), 0)
                            FROM JournalEntryLines AS line
                            JOIN JournalEntries AS entry ON line.journalEntryId = entry.id
                            WHERE line.accountId = Account.id
                            AND entry.branchId = ${branchId}
                            AND entry.date BETWEEN '${startDate}' AND '${endDate}'
                        )`),
            "total",
          ],
        ],
        where: { branchId, type },
        having: sequelize.literal("total != 0"),
        raw: true,
      });
    };

    const revenues = await fetchAccountsByType("REVENUE");
    const expenses = await fetchAccountsByType("EXPENSE");

    // Akun pendapatan normalnya memiliki saldo kredit (negatif dalam perhitungan kita)
    const totalRevenue =
      revenues.reduce((sum, acc) => sum + parseFloat(acc.total), 0) * -1;
    // Akun beban normalnya memiliki saldo debit (positif dalam perhitungan kita)
    const totalExpense = expenses.reduce(
      (sum, acc) => sum + parseFloat(acc.total),
      0
    );

    const netProfit = totalRevenue - totalExpense;

    res.status(200).json({
      period: { startDate, endDate },
      revenues: revenues.map((r) => ({
        ...r,
        total: parseFloat(r.total) * -1,
      })), // Jadikan positif untuk display
      totalRevenue,
      expenses: expenses.map((e) => ({ ...e, total: parseFloat(e.total) })),
      totalExpense,
      netProfit,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

/**
 * @desc    Menyediakan Laporan Neraca (Balance Sheet)
 * @route   GET /api/reports/balance-sheet
 * @access  Private (Manager/Admin)
 * @header  X-Branch-ID
 * @query   ?asOfDate=2025-08-31
 */
export const getBalanceSheet = async (req, res) => {
  try {
    const branchId = getValidBranchId(req);
    const { asOfDate } = req.query;

    if (!asOfDate) {
      return res
        .status(400)
        .json({ message: "Parameter asOfDate wajib diisi." });
    }

    const fetchAccountsBalance = async (types) => {
      return Account.findAll({
        attributes: [
          "id",
          "accountNumber",
          "name",
          "type",
          [
            sequelize.literal(`(
                            SELECT COALESCE(SUM(CASE WHEN line.type = 'DEBIT' THEN line.amount ELSE -line.amount END), 0)
                            FROM JournalEntryLines AS line
                            JOIN JournalEntries AS entry ON line.journalEntryId = entry.id
                            WHERE line.accountId = Account.id
                            AND entry.branchId = ${branchId}
                            AND entry.date <= '${asOfDate}'
                        )`),
            "balance",
          ],
        ],
        where: { branchId, type: { [Op.in]: types } },
        group: ["Account.id"],
        having: sequelize.literal("balance != 0"),
        raw: true,
      });
    };

    const assets = await fetchAccountsBalance(["ASSET"]);
    const liabilities = await fetchAccountsBalance(["LIABILITY"]);
    const equity = await fetchAccountsBalance(["EQUITY"]);

    // Saldo normal Kewajiban & Ekuitas adalah kredit (negatif), kita buat positif untuk display
    const totalAssets = assets.reduce(
      (sum, acc) => sum + parseFloat(acc.balance),
      0
    );
    const totalLiabilities =
      liabilities.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) * -1;
    const totalEquity =
      equity.reduce((sum, acc) => sum + parseFloat(acc.balance), 0) * -1;

    res.status(200).json({
      asOfDate,
      assets: assets.map((a) => ({ ...a, balance: parseFloat(a.balance) })),
      liabilities: liabilities.map((l) => ({
        ...l,
        balance: parseFloat(l.balance) * -1,
      })),
      equity: equity.map((e) => ({
        ...e,
        balance: parseFloat(e.balance) * -1,
      })),
      totalAssets,
      totalLiabilities,
      totalEquity,
      totalLiabilitiesAndEquity: totalLiabilities + totalEquity,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
