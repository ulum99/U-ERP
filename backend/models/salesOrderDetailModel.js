// models/salesOrderDetailModel.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const SalesOrderDetail = sequelize.define(
  "SalesOrderDetail",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    price: {
      // Harga saat penjualan
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  { timestamps: false }
);

export default SalesOrderDetail;
