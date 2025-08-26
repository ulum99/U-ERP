import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Product = sequelize.define(
  "Product",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    sku: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: "Kuantitas stok, hanya relevan untuk tipe STOCKABLE",
    },

    // --- PERUBAHAN & PENAMBAHAN ---
    sellingPrice: {
      // Mengganti nama dari 'price'
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Harga Jual Standar",
    },
    costPrice: {
      // Kolom baru untuk Harga Beli
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      defaultValue: 0.0,
      comment: "Harga Beli Standar / Modal Terakhir",
    },
    productType: {
      // Kolom baru untuk Tipe Produk
      type: DataTypes.ENUM("STOCKABLE", "SERVICE", "CONSUMABLE"),
      allowNull: false,
      defaultValue: "STOCKABLE",
    },
    // -----------------------------

    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    productCategoryId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    unitOfMeasureId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["sku", "branchId"],
      },
    ],
  }
);

export default Product;
