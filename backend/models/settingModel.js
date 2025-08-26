import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Setting = sequelize.define(
  "Setting",
  {
    key: {
      type: DataTypes.STRING,
      primaryKey: true,
      comment: "Kunci pengaturan, misal: company_name",
    },
    value: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: "Nilai dari pengaturan",
    },
    branchId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  { timestamps: false }
);

export default Setting;
