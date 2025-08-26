import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const JournalEntryLine = sequelize.define(
  "JournalEntryLine",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.ENUM("DEBIT", "CREDIT"),
      allowNull: false,
    },
    amount: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
      validate: {
        isDecimal: true,
        min: 0,
      },
    },
    // --- Definisi Foreign Key ---
    journalEntryId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "JournalEntries",
        key: "id",
      },
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Accounts",
        key: "id",
      },
    },
  },
  {
    timestamps: false,
  }
);

export default JournalEntryLine;
