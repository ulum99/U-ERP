import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const Account = sequelize.define(
  "Account",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    accountNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Nomor akun unik untuk identifikasi, misal: 1110, 4100",
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Nama akun, misal: Kas di Bank, Pendapatan Penjualan",
    },
    type: {
      type: DataTypes.ENUM(
        "ASSET",
        "LIABILITY",
        "EQUITY",
        "REVENUE",
        "EXPENSE"
      ),
      allowNull: false,
      comment: "Tipe akun sesuai standar akuntansi",
    },

    // --- PENAMBAHAN KOLOM YANG HILANG ---
    // Kolom ini wajib didefinisikan agar Sequelize bisa membuatnya di database
    branchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Branches", // Merujuk ke tabel 'Branches'
        key: "id",
      },
    },
  },
  {
    timestamps: false,
    indexes: [
      {
        unique: true,
        fields: ["accountNumber", "branchId"], // Membuat nomor akun unik per cabang
        name: "accounts_account_number_branch_id_unique",
      },
    ],
  }
);

export default Account;
