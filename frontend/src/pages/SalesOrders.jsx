import React, { useState, useEffect } from 'react';
import {
    Table, Button, Typography, message, Space, Modal, Form,
    Select, InputNumber, Divider, Descriptions, Tag, Dropdown, Menu, Popconfirm
} from 'antd';
import { PlusOutlined, EyeOutlined, MoreOutlined, CheckCircleOutlined, CloseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

function SalesOrders() {
    // State untuk data utama
    const [salesOrders, setSalesOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State untuk modal & form tambah
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [form] = Form.useForm();
    
    // State untuk modal detail
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // State untuk data master (diambil untuk form)
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const auth = useAuth();

    useEffect(() => {
        if (auth.activeBranch) {
            fetchSalesOrders();
        }
    }, [auth.activeBranch]);

    const fetchSalesOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/sales-orders');
            setSalesOrders(response.data);
        } catch (error) {
            message.error('Gagal memuat data pesanan penjualan.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrerequisites = async () => {
        try {
            const [customersRes, productsRes] = await Promise.all([
                api.get('/customers'),
                api.get('/products')
            ]);
            setCustomers(customersRes.data);
            setProducts(productsRes.data);
        } catch (error) {
            message.error('Gagal memuat data master untuk form.');
        }
    };

    const showAddModal = () => {
        fetchPrerequisites();
        form.resetFields();
        setIsFormModalVisible(true);
    };

    const handleFormCancel = () => {
        setIsFormModalVisible(false);
    };

    const handleFormSubmit = async (values) => {
        if (!values.items || values.items.length === 0) {
            message.error('Harap tambahkan minimal satu produk ke pesanan.');
            return;
        }
        try {
            await api.post('/sales-orders', values);
            message.success('Pesanan penjualan baru berhasil dibuat!');
            handleFormCancel();
            fetchSalesOrders();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Gagal membuat pesanan.';
            message.error(errorMsg);
        }
    };

    const handleViewDetail = async (record) => {
        try {
            const response = await api.get(`/sales-orders/${record.id}`);
            setSelectedOrder(response.data);
            setIsDetailModalVisible(true);
        } catch (error) {
            message.error('Gagal memuat detail pesanan.');
        }
    };

    const handleDetailCancel = () => {
        setIsDetailModalVisible(false);
        setSelectedOrder(null);
    };

    const handleStatusChange = async (orderId, status) => {
        try {
            await api.put(`/sales-orders/${orderId}/status`, { status });
            message.success(`Status pesanan berhasil diubah menjadi '${status}'`);
            fetchSalesOrders();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal mengubah status pesanan.');
        }
    };
    
    const mainColumns = [
        { title: 'Order ID', dataIndex: 'id', key: 'id', sorter: (a,b) => a.id - b.id },
        { title: 'Pelanggan', dataIndex: ['Customer', 'name'], key: 'customer' },
        { title: 'Tanggal Pesan', dataIndex: 'orderDate', key: 'orderDate', render: (date) => dayjs(date).format('DD MMMM YYYY') },
        { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (amount) => `Rp ${parseFloat(amount).toLocaleString('id-ID')}` },
        {
            title: 'Status', dataIndex: 'status', key: 'status',
            render: (status) => {
                let color = 'processing';
                if (status === 'completed') color = 'success';
                if (status === 'cancelled') color = 'error';
                return <Tag color={color}>{status.toUpperCase()}</Tag>;
            }
        },
        {
            title: 'Aksi', key: 'action',
            render: (_, record) => {
                const menu = (
                    <Menu>
                        <Menu.Item key="1" icon={<CheckCircleOutlined />} onClick={() => handleStatusChange(record.id, 'completed')}>
                            Tandai Selesai
                        </Menu.Item>
                        <Menu.Item key="2" icon={<CloseCircleOutlined />}>
                            <Popconfirm
                                title="Batalkan Pesanan?"
                                description="Aksi ini akan mengembalikan stok. Anda yakin?"
                                onConfirm={() => handleStatusChange(record.id, 'cancelled')}
                                okText="Ya, Batalkan" cancelText="Tidak"
                            >
                                Batalkan Pesanan
                            </Popconfirm>
                        </Menu.Item>
                    </Menu>
                );
                return (
                    <Space size="middle">
                        <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Detail</Button>
                        {record.status === 'pending' && (
                            <Dropdown overlay={menu} trigger={['click']}>
                                <Button icon={<MoreOutlined />} />
                            </Dropdown>
                        )}
                    </Space>
                )
            },
        },
    ];

    const detailColumns = [
        { title: 'Nama Produk', dataIndex: ['Product', 'name'], key: 'productName' },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'center' },
        { title: 'Harga Satuan', dataIndex: 'price', key: 'price', align: 'right', render: (price) => `Rp ${parseFloat(price).toLocaleString('id-ID')}` },
        { title: 'Subtotal', key: 'subtotal', align: 'right', render: (_, record) => `Rp ${(parseFloat(record.quantity) * parseFloat(record.price)).toLocaleString('id-ID')}` },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Pesanan Penjualan</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Buat Pesanan Baru
                </Button>
            </div>
            <Table columns={mainColumns} dataSource={salesOrders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

            <Modal title="Buat Pesanan Penjualan Baru" open={isFormModalVisible} onCancel={handleFormCancel} footer={null} width={800} destroyOnClose>
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="customerId" label="Pilih Pelanggan" rules={[{ required: true, message: 'Pelanggan harus dipilih!' }]}>
                        <Select showSearch placeholder="Cari dan pilih pelanggan" optionFilterProp="children" filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
                            {customers.map(c => <Option key={c.id} value={c.id}>{c.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Divider>Detail Produk</Divider>
                    <Form.List name="items">
                        {(fields, { add, remove }) => (
                            <>
                                {fields.map(({ key, name, ...restField }) => (
                                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                                        <Form.Item {...restField} name={[name, 'productId']} rules={[{ required: true, message: 'Produk harus dipilih' }]} style={{ width: '300px' }}>
                                            <Select placeholder="Pilih Produk">
                                                {products.map(p => <Option key={p.id} value={p.id} disabled={p.productType !== 'STOCKABLE' && p.productType !== 'SERVICE'}>{p.name} (Stok: {p.productType === 'STOCKABLE' ? p.quantity : 'N/A'})</Option>)}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Qty' }]}>
                                            <InputNumber min={1} placeholder="Qty" />
                                        </Form.Item>
                                        <DeleteOutlined onClick={() => remove(name)} />
                                    </Space>
                                ))}
                                <Form.Item>
                                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>Tambah Produk</Button>
                                </Form.Item>
                            </>
                        )}
                    </Form.List>
                    <Form.Item style={{ marginTop: '32px', textAlign: 'right' }}>
                        <Button onClick={handleFormCancel} style={{ marginRight: 8 }}>Batal</Button>
                        <Button type="primary" htmlType="submit">Buat Pesanan</Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title={`Detail Pesanan #${selectedOrder?.id}`} open={isDetailModalVisible} onCancel={handleDetailCancel} footer={[<Button key="close" onClick={handleDetailCancel}>Tutup</Button>]} width={800}>
                {selectedOrder && (
                    <>
                        <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
                            <Descriptions.Item label="Pelanggan">{selectedOrder.Customer?.name}</Descriptions.Item>
                            <Descriptions.Item label="Tanggal Pesan">{dayjs(selectedOrder.orderDate).format('DD MMMM YYYY')}</Descriptions.Item>
                            <Descriptions.Item label="Status"><Tag>{selectedOrder.status.toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Total Pesanan"><Text strong>Rp {parseFloat(selectedOrder.totalAmount).toLocaleString('id-ID')}</Text></Descriptions.Item>
                        </Descriptions>
                        <Title level={5}>Rincian Produk</Title>
                        <Table columns={detailColumns} dataSource={selectedOrder.details} rowKey="id" pagination={false} />
                    </>
                )}
            </Modal>
        </div>
    );
}

export default SalesOrders;