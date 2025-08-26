import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const AppliedTax = sequelize.define(
  "AppliedTax",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    taxAmount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      comment: "Jumlah nominal pajak yang dihitung",
    },
    // Foreign keys: salesInvoiceId, purchaseInvoiceId, taxRateId
  },
  { timestamps: false }
);

export default AppliedTax;
