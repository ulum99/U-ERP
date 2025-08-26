import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProductCategory = sequelize.define(
  "ProductCategory",
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
    description: {
      type: DataTypes.TEXT,
    },
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    timestamps: true,
    indexes: [{ unique: true, fields: ["name", "branchId"] }],
  }
);

export default ProductCategory;
