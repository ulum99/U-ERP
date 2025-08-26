import React, { useState } from 'react';
import { Table, Button, Typography, message, Form, DatePicker, Card, Statistic, Row, Col } from 'antd';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Title } = Typography;

function TrialBalance() {
    const [reportData, setReportData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const [totals, setTotals] = useState({ debit: 0, credit: 0 });

    const handleFormSubmit = async (values) => {
        setLoading(true);
        setReportData([]);
        try {
            const params = {
                endDate: values.endDate.format('YYYY-MM-DD'),
            };
            const response = await api.get('/reports/trial-balance', { params });
            const data = response.data;
            setReportData(data);

            // Hitung total
            const totalDebit = data.reduce((sum, item) => sum + parseFloat(item.debit), 0);
            const totalCredit = data.reduce((sum, item) => sum + parseFloat(item.credit), 0);
            setTotals({ debit: totalDebit, credit: totalCredit });

        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal mengambil data laporan.');
        } finally {
            setLoading(false);
        }
    };

    const columns = [
        { title: 'No. Akun', dataIndex: 'accountNumber', key: 'accountNumber' },
        { title: 'Nama Akun', dataIndex: 'name', key: 'name' },
        { 
            title: 'Debit', 
            dataIndex: 'debit', 
            key: 'debit',
            align: 'right',
            render: (val) => `Rp ${parseFloat(val).toLocaleString('id-ID')}`
        },
        { 
            title: 'Kredit', 
            dataIndex: 'credit', 
            key: 'credit',
            align: 'right',
            render: (val) => `Rp ${parseFloat(val).toLocaleString('id-ID')}`
        },
    ];

    return (
        <div>
            <Title level={2}>Laporan Neraca Saldo (Trial Balance)</Title>
            <Card style={{ marginBottom: '24px' }}>
                <Form form={form} layout="inline" onFinish={handleFormSubmit}>
                    <Form.Item name="endDate" label="Per Tanggal" rules={[{ required: true }]} initialValue={dayjs()}>
                        <DatePicker />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={loading}>
                            Tampilkan Laporan
                        </Button>
                    </Form.Item>
                </Form>
            </Card>

            <Table
                columns={columns}
                dataSource={reportData}
                rowKey="id"
                bordered
                loading={loading}
                pagination={false}
                summary={() => (
                    <Table.Summary.Row style={{ backgroundColor: '#fafafa', fontWeight: 'bold' }}>
                        <Table.Summary.Cell index={0} colSpan={2}>Total</Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                            <Typography.Text type={totals.debit !== totals.credit ? 'danger' : 'success'}>
                                Rp {totals.debit.toLocaleString('id-ID')}
                            </Typography.Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                             <Typography.Text type={totals.debit !== totals.credit ? 'danger' : 'success'}>
                                Rp {totals.credit.toLocaleString('id-ID')}
                            </Typography.Text>
                        </Table.Summary.Cell>
                    </Table.Summary.Row>
                )}
            />
        </div>
    );
}

export default TrialBalance;