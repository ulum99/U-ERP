import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const UserBranchAccess = sequelize.define(
  "UserBranchAccess",
  {
    userId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
    branchId: {
      type: DataTypes.INTEGER,
      primaryKey: true,
    },
  },
  { timestamps: false }
);

export default UserBranchAccess;
