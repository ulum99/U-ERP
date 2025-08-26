import React, { useState, useEffect } from 'react';
import { Card, Col, Row, Statistic, Table, Typography, message } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, DollarCircleOutlined, ShoppingCartOutlined } from '@ant-design/icons';
import { Column } from '@ant-design/charts'; // Import chart
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;

function Dashboard() {
    const [stats, setStats] = useState({
        totalRevenue: 0,
        totalOrders: 0,
        accountsReceivable: 0,
        accountsPayable: 0,
    });
    const [topProducts, setTopProducts] = useState([]);
    const [lowStock, setLowStock] = useState([]);
    const [loading, setLoading] = useState(true);
    const auth = useAuth();

    useEffect(() => {
        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // Mengambil semua data secara paralel untuk efisiensi
                const [summaryRes, snapshotRes, topProductsRes, lowStockRes] = await Promise.all([
                    api.get('/reports/sales-summary?days=30'),
                    api.get('/reports/financial-snapshot'),
                    api.get('/reports/top-selling-products?limit=5'),
                    api.get('/reports/low-stock-products?threshold=10')
                ]);

                setStats({
                    totalRevenue: summaryRes.data.totalRevenue,
                    totalOrders: summaryRes.data.totalOrders,
                    accountsReceivable: snapshotRes.data.accountsReceivable,
                    accountsPayable: snapshotRes.data.accountsPayable,
                });
                setTopProducts(topProductsRes.data);
                setLowStock(lowStockRes.data);

            } catch (error) {
                console.error("Gagal memuat data dashboard:", error);
                message.error('Gagal memuat data dashboard.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [auth.activeBranch]); // Jalankan ulang jika cabang aktif berubah

    // Konfigurasi untuk grafik produk terlaris
    const chartConfig = {
        data: topProducts.map(p => ({
            name: p.Product.name,
            sales: parseInt(p.totalQuantitySold, 10),
        })),
        xField: 'name',
        yField: 'sales',
        //label: {
        //    position: 'middle',
        //    style: { fill: '#FFFFFF', opacity: 0.6 },
        //},
        label: {
        // Label akan berada di dalam batang grafik, posisinya diatur otomatis
        position: 'bottom', 
        // layout adalah cara yang lebih modern untuk menangani label yang tumpang tindih
        layout: [{ type: 'interval-hide-overlap' }], 
    },
        xAxis: { label: { autoHide: true, autoRotate: false } },
        meta: {
            name: { alias: 'Produk' },
            sales: { alias: 'Total Terjual' },
        },
    };

    // Konfigurasi untuk tabel stok menipis
    const lowStockColumns = [
        { title: 'SKU', dataIndex: 'sku', key: 'sku' },
        { title: 'Nama Produk', dataIndex: 'name', key: 'name' },
        { title: 'Sisa Stok', dataIndex: 'quantity', key: 'quantity' },
    ];

    return (
        <div>
            <Title level={2} style={{ marginBottom: '24px' }}>Dashboard Cabang {auth.activeBranch}</Title>
            
            {/* Baris untuk Kartu Statistik (KPI) */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Pendapatan (30 Hari)"
                            value={stats.totalRevenue}
                            precision={2}
                            prefix="Rp"
                            valueStyle={{ color: '#3f8600' }}
                            suffix={<ArrowUpOutlined />}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Piutang Usaha"
                            value={stats.accountsReceivable}
                            precision={2}
                            prefix="Rp"
                            valueStyle={{ color: '#cf1322' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Utang Usaha"
                            value={stats.accountsPayable}
                            precision={2}
                            prefix="Rp"
                            valueStyle={{ color: '#d48806' }}
                        />
                    </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <Card>
                        <Statistic
                            title="Pesanan Baru (30 Hari)"
                            value={stats.totalOrders}
                            prefix={<ShoppingCartOutlined />}
                        />
                    </Card>
                </Col>
            </Row>

            {/* Baris untuk Grafik dan Tabel */}
            <Row gutter={[16, 16]}>
                <Col xs={24} lg={14}>
                    <Card title="5 Produk Terlaris (Berdasarkan Kuantitas)">
                        <Column {...chartConfig} height={300} loading={loading} />
                    </Card>
                </Col>
                <Col xs={24} lg={10}>
                    <Card title="Peringatan Stok Menipis (<= 10)">
                        <Table
                            columns={lowStockColumns}
                            dataSource={lowStock}
                            rowKey="id"
                            loading={loading}
                            pagination={{ pageSize: 5 }}
                        />
                    </Card>
                </Col>
            </Row>
        </div>
    );
}

export default Dashboard;