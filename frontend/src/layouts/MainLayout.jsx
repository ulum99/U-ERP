import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Layout, Menu, Typography, Select, Space, Button, message } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  TeamOutlined,
  ShoppingCartOutlined,
  AppstoreOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  SettingOutlined,
  BarChartOutlined,
  UserOutlined
} from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const { Header, Content, Sider, Footer } = Layout;
const { Text } = Typography;
const { Option } = Select;

function MainLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const [allBranches, setAllBranches] = useState([]); // State untuk menyimpan semua cabang bagi superuser
  const auth = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Efek untuk mengambil data cabang jika pengguna adalah superuser
  useEffect(() => {
    if (auth.isSuperUser) {
      const fetchAllBranches = async () => {
        try {
          const response = await api.get('/branches');
          setAllBranches(response.data);
          
          // Jika belum ada cabang aktif di local storage, set yang pertama sebagai default
          if (!auth.activeBranch && response.data.length > 0) {
            const defaultBranchId = response.data[0].id;
            auth.setActiveBranch(defaultBranchId);
            localStorage.setItem('activeBranch', defaultBranchId);
          }
        } catch (error) {
          message.error("Gagal memuat daftar semua cabang.");
        }
      };
      fetchAllBranches();
    }
  }, [auth.isSuperUser, auth.activeBranch, auth.setActiveBranch]);

  // Handler untuk mengganti cabang aktif
  const handleBranchChange = (value) => {
    auth.setActiveBranch(value);
    localStorage.setItem('activeBranch', value);
    // Reload halaman untuk memastikan semua data di-fetch ulang untuk cabang yang baru dipilih
    window.location.reload(); 
  };
  
  // Handler untuk logout
  const handleLogout = () => {
      auth.logout();
      navigate('/login'); // Arahkan ke halaman login setelah logout
  };

  // Definisi item menu untuk sidebar
  const menuItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: <Link to="/dashboard">Dashboard</Link> },
    { 
      key: 'master-data', 
      icon: <AppstoreOutlined />, 
      label: 'Master Data',
      children: [
        { key: '/products', label: <Link to="/products">Produk</Link> },
        { key: '/product-categories', label: <Link to="/product-categories">Kategori Produk</Link> },
        { key: '/units-of-measure', label: <Link to="/units-of-measure">Satuan Produk</Link> },
        { key: '/customers', label: <Link to="/customers">Pelanggan</Link> },
        { key: '/suppliers', label: <Link to="/suppliers">Pemasok</Link> },
      ]
    },
    { 
      key: 'sales', 
      icon: <ShoppingCartOutlined />, 
      label: 'Penjualan',
      children: [
        { key: '/sales-orders', label: <Link to="/sales-orders">Pesanan Penjualan</Link> },
      ]
    },
    {
      key: 'purchasing',
      icon: <ShoppingOutlined />,
      label: 'Pembelian',
      children: [
        { key: '/purchase-orders', label: <Link to="/purchase-orders">Pesanan Pembelian</Link> },
      ]
    },
    { 
      key: 'finance', 
      icon: <DollarCircleOutlined />, 
      label: 'Keuangan',
      children: [
        { key: '/chart-of-accounts', label: <Link to="/chart-of-accounts">Bagan Akun</Link> },
        { key: '/sales-invoices', label: <Link to="/sales-invoices">Faktur Penjualan</Link> },
        { key: '/purchase-invoices', label: <Link to="/purchase-invoices">Tagihan Pembelian</Link> },
      ]
    },
    { 
      key: 'reports', 
      icon: <BarChartOutlined />, 
      label: 'Laporan',
      children: [
        { key: '/general-ledger', label: <Link to="/general-ledger">Buku Besar</Link> },
        { key: '/trial-balance', label: <Link to="/trial-balance">Neraca Saldo</Link> },
        { key: '/profit-and-loss', label: <Link to="/profit-and-loss">Laba Rugi</Link> },
        { key: '/balance-sheet', label: <Link to="/balance-sheet">Neraca</Link> },
      ]
    },
    { 
      key: 'settings', 
      icon: <SettingOutlined />, 
      label: 'Pengaturan',
      children: [
        { key: '/users', label: <Link to="/users">Pengguna</Link> },
        { key: '/tax-rates', label: <Link to="/tax-rates">Pajak</Link> },
        { key: '/settings', label: <Link to="/settings">Pengaturan Umum</Link> },
      ]
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(value) => setCollapsed(value)}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign:'center', color:'white', lineHeight:'32px', borderRadius: '6px' }}>
          {collapsed ? 'ERP' : 'Sistem ERP'}
        </div>
        <Menu 
          theme="dark" 
          selectedKeys={[location.pathname]} 
          mode="inline" 
          items={menuItems} 
        />
      </Sider>
      <Layout>
        <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f0f0f0' }}>
            <div>
                {/* Judul header bisa dibuat dinamis nanti jika perlu */}
            </div>
            <Space size="large">
                <Text>Cabang Aktif:</Text>
                <Select 
                    value={auth.activeBranch ? parseInt(auth.activeBranch, 10) : undefined} 
                    style={{ width: 180 }} 
                    onChange={handleBranchChange}
                    loading={auth.isSuperUser && allBranches.length === 0}
                    placeholder="Pilih Cabang"
                >
                    {auth.isSuperUser
                      ? allBranches.map(branch => (
                          <Option key={branch.id} value={branch.id}>{branch.name}</Option>
                        ))
                      : auth.user?.accessibleBranches.map(branchId => (
                          // Untuk user biasa, lebih baik menampilkan nama cabang. Ini memerlukan pembaruan di AuthContext atau di sini.
                          // Untuk sementara, kita tampilkan ID-nya.
                          <Option key={branchId} value={branchId}>Cabang {branchId}</Option>
                        ))
                    }
                </Select>
                <Space>
                    <UserOutlined />
                    <Text strong>{auth.user?.username}</Text>
                </Space>
                <Button type="primary" danger onClick={handleLogout}>Logout</Button>
            </Space>
        </Header>
        <Content style={{ margin: '16px' }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: '8px' }}>
            {/* Di sini konten dari setiap halaman akan dirender oleh Outlet */}
            <Outlet />
          </div>
        </Content>
        <Footer style={{ textAlign: 'center', color: '#888' }}>
          Sistem ERP ©{new Date().getFullYear()} - Dibuat dengan Ant Design
        </Footer>
      </Layout>
    </Layout>
  );
}

export default MainLayout;