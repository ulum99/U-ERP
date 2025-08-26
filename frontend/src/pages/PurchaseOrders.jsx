import React, { useState, useEffect } from 'react';
import {
    Table, Button, Typography, message, Space, Modal, Form,
    Select, InputNumber, Divider, Popconfirm, Tag, Descriptions
} from 'antd';
import { PlusOutlined, DeleteOutlined, EyeOutlined, CheckCircleOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import { useAuth } from '../context/AuthContext';

const { Title, Text } = Typography;
const { Option } = Select;

function PurchaseOrders() {
    const [purchaseOrders, setPurchaseOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [suppliers, setSuppliers] = useState([]);
    const [products, setProducts] = useState([]);
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [selectedPO, setSelectedPO] = useState(null);
    const auth = useAuth();

    useEffect(() => {
        if (auth.activeBranch) {
            fetchPurchaseOrders();
        }
    }, [auth.activeBranch]);

    const fetchPurchaseOrders = async () => {
        setLoading(true);
        try {
            const response = await api.get('/purchase-orders');
            setPurchaseOrders(response.data);
        } catch (error) {
            message.error('Gagal memuat data pesanan pembelian.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrerequisites = async () => {
        try {
            const [suppliersRes, productsRes] = await Promise.all([
                api.get('/suppliers'),
                api.get('/products')
            ]);
            setSuppliers(suppliersRes.data);
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

    const handleCancel = () => {
        setIsFormModalVisible(false);
    };

    const handleFormSubmit = async (values) => {
        if (!values.items || values.items.length === 0) {
            message.error('Harap tambahkan minimal satu produk ke pesanan.');
            return;
        }
        try {
            await api.post('/purchase-orders', values);
            message.success('Pesanan pembelian baru berhasil dibuat!');
            handleCancel();
            fetchPurchaseOrders();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal membuat pesanan pembelian.');
        }
    };
    
    const handleReceiveGoods = async (poId) => {
        try {
            await api.post(`/purchase-orders/${poId}/receive`);
            message.success(`Barang untuk PO-${poId} berhasil diterima dan stok telah diperbarui!`);
            fetchPurchaseOrders();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal memproses penerimaan barang.');
        }
    };
    
    const handleViewDetail = async (record) => {
        try {
            const response = await api.get(`/purchase-orders/${record.id}`);
            setSelectedPO(response.data);
            setIsDetailModalVisible(true);
        } catch (error) {
            message.error('Gagal memuat detail pesanan.');
        }
    };

    const handleDetailCancel = () => {
        setIsDetailModalVisible(false);
        setSelectedPO(null);
    };

    const mainColumns = [
        { title: 'PO ID', dataIndex: 'id', key: 'id' },
        { title: 'Pemasok', dataIndex: ['Supplier', 'name'], key: 'supplier' },
        { title: 'Tanggal Pesan', dataIndex: 'orderDate', key: 'orderDate', render: (date) => dayjs(date).format('DD MMMM YYYY') },
        { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (amount) => `Rp ${parseFloat(amount).toLocaleString('id-ID')}` },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'completed' ? 'success' : 'processing'}>{status.toUpperCase()}</Tag> },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Detail</Button>
                    {record.status === 'ordered' && (
                        <Popconfirm
                            title="Konfirmasi Penerimaan Barang"
                            description="Aksi ini akan menambah stok produk. Anda yakin?"
                            onConfirm={() => handleReceiveGoods(record.id)}
                            okText="Ya, Terima" cancelText="Batal"
                        >
                            <Button type="primary" icon={<CheckCircleOutlined />}>Terima Barang</Button>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    const detailColumns = [
        { title: 'Nama Produk', dataIndex: ['Product', 'name'], key: 'productName' },
        { title: 'Qty', dataIndex: 'quantity', key: 'quantity', align: 'center' },
        { title: 'Harga Beli', dataIndex: 'price', key: 'price', align: 'right', render: (price) => `Rp ${parseFloat(price).toLocaleString('id-ID')}` },
        { title: 'Subtotal', key: 'subtotal', align: 'right', render: (_, record) => `Rp ${(parseFloat(record.quantity) * parseFloat(record.price)).toLocaleString('id-ID')}` },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Pesanan Pembelian (PO)</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Buat PO Baru
                </Button>
            </div>
            <Table columns={mainColumns} dataSource={purchaseOrders} rowKey="id" loading={loading} pagination={{ pageSize: 10 }} />

            <Modal title="Buat Pesanan Pembelian Baru" open={isFormModalVisible} onCancel={handleCancel} footer={null} width={900} destroyOnClose>
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="supplierId" label="Pilih Pemasok" rules={[{ required: true, message: 'Pemasok harus dipilih!' }]}>
                        <Select showSearch placeholder="Cari dan pilih pemasok" optionFilterProp="children" filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
                            {suppliers.map(s => <Option key={s.id} value={s.id}>{s.name}</Option>)}
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
                                                {products.map(p => <Option key={p.id} value={p.id}>{p.name}</Option>)}
                                            </Select>
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'quantity']} rules={[{ required: true, message: 'Qty' }]}>
                                            <InputNumber min={1} placeholder="Kuantitas" />
                                        </Form.Item>
                                        <Form.Item {...restField} name={[name, 'price']} rules={[{ required: true, message: 'Harga' }]}>
                                            <InputNumber min={0} placeholder="Harga Beli Satuan" style={{ width: 150 }} formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/Rp\s?|(,*)/g, '')} />
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
                        <Button onClick={handleCancel} style={{ marginRight: 8 }}>Batal</Button>
                        <Button type="primary" htmlType="submit">Buat Pesanan</Button>
                    </Form.Item>
                </Form>
            </Modal>
            
            <Modal title={`Detail Pesanan Pembelian #${selectedPO?.id}`} open={isDetailModalVisible} onCancel={handleDetailCancel} footer={[<Button key="close" onClick={handleDetailCancel}>Tutup</Button>]} width={800}>
                {selectedPO && (
                    <>
                        <Descriptions bordered column={2} style={{ marginBottom: '24px' }}>
                            <Descriptions.Item label="Pemasok">{selectedPO.Supplier?.name}</Descriptions.Item>
                            <Descriptions.Item label="Tanggal Pesan">{dayjs(selectedPO.orderDate).format('DD MMMM YYYY')}</Descriptions.Item>
                            <Descriptions.Item label="Status"><Tag>{selectedPO.status.toUpperCase()}</Tag></Descriptions.Item>
                            <Descriptions.Item label="Total Pesanan"><Text strong>Rp {parseFloat(selectedPO.totalAmount).toLocaleString('id-ID')}</Text></Descriptions.Item>
                        </Descriptions>
                        <Title level={5}>Rincian Produk</Title>
                        <Table columns={detailColumns} dataSource={selectedPO.details} rowKey="id" pagination={false} />
                    </>
                )}
            </Modal>
        </div>
    );
}

export default PurchaseOrders;