import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Customer = sequelize.define(
  "Customer",
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
    email: {
      type: DataTypes.STRING,
      validate: { isEmail: true },
    },
    phone: {
      type: DataTypes.STRING,
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
        fields: ["email", "branchId"], // Email pelanggan unik per cabang
      },
    ],
  }
);

export default Customer;
