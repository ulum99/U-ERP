import React, { useState, useEffect } from 'react';
import {
    Table, Button, Typography, message, Space, Modal, Form,
    Select, DatePicker, Tag, Descriptions, InputNumber, Input
} from 'antd';
import { PlusOutlined, EyeOutlined, DollarCircleOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

function PurchaseInvoices() {
    // State utama
    const [bills, setBills] = useState([]);
    const [loading, setLoading] = useState(true);

    // State untuk modal Buat Tagihan
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [purchaseOrders, setPurchaseOrders] = useState([]);

    // State untuk Modal Detail & Pembayaran
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [selectedBill, setSelectedBill] = useState(null);
    const [paymentForm] = Form.useForm();

    useEffect(() => {
        fetchBills();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/bills');
            setBills(response.data);
        } catch (error) {
            message.error('Gagal memuat data tagihan pembelian.');
        } finally {
            setLoading(false);
        }
    };

    const showAddModal = async () => {
        try {
            // Ambil PO yang statusnya sudah 'completed' (barang diterima)
            const poRes = await api.get('/purchase-orders?status=completed');
            setPurchaseOrders(poRes.data);
            form.resetFields();
            setIsFormModalVisible(true);
        } catch (error) {
            message.error('Gagal memuat data Purchase Order.');
        }
    };

    const handleAddFormSubmit = async (values) => {
        try {
            await api.post('/finance/bills', values);
            message.success('Tagihan pemasok baru berhasil dicatat!');
            setIsFormModalVisible(false);
            fetchBills();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal mencatat tagihan.');
        }
    };
    
    const handleViewDetail = async (record) => {
        try {
            const response = await api.get(`/finance/bills/${record.id}`);
            setSelectedBill(response.data);
            setIsDetailModalVisible(true);
        } catch (error) {
            message.error('Gagal memuat detail tagihan.');
        }
    };
    
    const handlePaymentSubmit = async (values) => {
        try {
            await api.post(`/finance/bills/${selectedBill.id}/payments`, values);
            message.success('Pembayaran berhasil dicatat!');
            setIsPaymentModalVisible(false);
            setIsDetailModalVisible(false);
            paymentForm.resetFields();
            fetchBills();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal mencatat pembayaran.');
        }
    };


    const mainColumns = [
        { title: 'No. Tagihan Pemasok', dataIndex: 'supplierInvoiceNumber', key: 'supplierInvoiceNumber' },
        { title: 'Pemasok', dataIndex: ['Supplier', 'name'], key: 'supplierName' },
        { title: 'Jatuh Tempo', dataIndex: 'dueDate', key: 'dueDate', render: (date) => dayjs(date).format('DD MMM YYYY') },
        { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', render: (val) => `Rp ${parseFloat(val).toLocaleString('id-ID')}` },
        { title: 'Sisa Utang', dataIndex: 'balanceDue', key: 'balanceDue', render: (val) => `Rp ${parseFloat(val).toLocaleString('id-ID')}` },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'processing'}>{status.toUpperCase()}</Tag> },
        { title: 'Aksi', key: 'action', render: (_, record) => (<Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Detail</Button>) },
    ];
    
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Manajemen Tagihan Pembelian</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Catat Tagihan Baru
                </Button>
            </div>
            <Table columns={mainColumns} dataSource={bills} rowKey="id" loading={loading} />

            <Modal title="Catat Tagihan Baru dari Purchase Order" open={isFormModalVisible} onCancel={() => setIsFormModalVisible(false)} footer={null} width={600}>
                <Form form={form} layout="vertical" onFinish={handleAddFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="purchaseOrderId" label="Pilih Purchase Order (PO)" rules={[{ required: true }]}>
                        <Select showSearch placeholder="Pilih PO yang barangnya sudah diterima">
                            {purchaseOrders.map(po => <Option key={po.id} value={po.id}>PO-{po.id} ({po.Supplier?.name})</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="supplierInvoiceNumber" label="Nomor Faktur dari Pemasok" rules={[{ required: true }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item name="issueDate" label="Tanggal Tagihan Diterbitkan" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="dueDate" label="Tanggal Jatuh Tempo" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginTop: '32px' }}>
                        <Button onClick={() => setIsFormModalVisible(false)} style={{ marginRight: 8 }}>Batal</Button>
                        <Button type="primary" htmlType="submit">Catat Tagihan</Button>
                    </Form.Item>
                </Form>
            </Modal>
            
            {selectedBill && (
                <Modal
                    title={`Detail Tagihan #${selectedBill.supplierInvoiceNumber}`}
                    open={isDetailModalVisible}
                    onCancel={() => setIsDetailModalVisible(false)}
                    width={800}
                    footer={[
                        <Button key="back" onClick={() => setIsDetailModalVisible(false)}>Tutup</Button>,
                        <Button key="submit" type="primary" icon={<DollarCircleOutlined />} onClick={() => setIsPaymentModalVisible(true)} disabled={selectedBill.status === 'paid' || selectedBill.status === 'void'}>
                            Catat Pembayaran
                        </Button>,
                    ]}
                >
                    {/* ... (Konten modal detail mirip dengan Sales Invoice) ... */}
                </Modal>
            )}

            {selectedBill && (
                <Modal
                    title={`Catat Pembayaran untuk Tagihan #${selectedBill.supplierInvoiceNumber}`}
                    open={isPaymentModalVisible}
                    onCancel={() => setIsPaymentModalVisible(false)}
                    onOk={() => paymentForm.submit()}
                    okText="Simpan Pembayaran"
                    cancelText="Batal"
                >
                    <Form form={paymentForm} layout="vertical" onFinish={handlePaymentSubmit} style={{ marginTop: 24 }}>
                        <Form.Item label="Sisa Utang">
                            <Input disabled value={`Rp ${parseFloat(selectedBill.balanceDue).toLocaleString('id-ID')}`} />
                        </Form.Item>
                        <Form.Item name="amount" label="Jumlah Pembayaran" initialValue={parseFloat(selectedBill.balanceDue)} rules={[{ required: true }]}>
                            <InputNumber min={0} max={parseFloat(selectedBill.balanceDue)} style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="paymentDate" label="Tanggal Bayar" initialValue={dayjs()} rules={[{ required: true }]}>
                            <DatePicker style={{ width: '100%' }} />
                        </Form.Item>
                        <Form.Item name="paymentMethod" label="Metode Pembayaran" rules={[{ required: true }]}>
                            <Select placeholder="Pilih metode">
                                <Option value="bank_transfer">Bank Transfer</Option>
                                <Option value="cash">Tunai</Option>
                                <Option value="other">Lainnya</Option>
                            </Select>
                        </Form.Item>
                        <Form.Item name="reference" label="No. Referensi">
                            <Input />
                        </Form.Item>
                    </Form>
                </Modal>
            )}
        </div>
    );
}

export default PurchaseInvoices;