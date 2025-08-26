import React, { useState } from 'react';
import { Button, Typography, message, Form, DatePicker, Card, Row, Col, Divider, Spin, Tag } from 'antd';
import api from '../api/axios';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

function BalanceSheet() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();

    const handleFormSubmit = async (values) => {
        setLoading(true);
        setReportData(null);
        try {
            const params = {
                asOfDate: values.asOfDate.format('YYYY-MM-DD'),
            };
            const response = await api.get('/reports/balance-sheet', { params });
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
                <Col><Text>Rp {acc.balance.toLocaleString('id-ID')}</Text></Col>
            </Row>
        ));
    };
    
    // Cek apakah neraca seimbang
    const isBalanced = reportData ? Math.abs(reportData.totalAssets - reportData.totalLiabilitiesAndEquity) < 0.01 : false;

    return (
        <div>
            <Title level={2}>Laporan Neraca (Balance Sheet)</Title>
            <Card style={{ marginBottom: '24px' }}>
                <Form form={form} layout="inline" onFinish={handleFormSubmit}>
                    <Form.Item name="asOfDate" label="Per Tanggal" rules={[{ required: true }]} initialValue={dayjs()}>
                        <DatePicker />
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
                    <Title level={4} style={{textAlign: 'center'}}>Laporan Neraca</Title>
                    <Title level={5} type="secondary" style={{textAlign: 'center', marginTop: 0}}>
                        Per Tanggal {dayjs(reportData.asOfDate).format('DD MMMM YYYY')}
                    </Title>
                    <Divider />

                    <Row gutter={32}>
                        {/* Kolom Aset */}
                        <Col xs={24} md={12}>
                            <Title level={5}>ASET (ASSETS)</Title>
                            <Divider style={{margin: '12px 0'}} />
                            {renderAccountLines(reportData.assets)}
                            <Divider style={{margin: '12px 0', borderTop: '2px solid #333' }} />
                            <Row justify="space-between">
                                <Col><Title level={5}>TOTAL ASET</Title></Col>
                                <Col><Title level={5}>Rp {reportData.totalAssets.toLocaleString('id-ID')}</Title></Col>
                            </Row>
                        </Col>

                        {/* Kolom Kewajiban & Ekuitas */}
                        <Col xs={24} md={12}>
                            <Title level={5}>KEWAJIBAN (LIABILITIES)</Title>
                             <Divider style={{margin: '12px 0'}} />
                            {renderAccountLines(reportData.liabilities)}
                             <Divider style={{margin: '12px 0'}} />
                            <Row justify="space-between">
                                <Col><Title level={5}>Total Kewajiban</Title></Col>
                                <Col><Title level={5}>Rp {reportData.totalLiabilities.toLocaleString('id-ID')}</Title></Col>
                            </Row>

                            <Title level={5} style={{marginTop: '24px'}}>EKUITAS (EQUITY)</Title>
                             <Divider style={{margin: '12px 0'}} />
                            {renderAccountLines(reportData.equity)}
                             <Divider style={{margin: '12px 0'}} />
                             <Row justify="space-between">
                                <Col><Title level={5}>Total Ekuitas</Title></Col>
                                <Col><Title level={5}>Rp {reportData.totalEquity.toLocaleString('id-ID')}</Title></Col>
                            </Row>

                            <Divider style={{margin: '12px 0', borderTop: '2px solid #333' }} />
                            <Row justify="space-between">
                                <Col><Title level={5}>TOTAL KEWAJIBAN & EKUITAS</Title></Col>
                                <Col><Title level={5}>Rp {reportData.totalLiabilitiesAndEquity.toLocaleString('id-ID')}</Title></Col>
                            </Row>
                        </Col>
                    </Row>
                    <Divider />
                    <div style={{textAlign: 'center'}}>
                        <Tag color={isBalanced ? 'success' : 'error'} style={{fontSize: '16px', padding: '8px 16px'}}>
                            {isBalanced ? 'SEIMBANG (BALANCED)' : 'TIDAK SEIMBANG (UNBALANCED)'}
                        </Tag>
                    </div>
                </Card>
            )}
        </div>
    );
}

export default BalanceSheet;