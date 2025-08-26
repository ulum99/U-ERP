import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import sequelize from "./config/database.js";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import productRoutes from "./routes/productRoutes.js";
import customerRoutes from "./routes/customerRoutes.js";
import supplierRoutes from "./routes/supplierRoutes.js";
import salesOrderRoutes from "./routes/salesOrderRoutes.js";
import purchaseOrderRoutes from "./routes/purchaseOrderRoutes.js";
import inventoryRoutes from "./routes/inventoryRoutes.js";
import financeRoutes from "./routes/financeRoutes.js";
import reportingRoutes from "./routes/reportingRoutes.js";
import taxRateRoutes from "./routes/taxRatedRoutes.js";
import accountRoutes from "./routes/accountRoutes.js";
import productCategoryRoutes from "./routes/productCategoryRoutes.js";
import unitOfMeasureRoutes from "./routes/unitOfMeasureRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import settingRoutes from "./routes/settingRoutes.js";

// Load env variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors()); // Mengizinkan cross-origin requests
app.use(express.json()); // Mem-parse body request sebagai JSON
app.use(express.urlencoded({ extended: true }));

// Routes
app.get("/", (req, res) => {
  res.send("🚀 ERP Backend API is running successfully!");
});

app.use("/api/auth", authRoutes);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/sales-orders", salesOrderRoutes);
app.use("/api/purchase-orders", purchaseOrderRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/finance", financeRoutes);
app.use("/api/reports", reportingRoutes);
app.use("/api/tax-rates", taxRateRoutes);
app.use("/api/accounts", accountRoutes);
app.use("/api/product-categories", productCategoryRoutes);
app.use("/api/units-of-measure", unitOfMeasureRoutes);
app.use("/api/users", userRoutes);
app.use("/api/branches", branchRoutes);
app.use("/api/settings", settingRoutes);

// Sinkronisasi database dan jalankan server
const startServer = async () => {
  try {
    await sequelize.sync({ alter: true }); // 'alter: true' akan mencoba update tabel jika model berubah
    console.log("✅ Database connected and synchronized successfully.");
    app.listen(PORT, () => {
      console.log(`📡 Server is listening on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(
      "❌ Unable to connect to the database or start the server:",
      error
    );
  }
};

startServer();
