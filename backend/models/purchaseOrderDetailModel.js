// models/purchaseOrderDetailModel.js
import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const PurchaseOrderDetail = sequelize.define(
  "PurchaseOrderDetail",
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
    // Harga beli (cost price) produk saat itu
    price: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
    // Foreign keys untuk PurchaseOrder dan Product akan ditambahkan melalui relasi
  },
  {
    timestamps: false, // Detail tabel biasanya tidak memerlukan timestamps
  }
);

export default PurchaseOrderDetail;
