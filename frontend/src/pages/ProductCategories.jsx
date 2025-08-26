import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Space, Modal, Form, Input, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;

function ProductCategories() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCategory, setEditingCategory] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCategories();
    }, []);

    const fetchCategories = async () => {
        setLoading(true);
        try {
            const response = await api.get('/product-categories');
            setCategories(response.data);
        } catch (error) {
            message.error('Gagal memuat data kategori produk.');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = () => {
        setEditingCategory(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingCategory(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingCategory(null);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (editingCategory) {
                await api.put(`/product-categories/${editingCategory.id}`, values);
                message.success('Kategori berhasil diperbarui!');
            } else {
                await api.post('/product-categories', values);
                message.success('Kategori baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchCategories();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menyimpan data.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/product-categories/${id}`);
            message.success('Kategori berhasil dihapus!');
            fetchCategories();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menghapus kategori.');
        }
    };

    const columns = [
        { title: 'Nama Kategori', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Deskripsi', dataIndex: 'description', key: 'description' },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Kategori"
                        description="Apakah Anda yakin ingin menghapus kategori ini?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya, Hapus"
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
                <Title level={2}>Manajemen Kategori Produk</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Kategori
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={categories}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingCategory ? 'Edit Kategori Produk' : 'Tambah Kategori Baru'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="name" label="Nama Kategori" rules={[{ required: true, message: 'Nama tidak boleh kosong!' }]}>
                        <Input placeholder="Contoh: Elektronik, ATK" />
                    </Form.Item>
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

export default ProductCategories;