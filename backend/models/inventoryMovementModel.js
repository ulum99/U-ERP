import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const InventoryMovement = sequelize.define(
  "InventoryMovement",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM(
        "PURCHASE_RECEIPT", // Penerimaan dari pembelian
        "SALES_SHIPMENT", // Pengiriman untuk penjualan
        "ADJUSTMENT_IN", // Penyesuaian masuk (stok opname)
        "ADJUSTMENT_OUT", // Penyesuaian keluar (rusak/hilang)
        "INITIAL_STOCK" // Stok awal saat produk dibuat
      ),
      allowNull: false,
    },
    quantityChange: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Positif untuk stok masuk, negatif untuk stok keluar",
    },
    quantityAfter: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: "Jumlah stok produk setelah pergerakan ini terjadi",
    },
    referenceId: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "ID dokumen referensi (misal: sales_order_id atau po_id)",
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // branchId dan productId akan ditambahkan melalui relasi
  },
  {
    timestamps: true,
    updatedAt: false, // Pergerakan stok tidak seharusnya di-update
  }
);

export default InventoryMovement;
