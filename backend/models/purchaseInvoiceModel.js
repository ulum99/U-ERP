import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PurchaseInvoice = sequelize.define(
  "PurchaseInvoice",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    supplierInvoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Nomor faktur dari pemasok",
    },
    issueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Tanggal faktur diterbitkan oleh pemasok",
    },
    dueDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    subtotal: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Total sebelum pajak",
    },
    totalTaxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Akumulasi dari semua pajak yang diterapkan",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    amountPaid: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
    },
    balanceDue: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM(
        "draft",
        "awaiting_payment",
        "partial",
        "paid",
        "void"
      ),
      defaultValue: "draft",
      allowNull: false,
    },
    // Relasi ke branchId, purchaseOrderId, supplierId
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["supplierInvoiceNumber", "supplierId"], // No faktur harus unik per pemasok
      },
    ],
  }
);

export default PurchaseInvoice;
