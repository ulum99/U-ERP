import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SalesOrder = sequelize.define(
  "SalesOrder",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    orderDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
    status: {
      type: DataTypes.ENUM("pending", "completed", "cancelled"),
      defaultValue: "pending",
    },
    totalAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // --- PENAMBAHAN UNTUK MULTI-BRANCH ---
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  { timestamps: true }
);

export default SalesOrder;
