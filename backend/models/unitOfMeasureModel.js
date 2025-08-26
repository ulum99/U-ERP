import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UnitOfMeasure = sequelize.define(
  "UnitOfMeasure",
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
    symbol: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [
      { unique: true, fields: ["name", "branchId"] },
      { unique: true, fields: ["symbol", "branchId"] },
    ],
  }
);

export default UnitOfMeasure;
