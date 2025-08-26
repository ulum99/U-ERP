import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Space, Modal, Form, Input, Select, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

function ChartOfAccounts() {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingAccount, setEditingAccount] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchAccounts();
    }, []);

    const fetchAccounts = async () => {
        setLoading(true);
        try {
            const response = await api.get('/accounts');
            setAccounts(response.data);
        } catch (error) {
            message.error('Gagal memuat Bagan Akun.');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = () => {
        setEditingAccount(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingAccount(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingAccount(null);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (editingAccount) {
                await api.put(`/accounts/${editingAccount.id}`, values);
                message.success('Akun berhasil diperbarui!');
            } else {
                await api.post('/accounts', values);
                message.success('Akun baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchAccounts();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menyimpan data akun.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/accounts/${id}`);
            message.success('Akun berhasil dihapus!');
            fetchAccounts();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menghapus akun.');
        }
    };

    const columns = [
        { title: 'Nomor Akun', dataIndex: 'accountNumber', key: 'accountNumber', sorter: (a, b) => a.accountNumber.localeCompare(b.accountNumber) },
        { title: 'Nama Akun', dataIndex: 'name', key: 'name' },
        { title: 'Tipe Akun', dataIndex: 'type', key: 'type' },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Akun"
                        description="Apakah Anda yakin? Akun yang sudah dipakai transaksi tidak bisa dihapus."
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
    
    const accountTypes = ['ASSET', 'LIABILITY', 'EQUITY', 'REVENUE', 'EXPENSE'];

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Bagan Akun (Chart of Accounts)</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Akun
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={accounts}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 15 }}
            />

            <Modal title={editingAccount ? 'Edit Akun' : 'Tambah Akun Baru'} open={isModalVisible} onCancel={handleCancel} footer={null}>
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="accountNumber" label="Nomor Akun" rules={[{ required: true }]}>
                        <Input placeholder="Contoh: 1110, 4100" />
                    </Form.Item>
                    <Form.Item name="name" label="Nama Akun" rules={[{ required: true }]}>
                        <Input placeholder="Contoh: Kas di Bank, Pendapatan Penjualan" />
                    </Form.Item>
                    <Form.Item name="type" label="Tipe Akun" rules={[{ required: true }]}>
                        <Select placeholder="Pilih tipe akun">
                            {accountTypes.map(type => <Option key={type} value={type}>{type}</Option>)}
                        </Select>
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

export default ChartOfAccounts;