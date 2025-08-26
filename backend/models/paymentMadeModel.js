import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PaymentMade = sequelize.define(
  "PaymentMade",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    paymentDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    paymentMethod: {
      type: DataTypes.ENUM("bank_transfer", "cash", "other"),
      allowNull: false,
    },
    reference: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Relasi ke purchaseInvoiceId, supplierId, branchId, userId
  },
  { timestamps: true }
);

export default PaymentMade;
