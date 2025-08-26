import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Space, Modal, Form, Input, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;

function Customers() {
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingCustomer, setEditingCustomer] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchCustomers();
    }, []);

    const fetchCustomers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/customers');
            setCustomers(response.data);
        } catch (error) {
            message.error('Gagal memuat data pelanggan.');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = () => {
        setEditingCustomer(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingCustomer(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingCustomer(null);
        form.resetFields();
    };

    const handleFormSubmit = async (values) => {
        try {
            if (editingCustomer) {
                await api.put(`/customers/${editingCustomer.id}`, values);
                message.success('Pelanggan berhasil diperbarui!');
            } else {
                await api.post('/customers', values);
                message.success('Pelanggan baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchCustomers();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Terjadi kesalahan.';
            message.error(errorMsg);
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/customers/${id}`);
            message.success('Pelanggan berhasil dihapus!');
            fetchCustomers();
        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Gagal menghapus pelanggan.';
            message.error(errorMsg);
        }
    };

    const columns = [
        { title: 'Nama Pelanggan', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Telepon', dataIndex: 'phone', key: 'phone' },
        { title: 'Alamat', dataIndex: 'address', key: 'address' },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Pelanggan"
                        description="Apakah Anda yakin ingin menghapus pelanggan ini?"
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
                <Title level={2}>Manajemen Pelanggan</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Pelanggan
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={customers}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan Baru'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="name" label="Nama Pelanggan" rules={[{ required: true, message: 'Nama tidak boleh kosong!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ type: 'email', message: 'Format email tidak valid!' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Nomor Telepon">
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

export default Customers;