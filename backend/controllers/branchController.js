import db from "../models/index.js";
const { Branch } = db;

export const getAllBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({ order: [["name", "ASC"]] });
    res.status(200).json(branches);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};
