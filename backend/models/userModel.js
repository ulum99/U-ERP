import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const User = sequelize.define(
  "User",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: "Username untuk login, harus unik.",
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true,
      },
      comment: "Email pengguna, harus unik dan valid.",
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: "Password yang sudah di-hash.",
    },
    role: {
      type: DataTypes.ENUM("admin", "manager", "staff", "superuser"),
      defaultValue: "staff",
      allowNull: false,
      comment: "Peran pengguna untuk menentukan hak akses.",
    },
  },
  {
    timestamps: true,
  }
);

export default User;
