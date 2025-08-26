import React, { useState, useEffect } from 'react';
import { Table, Button, Typography, message, Form, Select, DatePicker, Card, Row, Col, Statistic } from 'antd';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

function GeneralLedger() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState([]);
    const [form] = Form.useForm();

    useEffect(() => {
        // Ambil daftar akun saat komponen pertama kali dimuat
        const fetchAccounts = async () => {
            try {
                const response = await api.get('/accounts');
                setAccounts(response.data);
            } catch (error) {
                message.error('Gagal memuat daftar akun.');
            }
        };
        fetchAccounts();
    }, []);

    const handleFormSubmit = async (values) => {
        setLoading(true);
        setReportData(null);
        try {
            const { accountId, dateRange } = values;
            const params = {
                accountId,
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
            };
            const response = await api.get('/reports/general-ledger', { params });
            setReportData(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal mengambil data laporan.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'Tanggal', dataIndex: ['JournalEntry', 'date'], render: (date) => dayjs(date).format('DD MMM YYYY') },
        { title: 'Keterangan', dataIndex: ['JournalEntry', 'notes'] },
        { title: 'Ref', dataIndex: ['JournalEntry', 'referenceType'], render: (val, rec) => `${val}-${rec.JournalEntry.referenceId}`},
        { title: 'Debit', dataIndex: 'amount', render: (amount, record) => record.type === 'DEBIT' ? `Rp ${parseFloat(amount).toLocaleString('id-ID')}` : '-' },
        { title: 'Kredit', dataIndex: 'amount', render: (amount, record) => record.type === 'CREDIT' ? `Rp ${parseFloat(amount).toLocaleString('id-ID')}` : '-' },
    ];
    
    // Hitung total dan saldo akhir
    let totalDebit = 0;
    let totalCredit = 0;
    if (reportData) {
        reportData.transactions.forEach(t => {
            if (t.type === 'DEBIT') totalDebit += parseFloat(t.amount);
            if (t.type === 'CREDIT') totalCredit += parseFloat(t.amount);
        });
    }
    const endingBalance = reportData ? reportData.beginningBalance + totalDebit - totalCredit : 0;

    return (
        <div>
            <Title level={2}>Laporan Buku Besar</Title>
            <Card style={{ marginBottom: '24px' }}>
                <Form form={form} layout="inline" onFinish={handleFormSubmit}>
                    <Form.Item name="accountId" label="Pilih Akun" rules={[{ required: true }]}>
                        <Select showSearch placeholder="Pilih akun" style={{ width: 250 }} optionFilterProp="children">
                            {accounts.map(acc => <Option key={acc.id} value={acc.id}>{acc.accountNumber} - {acc.name}</Option>)}
                        </Select>
                    </Form.Item>
                    <Form.Item name="dateRange" label="Periode" rules={[{ required: true }]}>
                        <RangePicker />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Tampilkan Laporan
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            {reportData && (
                <>
                    <Row gutter={16} style={{ marginBottom: 24 }}>
                        <Col span={6}><Statistic title="Saldo Awal" value={reportData.beginningBalance} prefix="Rp" /></Col>
                        <Col span={6}><Statistic title="Total Debit" value={totalDebit} prefix="Rp" valueStyle={{ color: '#3f8600' }} /></Col>
                        <Col span={6}><Statistic title="Total Kredit" value={totalCredit} prefix="Rp" valueStyle={{ color: '#cf1322' }} /></Col>
                        <Col span={6}><Statistic title="Saldo Akhir" value={endingBalance} prefix="Rp" /></Col>
                    </Row>
                    <Table
                        columns={columns}
                        dataSource={reportData.transactions}
                        rowKey="id"
                        bordered
                        title={() => <Title level={4}>Detail Transaksi: {reportData.account.name}</Title>}
                        pagination={false}
                    />
                </>
            )}
        </div>
    );
}

export default GeneralLedger;