import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Branch = sequelize.define(
  "Branch",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    address: {
      type: DataTypes.TEXT,
    },
    phone: {
      type: DataTypes.STRING,
    },
  },
  { timestamps: true }
);

export default Branch;
