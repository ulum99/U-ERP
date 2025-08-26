import { Sequelize } from "sequelize";
import sequelize from "../config/database.js";

// Impor semua file model yang telah kita buat
import Branch from "./branchModel.js";
import User from "./userModel.js";
import UserBranchAccess from "./userBranchAccessModel.js";
import Product from "./productModel.js";
import Customer from "./customerModel.js";
import Supplier from "./supplierModel.js";
import SalesOrder from "./salesOrderModel.js";
import SalesOrderDetail from "./salesOrderDetailModel.js";
import PurchaseOrder from "./purchaseOrderModel.js";
import PurchaseOrderDetail from "./purchaseOrderDetailModel.js";
import InventoryMovement from "./inventoryMovementModel.js";
import SalesInvoice from "./salesInvoiceModel.js";
import PaymentReceived from "./paymentReceivedModel.js";
import PurchaseInvoice from "./purchaseInvoiceModel.js";
import PaymentMade from "./paymentMadeModel.js";
import Account from "./accountModel.js";
import JournalEntry from "./journalEntryModel.js";
import JournalEntryLine from "./journalEntryLineModel.js";
import TaxRate from "./taxRateModel.js";
import AppliedTax from "./appliedTaxModel.js";
import ProductCategory from "./productCategoryModel.js";
import UnitOfMeasure from "./unitOfMeasureModel.js";
import Setting from "./settingModel.js";

// Inisialisasi objek database
const db = {};
db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Daftarkan semua model ke objek db
db.Branch = Branch;
db.User = User;
db.UserBranchAccess = UserBranchAccess;
db.Product = Product;
db.Customer = Customer;
db.Supplier = Supplier;
db.SalesOrder = SalesOrder;
db.SalesOrderDetail = SalesOrderDetail;
db.PurchaseOrder = PurchaseOrder;
db.PurchaseOrderDetail = PurchaseOrderDetail;
db.InventoryMovement = InventoryMovement;
db.SalesInvoice = SalesInvoice;
db.PaymentReceived = PaymentReceived;
db.PurchaseInvoice = PurchaseInvoice;
db.PaymentMade = PaymentMade;
db.Account = Account;
db.JournalEntry = JournalEntry;
db.JournalEntryLine = JournalEntryLine;
db.TaxRate = TaxRate;
db.AppliedTax = AppliedTax;
db.ProductCategory = ProductCategory;
db.UnitOfMeasure = UnitOfMeasure;
db.Setting = Setting;

// --- DEFINISI RELASI (ASSOCIATIONS) ---
// Bagian ini adalah jantung dari struktur data Anda.

// ## Relasi Inti & Multi-Cabang ##
// User <--> Branch (Many-to-Many)
db.User.belongsToMany(db.Branch, {
  through: db.UserBranchAccess,
  foreignKey: "userId",
});
db.Branch.belongsToMany(db.User, {
  through: db.UserBranchAccess,
  foreignKey: "branchId",
});

// Branch -> Data (One-to-Many)
db.Branch.hasMany(db.Product, { foreignKey: "branchId" });
db.Product.belongsTo(db.Branch, { foreignKey: "branchId" });

db.Branch.hasMany(db.Customer, { foreignKey: "branchId" });
db.Customer.belongsTo(db.Branch, { foreignKey: "branchId" });

db.Branch.hasMany(db.Supplier, { foreignKey: "branchId" });
db.Supplier.belongsTo(db.Branch, { foreignKey: "branchId" });

// ## Relasi Siklus Penjualan (Sales) ##
db.Customer.hasMany(db.SalesOrder, { foreignKey: "customerId" });
db.SalesOrder.belongsTo(db.Customer, { foreignKey: "customerId" });

db.User.hasMany(db.SalesOrder, { foreignKey: "userId" });
db.SalesOrder.belongsTo(db.User, { foreignKey: "userId" });

db.Branch.hasMany(db.SalesOrder, { foreignKey: "branchId" });
db.SalesOrder.belongsTo(db.Branch, { foreignKey: "branchId" });

db.SalesOrder.hasMany(db.SalesOrderDetail, {
  as: "details",
  foreignKey: "salesOrderId",
});
db.SalesOrderDetail.belongsTo(db.SalesOrder, { foreignKey: "salesOrderId" });

db.Product.hasMany(db.SalesOrderDetail, { foreignKey: "productId" });
db.SalesOrderDetail.belongsTo(db.Product, { foreignKey: "productId" });

// ## Relasi Siklus Pembelian (Purchasing) ##
db.Supplier.hasMany(db.PurchaseOrder, { foreignKey: "supplierId" });
db.PurchaseOrder.belongsTo(db.Supplier, { foreignKey: "supplierId" });

db.Branch.hasMany(db.PurchaseOrder, { foreignKey: "branchId" });
db.PurchaseOrder.belongsTo(db.Branch, { foreignKey: "branchId" });

db.PurchaseOrder.hasMany(db.PurchaseOrderDetail, {
  as: "details",
  foreignKey: "purchaseOrderId",
});
db.PurchaseOrderDetail.belongsTo(db.PurchaseOrder, {
  foreignKey: "purchaseOrderId",
});

db.Product.hasMany(db.PurchaseOrderDetail, { foreignKey: "productId" });
db.PurchaseOrderDetail.belongsTo(db.Product, { foreignKey: "productId" });

// ## Relasi Inventaris (Inventory) ##
db.Product.hasMany(db.InventoryMovement, { foreignKey: "productId" });
db.InventoryMovement.belongsTo(db.Product, { foreignKey: "productId" });

db.Branch.hasMany(db.InventoryMovement, { foreignKey: "branchId" });
db.InventoryMovement.belongsTo(db.Branch, { foreignKey: "branchId" });

db.User.hasMany(db.InventoryMovement, { foreignKey: "userId" });
db.InventoryMovement.belongsTo(db.User, { foreignKey: "userId" });

// ## Relasi Keuangan (Piutang Usaha / Accounts Receivable) ##
db.SalesOrder.hasOne(db.SalesInvoice, { foreignKey: "salesOrderId" }); // Satu SO -> Satu Invoice
db.SalesInvoice.belongsTo(db.SalesOrder, { foreignKey: "salesOrderId" });

db.SalesInvoice.hasMany(db.PaymentReceived, { foreignKey: "salesInvoiceId" });
db.PaymentReceived.belongsTo(db.SalesInvoice, { foreignKey: "salesInvoiceId" });

db.Customer.hasMany(db.SalesInvoice, { foreignKey: "customerId" });
db.SalesInvoice.belongsTo(db.Customer, { foreignKey: "customerId" });

db.Branch.hasMany(db.SalesInvoice, { foreignKey: "branchId" });
db.SalesInvoice.belongsTo(db.Branch, { foreignKey: "branchId" });

db.PaymentReceived.belongsTo(db.User, { foreignKey: "userId" }); // User pencatat pembayaran
db.PaymentReceived.belongsTo(db.Branch, { foreignKey: "branchId" });

// ## Relasi Keuangan (Utang Usaha / Accounts Payable) ##
db.PurchaseOrder.hasOne(db.PurchaseInvoice, { foreignKey: "purchaseOrderId" });
db.PurchaseInvoice.belongsTo(db.PurchaseOrder, {
  foreignKey: "purchaseOrderId",
});

db.PurchaseInvoice.hasMany(db.PaymentMade, { foreignKey: "purchaseInvoiceId" });
db.PaymentMade.belongsTo(db.PurchaseInvoice, {
  foreignKey: "purchaseInvoiceId",
});

db.Supplier.hasMany(db.PurchaseInvoice, { foreignKey: "supplierId" });
db.PurchaseInvoice.belongsTo(db.Supplier, { foreignKey: "supplierId" });

db.Branch.hasMany(db.PurchaseInvoice, { foreignKey: "branchId" });
db.PurchaseInvoice.belongsTo(db.Branch, { foreignKey: "branchId" });

db.PaymentMade.belongsTo(db.User, { foreignKey: "userId" });
db.PaymentMade.belongsTo(db.Branch, { foreignKey: "branchId" });

// ## Relasi Akuntansi (General Ledger) ##
db.Branch.hasMany(db.Account, { foreignKey: "branchId" }); // Opsional jika akun per cabang
db.Account.belongsTo(db.Branch, { foreignKey: "branchId" });

db.Branch.hasMany(db.JournalEntry, { foreignKey: "branchId" });
db.JournalEntry.belongsTo(db.Branch, { foreignKey: "branchId" });

db.JournalEntry.hasMany(db.JournalEntryLine, {
  as: "lines",
  foreignKey: "journalEntryId",
});
db.JournalEntryLine.belongsTo(db.JournalEntry, {
  foreignKey: "journalEntryId",
});

db.Account.hasMany(db.JournalEntryLine, { foreignKey: "accountId" });
db.JournalEntryLine.belongsTo(db.Account, { foreignKey: "accountId" });

// ## Relasi Pajak (Tax) ##
db.TaxRate.belongsTo(db.Branch, { foreignKey: "branchId" });
db.Branch.hasMany(db.TaxRate, { foreignKey: "branchId" });

// Relasi SalesInvoice <--> TaxRate
db.SalesInvoice.belongsToMany(db.TaxRate, {
  through: db.AppliedTax,
  foreignKey: "salesInvoiceId",
});
db.TaxRate.belongsToMany(db.SalesInvoice, {
  through: db.AppliedTax,
  foreignKey: "taxRateId",
});

// Relasi PurchaseInvoice <--> TaxRate
db.PurchaseInvoice.belongsToMany(db.TaxRate, {
  through: db.AppliedTax,
  foreignKey: "purchaseInvoiceId",
});
db.TaxRate.belongsToMany(db.PurchaseInvoice, {
  through: db.AppliedTax,
  foreignKey: "taxRateId",
});

// ## Relasi Kategori & Satuan Produk ##
db.Branch.hasMany(db.ProductCategory, { foreignKey: "branchId" });
db.ProductCategory.belongsTo(db.Branch, { foreignKey: "branchId" });

db.Branch.hasMany(db.UnitOfMeasure, { foreignKey: "branchId" });
db.UnitOfMeasure.belongsTo(db.Branch, { foreignKey: "branchId" });

db.ProductCategory.hasMany(db.Product, { foreignKey: "productCategoryId" });
db.Product.belongsTo(db.ProductCategory, {
  as: "category",
  foreignKey: "productCategoryId",
});

db.UnitOfMeasure.hasMany(db.Product, { foreignKey: "unitOfMeasureId" });
db.Product.belongsTo(db.UnitOfMeasure, {
  as: "uom",
  foreignKey: "unitOfMeasureId",
});

// Ekspor objek db yang sudah lengkap
export default db;
