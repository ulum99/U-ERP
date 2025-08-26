import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Supplier = sequelize.define(
  "Supplier",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    contactPerson: {
      type: DataTypes.STRING,
    },
    email: {
      type: DataTypes.STRING,
      validate: {
        isEmail: true,
      },
    },
    phone: {
      type: DataTypes.STRING,
    },
    address: {
      type: DataTypes.TEXT,
    },
    // --- PENAMBAHAN UNTUK MULTI-BRANCH ---
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "branchId"], // Nama pemasok harus unik per cabang
      },
    ],
  }
);

export default Supplier;
