// src/App.jsx

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Customers from './pages/Customers'; 
import SalesOrders from './pages/SalesOrders';
import SalesInvoices from './pages/SalesInvoices';
import PurchaseInvoices from './pages/PurchaseInvoices';
import Suppliers from './pages/Suppliers'
import PurchaseOrders from './pages/PurchaseOrders'
import ChartOfAccounts from './pages/ChartOfAccounts';
import GeneralLedger from './pages/GeneralLedger';
import TrialBalance from './pages/TrialBalance';
import ProfitAndLoss from './pages/ProfitAndLoss';
import BalanceSheet from './pages/BalanceSheet';
import TaxRates from './pages/TaxRates';
import ProductCategories from './pages/ProductCategories';
import UnitOfMeasures from './pages/UnitOfMeasures';
import Users from './pages/Users';
import Settings from './pages/Settings.jsx';

import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';



function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/products" element={<Products />} />
              <Route path="/customers" element={<Customers />} /> 
              <Route path="/sales-orders" element={<SalesOrders />} />
              <Route path="/sales-invoices" element={<SalesInvoices />} />
              <Route path="/purchase-invoices" element={<PurchaseInvoices />} />
              <Route path="/suppliers" element={<Suppliers />} />
              <Route path="/purchase-orders" element={<PurchaseOrders />} />
              <Route path="/chart-of-accounts" element={<ChartOfAccounts />} />
              <Route path="/general-ledger" element={<GeneralLedger />} />
              <Route path="/trial-balance" element={<TrialBalance />} />
              <Route path="/profit-and-loss" element={<ProfitAndLoss />} />
              <Route path="/balance-sheet" element={<BalanceSheet />} />
              <Route path="/tax-rates" element={<TaxRates />} />
              <Route path="/product-categories" element={<ProductCategories />} />
              <Route path="/units-of-measure" element={<UnitOfMeasures />} />
              <Route path="/users" element={<Users />} />
              <Route path="/settings" element={<Settings />} />
              {/* <-- 2. Tambahkan rute baru */}
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Route>
          
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;