// models/purchaseOrderModel.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PurchaseOrder = sequelize.define(
  "PurchaseOrder",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    // Status untuk melacak proses, misal: 'dipesan', 'diterima sebagian', 'selesai'
    status: {
      type: DataTypes.ENUM(
        "ordered",
        "partially_received",
        "completed",
        "cancelled"
      ),
      defaultValue: "ordered",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Foreign key untuk pemasok (supplier) akan ditambahkan melalui relasi
  },
  {
    timestamps: true,
  }
);

export default PurchaseOrder;
