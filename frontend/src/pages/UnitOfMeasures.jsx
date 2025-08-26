import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Space, Modal, Form, Input, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;

function UnitOfMeasures() {
    const [units, setUnits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingUnit, setEditingUnit] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchUnits();
    }, []);

    const fetchUnits = async () => {
        setLoading(true);
        try {
            const response = await api.get('/units-of-measure');
            setUnits(response.data);
        } catch (error) {
            message.error('Gagal memuat data satuan produk.');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = () => {
        setEditingUnit(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingUnit(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingUnit(null);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (editingUnit) {
                await api.put(`/units-of-measure/${editingUnit.id}`, values);
                message.success('Satuan berhasil diperbarui!');
            } else {
                await api.post('/units-of-measure', values);
                message.success('Satuan baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchUnits();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menyimpan data.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/units-of-measure/${id}`);
            message.success('Satuan berhasil dihapus!');
            fetchUnits();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menghapus satuan.');
        }
    };

    const columns = [
        { title: 'Nama Satuan', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { title: 'Simbol', dataIndex: 'symbol', key: 'symbol' },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Satuan"
                        description="Apakah Anda yakin ingin menghapus satuan ini?"
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
                <Title level={2}>Manajemen Satuan Produk</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Satuan
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={units}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingUnit ? 'Edit Satuan Produk' : 'Tambah Satuan Baru'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="name" label="Nama Satuan" rules={[{ required: true, message: 'Nama tidak boleh kosong!' }]}>
                        <Input placeholder="Contoh: Pieces, Box, Kilogram" />
                    </Form.Item>
                    <Form.Item name="symbol" label="Simbol" rules={[{ required: true, message: 'Simbol tidak boleh kosong!' }]}>
                        <Input placeholder="Contoh: pcs, box, kg" />
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

export default UnitOfMeasures;