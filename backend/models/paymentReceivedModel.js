import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PaymentReceived = sequelize.define(
  "PaymentReceived",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM("bank_transfer", "cash", "credit_card", "other"),
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING, // No. referensi transfer, dll.
      allowNull: true,
    },
    // Relasi ke salesInvoiceId, customerId, branchId, userId akan ditambahkan
  },
  { timestamps: true }
);

export default PaymentReceived;
