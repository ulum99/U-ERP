import React, { useState, useEffect } from 'react';
import {
    Table, Button, Typography, message, Space, Modal, Form,
    Input, InputNumber, Popconfirm, Select, Row, Col, Tag
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

function Products() {
    // State untuk data utama & loading
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    // State untuk modal dan form
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [form] = Form.useForm();
    
    // State untuk data master (Kategori & Satuan)
    const [categories, setCategories] = useState([]);
    const [units, setUnits] = useState([]);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/products');
            setProducts(response.data);
        } catch (error) {
            message.error('Gagal memuat data produk.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrerequisites = async () => {
        try {
            const [catRes, uomRes] = await Promise.all([
                api.get('/product-categories'),
                api.get('/units-of-measure')
            ]);
            setCategories(catRes.data);
            setUnits(uomRes.data);
        } catch (error) {
            message.error("Gagal memuat data master untuk form.");
        }
    };

    const showAddModal = () => {
        setEditingProduct(null);
        form.resetFields();
        fetchPrerequisites();
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingProduct(record);
        fetchPrerequisites();
        form.setFieldsValue({
            ...record,
            productCategoryId: record.category?.id,
            unitOfMeasureId: record.uom?.id,
        });
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingProduct(null);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (editingProduct) {
                await api.put(`/products/${editingProduct.id}`, values);
                message.success('Produk berhasil diperbarui!');
            } else {
                await api.post('/products', values);
                message.success('Produk baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchProducts();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Terjadi kesalahan.';
            message.error(errorMsg);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/products/${id}`);
            message.success('Produk berhasil dihapus!');
            fetchProducts();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menghapus produk.');
        }
    };

    // --- PEMBARUAN KOLOM TABEL ---
    const columns = [
        { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120 },
        { title: 'Nama Produk', dataIndex: 'name', key: 'name' },
        { title: 'Tipe', dataIndex: 'productType', key: 'productType', render: type => <Tag>{type}</Tag>, width: 120 },
        { title: 'Kategori', dataIndex: ['category', 'name'], key: 'categoryName', render: (name) => name || '-' },
        { title: 'Stok', dataIndex: 'quantity', key: 'quantity', align: 'right' },
        { title: 'Satuan', dataIndex: ['uom', 'symbol'], key: 'uomSymbol', render: (symbol) => symbol || '-' },
        {
            title: 'Harga Beli', dataIndex: 'costPrice', key: 'costPrice', align: 'right',
            render: (text) => `Rp ${parseFloat(text).toLocaleString('id-ID')}`,
        },
        {
            title: 'Harga Jual', dataIndex: 'sellingPrice', key: 'sellingPrice', align: 'right',
            render: (text) => `Rp ${parseFloat(text).toLocaleString('id-ID')}`,
        },
        {
            title: 'Aksi',
            key: 'action',
            width: 180,
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Produk"
                        description="Apakah Anda yakin?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya"
                        cancelText="Batal"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />}>
                            Hapus
                        </Button>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Manajemen Produk</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Produk
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={products}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
                scroll={{ x: 1200 }} // Aktifkan scroll horizontal jika perlu
            />

            <Modal
                title={editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    {/* --- PEMBARUAN FORM MODAL --- */}
                    <Form.Item name="name" label="Nama Produk" rules={[{ required: true, message: 'Nama produk tidak boleh kosong!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="sku" label="SKU" rules={[{ required: true, message: 'SKU tidak boleh kosong!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="productType" label="Tipe Produk" rules={[{ required: true, message: 'Tipe produk harus dipilih!' }]} initialValue="STOCKABLE">
                        <Select>
                            <Option value="STOCKABLE">Barang Stok (Stockable)</Option>
                            <Option value="SERVICE">Jasa (Service)</Option>
                            <Option value="CONSUMABLE">Barang Habis Pakai (Consumable)</Option>
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="costPrice" label="Harga Beli / Modal" initialValue={0}>
                                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/Rp\s?|(,*)/g, '')} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="sellingPrice" label="Harga Jual" rules={[{ required: true, message: 'Harga jual tidak boleh kosong!' }]}>
                                <InputNumber min={0} style={{ width: '100%' }} formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/Rp\s?|(,*)/g, '')} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="productCategoryId" label="Kategori Produk">
                        <Select placeholder="Pilih kategori" allowClear>
                            {categories.map(cat => <Option key={cat.id} value={cat.id}>{cat.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="quantity" label="Kuantitas Awal" rules={[{ required: true, message: 'Kuantitas tidak boleh kosong!' }]} initialValue={0}>
                                <InputNumber min={0} style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                           <Form.Item name="unitOfMeasureId" label="Satuan Produk">
                                <Select placeholder="Pilih satuan" allowClear>
                                    {units.map(uom => <Option key={uom.id} value={uom.id}>{uom.name} ({uom.symbol})</Option>)}
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    <Form.Item name="description" label="Deskripsi">
                        <Input.TextArea rows={3} />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right' }}>
                        <Button onClick={handleCancel} style={{ marginRight: 8 }}>Batal</Button>
                        <Button type="primary" htmlType="submit">Simpan</Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default Products;