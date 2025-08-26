import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Space, Modal, Form, Input, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;

function Suppliers() {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/suppliers');
            setSuppliers(response.data);
        } catch (error) {
            message.error('Gagal memuat data pemasok.');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = () => {
        setEditingSupplier(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingSupplier(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingSupplier(null);
        form.resetFields();
    };

    const handleFormSubmit = async (values) => {
        try {
            if (editingSupplier) {
                await api.put(`/suppliers/${editingSupplier.id}`, values);
                message.success('Pemasok berhasil diperbarui!');
            } else {
                await api.post('/suppliers', values);
                message.success('Pemasok baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchSuppliers();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Terjadi kesalahan.';
            message.error(errorMsg);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/suppliers/${id}`);
            message.success('Pemasok berhasil dihapus!');
            fetchSuppliers();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Gagal menghapus pemasok.';
            message.error(errorMsg);
        }
    };

    const columns = [
        { title: 'Nama Pemasok', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Telepon', dataIndex: 'phone', key: 'phone' },
        { title: 'Contact Person', dataIndex: 'contactPerson', key: 'contactPerson' },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Pemasok"
                        description="Apakah Anda yakin ingin menghapus pemasok ini?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya, Hapus"
                        cancelText="Batal"
                        placement="topRight"
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
                <Title level={2}>Manajemen Pemasok</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Pemasok
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={suppliers}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingSupplier ? 'Edit Pemasok' : 'Tambah Pemasok Baru'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="name" label="Nama Pemasok" rules={[{ required: true, message: 'Nama tidak boleh kosong!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Format email tidak valid!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Nomor Telepon">
                        <Input />
                    </Form.Item>
                    <Form.Item name="contactPerson" label="Contact Person">
                        <Input />
                    </Form.Item>
                    <Form.Item name="address" label="Alamat">
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

export default Suppliers;