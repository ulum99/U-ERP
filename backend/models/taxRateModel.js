import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const TaxRate = sequelize.define(
  "TaxRate",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Nama pajak, misal: PPN, PPh 23",
    },
    rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      comment: "Tarif pajak dalam persen, misal: 11.00 untuk 11%",
    },
    // Relasi ke branchId
  },
  {
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["name", "branchId"],
      },
    ],
  }
);

export default TaxRate;
