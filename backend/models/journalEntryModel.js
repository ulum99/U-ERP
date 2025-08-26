import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const JournalEntry = sequelize.define(
  "JournalEntry",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: "Tanggal transaksi jurnal",
    },
    notes: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Deskripsi atau memo untuk entri jurnal",
    },
    referenceType: {
      type: DataTypes.STRING,
      allowNull: true,
      comment: "Tipe dokumen sumber, misal: SALES_INVOICE",
    },
    referenceId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: "ID dokumen sumber, misal: ID dari Sales Invoice terkait",
    },
    // --- Definisi Kolom branchId ---
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Branches",
        key: "id",
      },
    },
  },
  {
    timestamps: true,
  }
);

export default JournalEntry;
