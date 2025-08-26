import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Space, Modal, Form, Input, InputNumber, Popconfirm } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '../api/axios';

const { Title } = Typography;

function TaxRates() {
    const [taxRates, setTaxRates] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [editingTaxRate, setEditingTaxRate] = useState(null);
    const [form] = Form.useForm();

    useEffect(() => {
        fetchTaxRates();
    }, []);

    const fetchTaxRates = async () => {
        setLoading(true);
        try {
            const response = await api.get('/tax-rates');
            setTaxRates(response.data);
        } catch (error) {
            message.error('Gagal memuat data pajak.');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = () => {
        setEditingTaxRate(null);
        form.resetFields();
        setIsModalVisible(true);
    };

    const showEditModal = (record) => {
        setEditingTaxRate(record);
        form.setFieldsValue(record);
        setIsModalVisible(true);
    };

    const handleCancel = () => {
        setIsModalVisible(false);
        setEditingTaxRate(null);
    };

    const handleFormSubmit = async (values) => {
        try {
            if (editingTaxRate) {
                await api.put(`/tax-rates/${editingTaxRate.id}`, values);
                message.success('Tarif pajak berhasil diperbarui!');
            } else {
                await api.post('/tax-rates', values);
                message.success('Tarif pajak baru berhasil ditambahkan!');
            }
            handleCancel();
            fetchTaxRates();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menyimpan data.');
        }
    };

    const handleDelete = async (id) => {
        try {
            await api.delete(`/tax-rates/${id}`);
            message.success('Tarif pajak berhasil dihapus!');
            fetchTaxRates();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal menghapus pajak.');
        }
    };

    const columns = [
        { title: 'Nama Pajak', dataIndex: 'name', key: 'name', sorter: (a, b) => a.name.localeCompare(b.name) },
        { 
            title: 'Tarif', 
            dataIndex: 'rate', 
            key: 'rate',
            render: (rate) => `${parseFloat(rate)}%`,
            sorter: (a, b) => a.rate - b.rate,
        },
        {
            title: 'Aksi',
            key: 'action',
            render: (_, record) => (
                <Space size="middle">
                    <Button type="primary" icon={<EditOutlined />} onClick={() => showEditModal(record)}>
                        Edit
                    </Button>
                    <Popconfirm
                        title="Hapus Tarif Pajak"
                        description="Apakah Anda yakin? Pajak yang sudah dipakai transaksi tidak bisa dihapus."
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
                <Title level={2}>Pengaturan Pajak</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Tambah Tarif Pajak
                </Button>
            </div>
            <Table
                columns={columns}
                dataSource={taxRates}
                rowKey="id"
                loading={loading}
                pagination={{ pageSize: 10 }}
            />

            <Modal
                title={editingTaxRate ? 'Edit Tarif Pajak' : 'Tambah Tarif Pajak Baru'}
                open={isModalVisible}
                onCancel={handleCancel}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="name" label="Nama Pajak" rules={[{ required: true, message: 'Nama tidak boleh kosong!' }]}>
                        <Input placeholder="Contoh: PPN, PPh 23" />
                    </Form.Item>
                    <Form.Item name="rate" label="Tarif (%)" rules={[{ required: true, message: 'Tarif tidak boleh kosong!' }]}>
                        <InputNumber min={0} max={100} style={{ width: '100%' }} formatter={(value) => `${value}%`} parser={(value) => value.replace('%', '')} />
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

export default TaxRates;