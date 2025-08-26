import React, { useState } from 'react';
import { Button, Typography, message, Form, DatePicker, Card, Row, Col, Statistic, Divider, Spin } from 'antd';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

function ProfitAndLoss() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleFormSubmit = async (values) => {
        setLoading(true);
        setReportData(null);
        try {
            const { dateRange } = values;
            const params = {
                startDate: dateRange[0].format('YYYY-MM-DD'),
                endDate: dateRange[1].format('YYYY-MM-DD'),
            };
            const response = await api.get('/reports/profit-and-loss', { params });
            setReportData(response.data);
        } catch (error) {
            message.error(error.response?.data?.message || 'Gagal mengambil data laporan.');
        } finally {
            setLoading(false);
        }
    };
    
    const renderAccountLines = (accounts) => {
        return accounts.map(acc => (
            <Row key={acc.id} justify="space-between" style={{ marginBottom: '8px' }}>
                <Col><Text>{acc.accountNumber} - {acc.name}</Text></Col>
                <Col><Text>Rp {acc.total.toLocaleString('id-ID')}</Text></Col>
            </Row>
        ));
    };

    return (
        <div>
            <Title level={2}>Laporan Laba Rugi</Title>
            <Card style={{ marginBottom: '24px' }}>
                <Form form={form} layout="inline" onFinish={handleFormSubmit}>
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

            {loading && <div style={{textAlign: 'center', padding: '50px'}}><Spin size="large" /></div>}

            {reportData && (
                <Card>
                    <Title level={4} style={{textAlign: 'center'}}>Laporan Laba Rugi</Title>
                    <Title level={5} type="secondary" style={{textAlign: 'center', marginTop: 0}}>
                        Periode {dayjs(reportData.period.startDate).format('DD MMM YYYY')} - {dayjs(reportData.period.endDate).format('DD MMM YYYY')}
                    </Title>
                    <Divider />
                    
                    <Title level={5}>Pendapatan (Revenue)</Title>
                    {renderAccountLines(reportData.revenues)}
                    <Divider style={{margin: '12px 0'}} />
                    <Row justify="space-between">
                        <Col><Title level={5}>Total Pendapatan</Title></Col>
                        <Col><Title level={5}>Rp {reportData.totalRevenue.toLocaleString('id-ID')}</Title></Col>
                    </Row>
                    
                    <Divider />

                    <Title level={5}>Beban (Expenses)</Title>
                    {renderAccountLines(reportData.expenses)}
                    <Divider style={{margin: '12px 0'}} />
                    <Row justify="space-between">
                        <Col><Title level={5}>Total Beban</Title></Col>
                        <Col><Title level={5}>Rp {reportData.totalExpense.toLocaleString('id-ID')}</Title></Col>
                    </Row>

                    <Divider style={{ borderTop: '2px solid #333' }} />
                    
                    <Row justify="space-between">
                        <Col><Title level={4}>Laba Bersih (Net Profit)</Title></Col>
                        <Col>
                            <Title level={4} type={reportData.netProfit >= 0 ? 'success' : 'danger'}>
                                Rp {reportData.netProfit.toLocaleString('id-ID')}
                            </Title>
                        </Col>
                    </Row>
                </Card>
            )}
        </div>
    );
}

export default ProfitAndLoss;