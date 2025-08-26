import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SalesInvoice = sequelize.define(
  "SalesInvoice",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    invoiceNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // Sebaiknya unik per cabang, diatur di level database/controller
    },
    issueDate: {
      type: DataTypes.DATEONLY, // Hanya tanggal, tanpa waktu
      allowNull: false,
      defaultValue: DataTypes.NOW,
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
      type: DataTypes.ENUM("draft", "sent", "partial", "paid", "void"),
      defaultValue: "draft",
      allowNull: false,
    },
    // Relasi ke branchId, salesOrderId, customerId akan ditambahkan di index.js
  },
  { timestamps: true }
);

export default SalesInvoice;
