import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Space, Modal, Form, Input, Select, Tag, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;
const { Option } = Select;

function Users() {
    const [users, setUsers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUser, setEditingUser] = useState(null); // State untuk mode edit
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users');
            setUsers(response.data);
        } catch (error) {
            message.error('Gagal memuat data pengguna.');
        } finally {
            setLoading(false);
        }
    };

    const fetchPrerequisites = async () => {
        try {
            const branchRes = await api.get('/branches');
            setBranches(branchRes.data);
        } catch (error) {
            message.error('Gagal memuat data cabang.');
        }
    };

    const showAddModal = () => {
        setEditingUser(null);
        form.resetFields();
        fetchPrerequisites();
        setIsModalVisible(true);
    };

    // --- FUNGSI BARU UNTUK MENAMPILKAN MODAL EDIT ---
    const showEditModal = (record) => {
        setEditingUser(record);
        form.setFieldsValue({
            ...record,
            branchIds: record.Branches.map(branch => branch.id) // Ambil ID cabang untuk diisi ke form
        });
        fetchPrerequisites();
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingUser(null);
    };

    // --- FUNGSI SUBMIT DIPERBARUI UNTUK MENANGANI EDIT ---
    const handleFormSubmit = async (values) => {
        // Hapus field password jika kosong agar tidak menimpa password lama
        if (editingUser && !values.password) {
            delete values.password;
        }

        try {
            if (editingUser) {
                await api.put(`/users/${editingUser.id}`, values);
                message.success('Pengguna berhasil diperbarui!');
            } else {
                await api.post('/users', values);
                message.success('Pengguna baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menyimpan data pengguna.');
        }
    };

    // --- FUNGSI BARU UNTUK MENGHAPUS PENGGUNA ---
    const handleDelete = async (id) => {
        try {
            await api.delete(`/users/${id}`);
            message.success('Pengguna berhasil dihapus!');
            fetchUsers();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menghapus pengguna.');
        }
    };

    const columns = [
        { title: 'Username', dataIndex: 'username', key: 'username' },
        { title: 'Email', dataIndex: 'email', key: 'email' },
        { title: 'Peran', dataIndex: 'role', key: 'role', render: (role) => <Tag>{role?.toUpperCase()}</Tag> },
        {
            title: 'Akses Cabang',
            dataIndex: 'Branches',
            key: 'branches',
            render: (branches) => (
                <>
                    {branches?.map(branch => <Tag color="blue" key={branch.id}>{branch.name}</Tag>)}
                </>
            ),
        },
        // --- KOLOM AKSI DIPERBARUI ---
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Pengguna"
                        description="Apakah Anda yakin ingin menghapus pengguna ini?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Ya, Hapus"
                        cancelText="Batal"
                    >
                        <Button type="primary" danger icon={<DeleteOutlined />}>
                            Hapus
                        </Button>
                    </Popconfirm>
                </Space>
            )
        },
    ];
    
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Manajemen Pengguna</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Pengguna
                </Button>
            </div>
            <Table columns={columns} dataSource={users} rowKey="id" loading={loading} />

            <Modal
                title={editingUser ? 'Edit Pengguna' : 'Tambah Pengguna Baru'} // Judul modal dinamis
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
                destroyOnClose
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="username" label="Username" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item
                        name="password"
                        label={editingUser ? 'Password Baru (Opsional)' : 'Password Awal'}
                        rules={[{ required: !editingUser }]} // Password hanya wajib saat membuat user baru
                    >
                        <Input.Password placeholder={editingUser ? "Isi untuk mengubah password" : ""} />
                    </Form.Item>
                    <Form.Item name="role" label="Peran" rules={[{ required: true }]}>
                        <Select placeholder="Pilih peran">
                            <Option value="staff">Staff</Option>
                            <Option value="manager">Manager</Option>
                            <Option value="admin">Admin</Option>
                        </Select>
                    </Form.Item>
                    <Form.Item name="branchIds" label="Akses Cabang" rules={[{ required: true }]}>
                        <Select mode="multiple" placeholder="Pilih satu atau lebih cabang">
                            {branches.map(branch => <Option key={branch.id} value={branch.id}>{branch.name}</Option>)}
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

export default Users;