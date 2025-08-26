import React, { useState, useEffect, useRef } from 'react';
import { useReactToPrint } from 'react-to-print';
import {
    Table, Button, Typography, message, Space, Modal, Form,
    Select, DatePicker, Tag, Descriptions, InputNumber, Input
} from 'antd';
import { PlusOutlined, EyeOutlined, DollarCircleOutlined, PrinterOutlined } from '@ant-design/icons';
import api from '../api/axios';
import dayjs from 'dayjs';
import { SalesInvoicePrint } from '../components/printable/SalesInvoicePrint';

const { Title, Text } = Typography;
const { Option } = Select;

function SalesInvoices() {
    // State untuk data utama & loading
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // State untuk modal "Buat Faktur Baru"
    const [isFormModalVisible, setIsFormModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [salesOrders, setSalesOrders] = useState([]);
    const [taxRates, setTaxRates] = useState([]);

    // State untuk modal "Detail" & "Pembayaran"
    const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
    const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
    const [selectedInvoice, setSelectedInvoice] = useState(null);
    const [paymentForm] = Form.useForm();
    
    // State untuk data Pengaturan (untuk cetak PDF)
    const [settings, setSettings] = useState(null);

    // Ref dan hook untuk fungsionalitas cetak PDF
    const printableComponentRef = useRef();
    const handlePrint = useReactToPrint({
        content: () => printableComponentRef.current,
        documentTitle: `Faktur-${selectedInvoice?.invoiceNumber || 'detail'}`,
        onAfterPrint: () => message.success('Dokumen siap untuk dicetak atau disimpan.')
    });

    useEffect(() => {
        fetchInvoices();
    }, []);

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const response = await api.get('/finance/invoices');
            setInvoices(response.data);
        } catch (error) {
            message.error('Gagal memuat data faktur.');
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIKA UNTUK MODAL BUAT FAKTUR ---
    const showAddModal = async () => {
        try {
            const [soRes, taxRes] = await Promise.all([
                api.get('/sales-orders'), // Ambil semua SO
                api.get('/tax-rates')
            ]);
            setSalesOrders(soRes.data);
            setTaxRates(taxRes.data);
            form.resetFields();
            setIsFormModalVisible(true);
        } catch (error) {
            message.error('Gagal memuat data prasyarat untuk form.');
        }
    };

    const handleAddFormSubmit = async (values) => {
        try {
            await api.post('/finance/invoices', values);
            message.success('Faktur baru berhasil dibuat!');
            setIsFormModalVisible(false);
            fetchInvoices();
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal membuat faktur.');
        }
    };

    // --- LOGIKA UNTUK MODAL DETAIL & PEMBAYARAN ---
    const handleViewDetail = async (record) => {
        try {
            setLoading(true);
            const [invoiceRes, settingsRes] = await Promise.all([
                api.get(`/finance/invoices/${record.id}`),
                api.get('/settings')
            ]);
            setSelectedInvoice(invoiceRes.data);
            setSettings(settingsRes.data);
            setIsDetailModalVisible(true);
        } catch (error) {
            message.error('Gagal memuat detail faktur atau pengaturan.');
        } finally {
            setLoading(false);
        }
    };

    const handlePaymentSubmit = async (values) => {
        try {
            await api.post(`/finance/invoices/${selectedInvoice.id}/payments`, values);
            message.success('Pembayaran berhasil dicatat!');
            setIsPaymentModalVisible(false);
            setIsDetailModalVisible(false);
            paymentForm.resetFields();
            fetchInvoices(); // Refresh daftar faktur
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal mencatat pembayaran.');
        }
    };

    // --- DEFINISI KOLOM UNTUK TABEL UTAMA ---
    const mainColumns = [
        { title: 'No. Faktur', dataIndex: 'invoiceNumber', key: 'invoiceNumber', sorter: (a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber) },
        { title: 'Pelanggan', dataIndex: ['Customer', 'name'], key: 'customerName' },
        { title: 'Jatuh Tempo', dataIndex: 'dueDate', key: 'dueDate', render: (date) => dayjs(date).format('DD MMM YYYY') },
        { title: 'Total', dataIndex: 'totalAmount', key: 'totalAmount', align: 'right', render: (val) => `Rp ${parseFloat(val).toLocaleString('id-ID')}` },
        { title: 'Sisa Tagihan', dataIndex: 'balanceDue', key: 'balanceDue', align: 'right', render: (val) => `Rp ${parseFloat(val).toLocaleString('id-ID')}` },
        { title: 'Status', dataIndex: 'status', key: 'status', render: (status) => <Tag color={status === 'paid' ? 'success' : status === 'partial' ? 'warning' : 'processing'}>{status.toUpperCase()}</Tag> },
        { title: 'Aksi', key: 'action', render: (_, record) => (<Button icon={<EyeOutlined />} onClick={() => handleViewDetail(record)}>Detail</Button>) },
    ];
    
    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <Title level={2}>Manajemen Faktur Penjualan</Title>
                <Button type="primary" icon={<PlusOutlined />} size="large" onClick={showAddModal}>
                    Buat Faktur Baru
                </Button>
            </div>
            <Table columns={mainColumns} dataSource={invoices} rowKey="id" loading={loading} />

            {/* --- MODAL UNTUK BUAT FAKTUR BARU --- */}
            <Modal title="Buat Faktur Baru dari Sales Order" open={isFormModalVisible} onCancel={() => setIsFormModalVisible(false)} footer={null} width={600} destroyOnClose>
                <Form form={form} layout="vertical" onFinish={handleAddFormSubmit} style={{ marginTop: '24px' }}>
                    <Form.Item name="salesOrderId" label="Pilih Sales Order" rules={[{ required: true, message: 'Sales Order harus dipilih!' }]}>
                        <Select showSearch placeholder="Pilih Sales Order yang akan ditagih" optionFilterProp="children" filterOption={(input, option) => (option?.children ?? '').toLowerCase().includes(input.toLowerCase())}>
                            {salesOrders.map(so => <Option key={so.id} value={so.id}>SO-{so.id} ({so.Customer?.name})</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="dueDate" label="Tanggal Jatuh Tempo" rules={[{ required: true, message: 'Tanggal jatuh tempo harus diisi!' }]}>
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="taxIds" label="Pajak yang Diterapkan (Opsional)">
                        <Select mode="multiple" allowClear placeholder="Pilih pajak jika ada">
                            {taxRates.map(tax => <Option key={tax.id} value={tax.id}>{tax.name} ({tax.rate}%)</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item style={{ textAlign: 'right', marginTop: '32px' }}>
                        <Button onClick={() => setIsFormModalVisible(false)} style={{ marginRight: 8 }}>Batal</Button>
                        <Button type="primary" htmlType="submit">Buat Faktur</Button>
                    </Form.Item>
                </Form>
            </Modal>
            
            {/* --- MODAL UNTUK MELIHAT DETAIL FAKTUR --- */}
            {selectedInvoice && (
                <>
                    <Modal
                        title={`Detail Faktur #${selectedInvoice.invoiceNumber}`}
                        open={isDetailModalVisible}
                        onCancel={() => setIsDetailModalVisible(false)}
                        width={800}
                        footer={[
                            <Button key="back" onClick={() => setIsDetailModalVisible(false)}>Tutup</Button>,
                            <Button key="print" type="default" icon={<PrinterOutlined />} onClick={handlePrint}>Cetak PDF</Button>,
                            <Button key="pay" type="primary" icon={<DollarCircleOutlined />} onClick={() => setIsPaymentModalVisible(true)} disabled={selectedInvoice.status === 'paid' || selectedInvoice.status === 'void'}>
                                Catat Pembayaran
                            </Button>,
                        ]}
                    >
                        <Descriptions bordered column={2} style={{ marginBottom: 24 }}>
                            <Descriptions.Item label="Pelanggan">{selectedInvoice.Customer?.name}</Descriptions.Item>
                            <Descriptions.Item label="Tgl Terbit">{dayjs(selectedInvoice.issueDate).format('DD MMM YYYY')}</Descriptions.Item>
                            <Descriptions.Item label="Total Tagihan" span={2}><Text strong>Rp {parseFloat(selectedInvoice.totalAmount).toLocaleString('id-ID')}</Text></Descriptions.Item>
                            <Descriptions.Item label="Sisa Tagihan" span={2}><Text strong type="danger">Rp {parseFloat(selectedInvoice.balanceDue).toLocaleString('id-ID')}</Text></Descriptions.Item>
                        </Descriptions>
                        <Title level={5}>Riwayat Pembayaran</Title>
                        <Table dataSource={selectedInvoice.PaymentReceiveds} rowKey="id" pagination={false}
                            columns={[
                                { title: 'Tgl Bayar', dataIndex: 'paymentDate', render: (date) => dayjs(date).format('DD MMM YYYY') },
                                { title: 'Jumlah', dataIndex: 'amount', render: (val) => `Rp ${parseFloat(val).toLocaleString('id-ID')}` },
                                { title: 'Metode', dataIndex: 'paymentMethod' }, { title: 'Ref', dataIndex: 'reference' },
                            ]}
                        />
                    </Modal>

                    {/* --- MODAL UNTUK FORM PEMBAYARAN --- */}
                    <Modal title={`Catat Pembayaran untuk Faktur #${selectedInvoice.invoiceNumber}`} open={isPaymentModalVisible} onCancel={() => setIsPaymentModalVisible(false)} onOk={() => paymentForm.submit()} okText="Simpan Pembayaran" cancelText="Batal">
                        <Form form={paymentForm} layout="vertical" onFinish={handlePaymentSubmit} style={{ marginTop: 24 }}>
                            <Form.Item name="amount" label="Jumlah Pembayaran" initialValue={parseFloat(selectedInvoice.balanceDue)} rules={[{ required: true }]}>
                                <InputNumber min={0} max={parseFloat(selectedInvoice.balanceDue)} style={{ width: '100%' }} formatter={(value) => `Rp ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} parser={(value) => value.replace(/Rp\s?|(,*)/g, '')} />
                            </Form.Item>
                            <Form.Item name="paymentDate" label="Tanggal Bayar" initialValue={dayjs()} rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                            <Form.Item name="paymentMethod" label="Metode Pembayaran" initialValue="bank_transfer" rules={[{ required: true }]}>
                                <Select><Option value="bank_transfer">Bank Transfer</Option><Option value="cash">Tunai</Option><Option value="other">Lainnya</Option></Select>
                            </Form.Item>
                            <Form.Item name="reference" label="No. Referensi"><Input /></Form.Item>
                        </Form>
                    </Modal>
                    
                    {/* Komponen tersembunyi untuk dicetak */}
                    <div style={{ display: 'none' }}>
                        <SalesInvoicePrint ref={printableComponentRef} invoiceData={selectedInvoice} settings={settings} />
                    </div>
                </>
            )}
        </div>
    );
}

export default SalesInvoices;